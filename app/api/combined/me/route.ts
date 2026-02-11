import { NextRequest, NextResponse } from 'next/server';
import { getPlayerData } from '@/lib/providers/ifpa';
import { getUserSummary, getRecentOpponents } from '@/lib/providers/matchplay';
import { cache, TTL, RATE_LIMIT } from '@/lib/cache';
import { createApiResponse, createErrorResponse, getEnvVar } from '@/lib/http';
import { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bypassCache = searchParams.get('refresh') === 'true';

    // Get IDs from query params — no fallback to defaults
    const rawIfpaId = searchParams.get('ifpaId');
    const rawMatchPlayId = searchParams.get('matchPlayId');

    // At least one ID must be provided
    if (!rawIfpaId && !rawMatchPlayId) {
      return NextResponse.json(
        createErrorResponse(null, 'At least one player ID is required'),
        { status: 400 }
      );
    }

    const ifpaPlayerId = rawIfpaId ? parseInt(rawIfpaId, 10) : null;
    const matchPlayUserId = rawMatchPlayId ? parseInt(rawMatchPlayId, 10) : null;

    if ((rawIfpaId && (ifpaPlayerId === null || isNaN(ifpaPlayerId))) ||
        (rawMatchPlayId && (matchPlayUserId === null || isNaN(matchPlayUserId)))) {
      return NextResponse.json(
        createErrorResponse(null, 'Invalid player IDs'),
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `combined:ratelimit:${clientIp}`;
    
    if (cache.isRateLimited(rateLimitKey, RATE_LIMIT.MAX_REQUESTS, RATE_LIMIT.WINDOW_MS)) {
      return NextResponse.json(
        createErrorResponse(null, 'Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Check cache unless refresh is requested
    const cacheKey = `combined:${ifpaPlayerId ?? 'none'}:${matchPlayUserId ?? 'none'}`;
    if (!bypassCache) {
      const cachedData = cache.get<DashboardData>(cacheKey);
      if (cachedData) {
        return NextResponse.json(createApiResponse(cachedData, true));
      }
    }

    // Fetch data only from providers whose IDs were supplied
    const [ifpaData, matchPlayData, opponentsData] = await Promise.allSettled([
      ifpaPlayerId ? getPlayerData(ifpaPlayerId) : Promise.reject('No IFPA ID'),
      matchPlayUserId ? getUserSummary(matchPlayUserId) : Promise.reject('No Match Play ID'),
      matchPlayUserId ? getRecentOpponents(matchPlayUserId) : Promise.reject('No Match Play ID'),
    ]);

    // Process IFPA data
    let ifpaResult = null;
    if (ifpaData.status === 'fulfilled') {
      const { stats, stateRanking, eventsByYear } = ifpaData.value;
      ifpaResult = {
        rank: stats?.current_rank,
        wppr: stats?.current_points,
        lastMonthRank: stats?.last_month_rank,
        lastYearRank: stats?.last_year_rank,
        highestRank: stats?.highest_rank,
        ratingsValue: stats?.ratings_value,
        efficiencyValue: stats?.efficiency_value,
        totalEvents: stats?.total_events_all_time,
        stateRanking: stateRanking ?? null,
        eventsByYear: eventsByYear ?? [],
      };
    }

    // Process Match Play data
    let matchPlayResult = null;
    if (matchPlayData.status === 'fulfilled') {
      const { rating, userCounts } = matchPlayData.value;
      // Map ratingClass number to letter grade
      const gradeMap: Record<number, string> = { 1: 'A+', 2: 'A', 3: 'B', 4: 'C', 5: 'D' };
      matchPlayResult = {
        rating: rating?.rating,
        ratingClass: rating?.ratingClass,
        grade: rating?.ratingClass ? (gradeMap[rating.ratingClass] ?? `${rating.ratingClass}`) : undefined,
        gameCount: rating?.gameCount,
        winCount: rating?.winCount,
        lossCount: rating?.lossCount,
        efficiencyPercent: rating?.efficiencyPercent,
        tournamentPlayCount: userCounts?.tournamentPlayCount,
      };
    }

    // Combine identity information
    const ifpaName = ifpaData.status === 'fulfilled'
      ? `${ifpaData.value.player.first_name} ${ifpaData.value.player.last_name}`.trim()
      : null;
    const matchPlayName = matchPlayData.status === 'fulfilled'
      ? matchPlayData.value.user.name?.trim() ?? null
      : null;

    // Detect name mismatch when both providers returned data
    let nameMismatchWarning: string | undefined;
    if (ifpaName && matchPlayName) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
      if (normalize(ifpaName) !== normalize(matchPlayName)) {
        nameMismatchWarning = `IFPA name "${ifpaName}" does not match Match Play name "${matchPlayName}". Make sure both IDs belong to the same player.`;
      }
    }

    const identity = {
      name: ifpaName ?? matchPlayName ?? 'Unknown Player',
      location:
        ifpaData.status === 'fulfilled'
          ? [ifpaData.value.player.city, ifpaData.value.player.stateprov]
              .filter(Boolean)
              .join(', ') || undefined
          : matchPlayData.status === 'fulfilled'
          ? matchPlayData.value.user.location
          : undefined,
      ifpa_id: ifpaPlayerId ?? undefined,
      matchplay_id: matchPlayUserId ?? undefined,
    };

    // Process opponents data — log errors for debugging
    let recentOpponents: DashboardData['recentOpponents'] = [];
    let opponentsError: string | undefined;
    if (opponentsData.status === 'fulfilled') {
      recentOpponents = opponentsData.value;
    } else if (matchPlayUserId) {
      // Only report as error if we actually tried to fetch
      const reason = opponentsData.reason;
      opponentsError =
        reason instanceof Error ? reason.message : String(reason);
      console.error('Recent opponents fetch failed:', opponentsError);
    }

    const dashboardData: DashboardData = {
      identity,
      ifpa: ifpaResult,
      matchplay: matchPlayResult,
      recentOpponents,
      recentOpponentsError: opponentsError,
      nameMismatchWarning,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the combined result
    cache.set(cacheKey, dashboardData, TTL.FIFTEEN_MINUTES);

    return NextResponse.json(createApiResponse(dashboardData, false));
  } catch (error) {
    console.error('Combined API route error:', error);
    return NextResponse.json(
      createErrorResponse(error, 'Failed to fetch combined data'),
      { status: 500 }
    );
  }
}
