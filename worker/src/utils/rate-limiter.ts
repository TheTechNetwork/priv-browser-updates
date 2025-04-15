/**
 * Rate limiter utility for Cloudflare Workers
 * Provides protection against brute force attacks and API abuse
 */

export interface RateLimiterOptions {
  // Maximum number of requests allowed in the time window
  limit: number;
  
  // Time window in seconds
  windowSizeInSeconds: number;
  
  // Function to generate a key for rate limiting (e.g., IP address, user ID)
  keyGenerator: (request: Request) => string;
  
  // KV namespace to store rate limiting data
  kvNamespace: KVNamespace;
  
  // Status code to return when rate limit is exceeded
  statusCode?: number;
  
  // Message to return when rate limit is exceeded
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    limit,
    windowSizeInSeconds,
    keyGenerator,
    kvNamespace,
    statusCode = 429,
    message = 'Too many requests, please try again later',
  } = options;

  return async (c: any, next: () => Promise<Response>) => {
    try {
      const key = keyGenerator(c.req);
      const now = Date.now();
      const windowKey = `${key}:${Math.floor(now / (windowSizeInSeconds * 1000))}`;
      
      // Get current count from KV
      const currentCount = await kvNamespace.get(windowKey);
      const count = currentCount ? parseInt(currentCount, 10) : 0;
      
      // Check if rate limit is exceeded
      if (count >= limit) {
        // Calculate time remaining in the current window
        const windowExpiry = Math.floor(now / (windowSizeInSeconds * 1000) + 1) * (windowSizeInSeconds * 1000);
        const timeRemaining = Math.ceil((windowExpiry - now) / 1000);
        
        // Set rate limit headers
        const headers = {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(windowExpiry / 1000).toString(),
          'Retry-After': timeRemaining.toString(),
        };
        
        // Return rate limit exceeded response
        return new Response(message, {
          status: statusCode,
          headers,
        });
      }
      
      // Increment count in KV
      await kvNamespace.put(windowKey, (count + 1).toString(), {
        expirationTtl: windowSizeInSeconds,
      });
      
      // Set rate limit headers
      c.res.headers.set('X-RateLimit-Limit', limit.toString());
      c.res.headers.set('X-RateLimit-Remaining', (limit - count - 1).toString());
      
      // Continue to next middleware
      return next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      
      // In case of error, allow the request to proceed
      return next();
    }
  };
}

// Specialized rate limiter for authentication endpoints
export function createAuthRateLimiter(kvNamespace: KVNamespace) {
  return createRateLimiter({
    limit: 10,
    windowSizeInSeconds: 60,
    keyGenerator: (request: Request) => {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      return `auth:${ip}`;
    },
    kvNamespace,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later',
  });
}

// Specialized rate limiter for API endpoints
export function createApiRateLimiter(kvNamespace: KVNamespace) {
  return createRateLimiter({
    limit: 100,
    windowSizeInSeconds: 60,
    keyGenerator: (request: Request) => {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      return `api:${ip}`;
    },
    kvNamespace,
    statusCode: 429,
    message: 'API rate limit exceeded, please try again later',
  });
}