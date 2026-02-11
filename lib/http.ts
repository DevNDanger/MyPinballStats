import { ApiResponse } from './types';

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch with timeout, retries, and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      if (!response.ok && attempt < retries) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // Don't retry on abort/timeout for last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new HttpError(`Request timeout after ${timeout}ms`, 408);
  }

  throw lastError || new Error('Request failed');
}

/**
 * Make a GET request and parse JSON response
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new HttpError(
        `HTTP ${response.status}: ${errorText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Create an API response wrapper
 */
export function createApiResponse<T>(
  data: T,
  cached = false
): ApiResponse<T> {
  return {
    success: true,
    data,
    cached,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: unknown,
  message?: string
): ApiResponse<never> {
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : 'An unknown error occurred');

  return {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get environment variable or throw if missing
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}
