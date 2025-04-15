/**
 * Simple rate limiter for Cloudflare Workers using KV
 */
export class RateLimiter {
  private namespace: KVNamespace;
  private maxRequests: number;
  private windowMs: number;

  /**
   * Create a new rate limiter
   * @param namespace KV namespace to use for storing rate limit data
   * @param maxRequests Maximum number of requests allowed in the time window
   * @param windowMs Time window in milliseconds
   */
  constructor(namespace: KVNamespace, maxRequests: number = 10, windowMs: number = 60000) {
    this.namespace = namespace;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request should be rate limited
   * @param key Identifier for the rate limit (e.g., IP address)
   * @returns Object with isLimited flag and remaining requests
   */
  async check(key: string): Promise<{ isLimited: boolean; remaining: number }> {
    // Create a unique key for the rate limit window
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / this.windowMs)}`;
    
    // Get the current count
    const countStr = await this.namespace.get(windowKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    // Check if the rate limit is exceeded
    if (count >= this.maxRequests) {
      return { isLimited: true, remaining: 0 };
    }
    
    // Increment the counter
    const newCount = count + 1;
    
    // Set expiration to the end of the current window plus a small buffer
    const ttl = Math.ceil(this.windowMs - (now % this.windowMs) / 1000) + 10;
    
    // Store the updated count
    await this.namespace.put(windowKey, newCount.toString(), { expirationTtl: ttl });
    
    return { 
      isLimited: false, 
      remaining: this.maxRequests - newCount 
    };
  }
}

/**
 * Create a middleware function for rate limiting
 * @param namespace KV namespace to use for storing rate limit data
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @param keyGenerator Function to generate a key from the request (defaults to IP address)
 * @returns Middleware function
 */
export function createRateLimiter(
  namespace: KVNamespace,
  maxRequests: number = 10,
  windowMs: number = 60000,
  keyGenerator?: (request: Request) => string
) {
  const limiter = new RateLimiter(namespace, maxRequests, windowMs);
  
  return async (request: Request): Promise<Response | null> => {
    // Generate a key for the rate limit
    const key = keyGenerator 
      ? keyGenerator(request) 
      : request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Check if the request should be rate limited
    const { isLimited, remaining } = await limiter.check(key);
    
    // If rate limited, return 429 Too Many Requests
    if (isLimited) {
      return new Response(
        JSON.stringify({ error: 'Too many requests, please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': (windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0'
          } 
        }
      );
    }
    
    // Not rate limited, continue processing
    return null;
  };
}