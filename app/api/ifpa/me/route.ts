import { NextRequest, NextResponse } from 'next/server';
import { getPlayerData } from '@/lib/providers/ifpa';
import { cache, TTL, RATE_LIMIT } from '@/lib/cache';
import { createApiResponse, createErrorResponse, getEnvVar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerIdParam = searchParams.get('playerId');
    const bypassCache = searchParams.get('refresh') === 'true';

    // Get player ID from query or environment default
    const defaultPlayerId = getEnvVar('DEFAULT_IFPA_PLAYER_ID', '67715');
    const playerId = playerIdParam
      ? parseInt(playerIdParam, 10)
      : parseInt(defaultPlayerId, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        createErrorResponse(null, 'Invalid player ID'),
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `ifpa:ratelimit:${clientIp}`;
    
    if (cache.isRateLimited(rateLimitKey, RATE_LIMIT.MAX_REQUESTS, RATE_LIMIT.WINDOW_MS)) {
      return NextResponse.json(
        createErrorResponse(null, 'Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Check cache unless refresh is requested
    const cacheKey = `ifpa:player:${playerId}`;
    if (!bypassCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(createApiResponse(cachedData, true));
      }
    }

    // Fetch fresh data
    const playerData = await getPlayerData(playerId);

    // Cache the result
    cache.set(cacheKey, playerData, TTL.FIFTEEN_MINUTES);

    return NextResponse.json(createApiResponse(playerData, false));
  } catch (error) {
    console.error('IFPA API route error:', error);
    return NextResponse.json(
      createErrorResponse(error, 'Failed to fetch IFPA data'),
      { status: 500 }
    );
  }
}
