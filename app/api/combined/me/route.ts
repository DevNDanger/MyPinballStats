import { NextRequest, NextResponse } from 'next/server';
import { getPlayerData, getPlayerProfile } from '@/lib/providers/ifpa';
import { getUserSummary, getUserProfile, getRecentOpponents } from '@/lib/providers/matchplay';
import { cache, TTL, RATE_LIMIT } from '@/lib/cache';
import { createApiResponse, createErrorResponse } from '@/lib/http';
import { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Resolve both IFPA and Match Play IDs from a single input.
 * Uses cross-linked IDs from each provider's API.
 */
async function resolvePlayerIds(
  rawIfpaId: string | null,
  rawMatchPlayId: string | null
): Promise<{ ifpaId: number | null; matchPlayId: number | null; idMismatchWarning?: string }> {
  let ifpaId = rawIfpaId ? parseInt(rawIfpaId, 10) : null;
  let matchPlayId = rawMatchPlayId ? parseInt(rawMatchPlayId, 10) : null;
  let idMismatchWarning: string | undefined;

  if (ifpaId && !matchPlayId) {
    // User entered IFPA only — look up linked Match Play ID
    try {
      const player = await getPlayerProfile(ifpaId);
      // IFPA API returns matchplay_events.id as a string — parse to number
      const linkedMpId = Number(player.matchplay_events?.id);
      if (linkedMpId && !isNaN(linkedMpId)) {
        matchPlayId = linkedMpId;
      }
    } catch {
      // IFPA profile fetch failed — continue with IFPA ID only
    }
  } else if (matchPlayId && !ifpaId) {
    // User entered Match Play only — look up linked IFPA ID
    try {
      const profile = await getUserProfile(matchPlayId);
      const linkedIfpaId = Number(profile.user.ifpa_id);
      if (linkedIfpaId && !isNaN(linkedIfpaId)) {
        ifpaId = linkedIfpaId;
      }
    } catch {
      // Match Play profile fetch failed — continue with MP ID only
    }
  } else if (ifpaId && matchPlayId) {
    // Both entered — verify they are actually linked
    try {
      const player = await getPlayerProfile(ifpaId);
      const linkedMpId = Number(player.matchplay_events?.id);
      if (linkedMpId && !isNaN(linkedMpId) && linkedMpId !== matchPlayId) {
        idMismatchWarning = `Your IFPA account is linked to Match Play ID ${linkedMpId}, but you entered ${matchPlayId}. The data shown may be for different players.`;
      }
    } catch {
      // Could not verify — skip warning
    }
  }

  return { ifpaId, matchPlayId, idMismatchWarning };
}

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

    // Validate numeric format before resolving
    if ((rawIfpaId && isNaN(parseInt(rawIfpaId, 10))) ||
        (rawMatchPlayId && isNaN(parseInt(rawMatchPlayId, 10)))) {
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

    // Resolve both IDs via cross-linking
    const { ifpaId: ifpaPlayerId, matchPlayId: matchPlayUserId, idMismatchWarning } =
      await resolvePlayerIds(rawIfpaId, rawMatchPlayId);

    // Check cache unless refresh is requested
    const cacheKey = `combined:${ifpaPlayerId ?? 'none'}:${matchPlayUserId ?? 'none'}`;
    if (!bypassCache) {
      const cachedData = cache.get<DashboardData>(cacheKey);
      if (cachedData) {
        return NextResponse.json(createApiResponse(cachedData, true));
      }
    }

    // Fetch data only from providers whose IDs were resolved
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
      // Map rating_class number to letter grade
      const gradeMap: Record<number, string> = { 1: 'A+', 2: 'A', 3: 'B', 4: 'C', 5: 'D' };
      matchPlayResult = {
        rating: rating?.rating,
        ratingClass: rating?.rating_class,
        grade: rating?.rating_class ? (gradeMap[rating.rating_class] ?? `${rating.rating_class}`) : undefined,
        gameCount: rating?.game_count,
        winCount: rating?.win_count,
        lossCount: rating?.loss_count,
        efficiencyPercent: rating?.efficiency_percent,
        tournamentPlayCount: userCounts?.tournament_play_count,
      };
    }

    // Combine identity information
    const identity = {
      name:
        ifpaData.status === 'fulfilled'
          ? `${ifpaData.value.player.first_name} ${ifpaData.value.player.last_name}`.trim()
          : matchPlayData.status === 'fulfilled'
          ? matchPlayData.value.user.name?.trim() ?? 'Unknown Player'
          : 'Unknown Player',
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
      idMismatchWarning,
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
