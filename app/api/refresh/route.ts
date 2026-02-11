import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createApiResponse, createErrorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pattern = searchParams.get('pattern');

    if (pattern) {
      // Clear cache entries matching pattern
      const count = cache.clearPattern(pattern);
      return NextResponse.json(
        createApiResponse({ cleared: count, pattern })
      );
    }

    // Clear all cache
    cache.clear();
    return NextResponse.json(
      createApiResponse({ cleared: 'all', message: 'All cache cleared' })
    );
  } catch (error) {
    console.error('Refresh API route error:', error);
    return NextResponse.json(
      createErrorResponse(error, 'Failed to clear cache'),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = cache.getStats();
    return NextResponse.json(createApiResponse(stats));
  } catch (error) {
    console.error('Refresh API stats error:', error);
    return NextResponse.json(
      createErrorResponse(error, 'Failed to get cache stats'),
      { status: 500 }
    );
  }
}
