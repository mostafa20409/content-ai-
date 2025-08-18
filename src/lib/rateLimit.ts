import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

export default function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        
        tokenCount[0] += 1;
        
        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;
        
        isRateLimited ? reject({ type: 'limit' }) : resolve();
      }),
  };
}