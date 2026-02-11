import { NextRequest, NextResponse } from 'next/server';
import { getUserSummary } from '@/lib/providers/matchplay';
import { cache, TTL, RATE_LIMIT } from '@/lib/cache';
import { createApiResponse, createErrorResponse, getEnvVar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    const bypassCache = searchParams.get('refresh') === 'true';

    // Get user ID from query or environment default
    const defaultUserId = getEnvVar('DEFAULT_MATCHPLAY_PLAYER_ID', '37737');
    const userId = userIdParam
      ? parseInt(userIdParam, 10)
      : parseInt(defaultUserId, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        createErrorResponse(null, 'Invalid user ID'),
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `matchplay:ratelimit:${clientIp}`;
    
    if (cache.isRateLimited(rateLimitKey, RATE_LIMIT.MAX_REQUESTS, RATE_LIMIT.WINDOW_MS)) {
      return NextResponse.json(
        createErrorResponse(null, 'Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Check cache unless refresh is requested
    const cacheKey = `matchplay:user:${userId}`;
    if (!bypassCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(createApiResponse(cachedData, true));
      }
    }

    // Fetch fresh data
    const userData = await getUserSummary(userId);

    // Cache the result
    cache.set(cacheKey, userData, TTL.FIFTEEN_MINUTES);

    return NextResponse.json(createApiResponse(userData, false));
  } catch (error) {
    console.error('Match Play API route error:', error);
    return NextResponse.json(
      createErrorResponse(error, 'Failed to fetch Match Play data'),
      { status: 500 }
    );
  }
}
