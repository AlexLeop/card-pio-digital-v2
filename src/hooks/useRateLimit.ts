
import { useState, useRef } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const [isLimited, setIsLimited] = useState(false);
  const requestTimes = useRef<number[]>([]);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove requests outside the window
    requestTimes.current = requestTimes.current.filter(time => time > windowStart);

    if (requestTimes.current.length >= config.maxRequests) {
      setIsLimited(true);
      setTimeout(() => setIsLimited(false), config.windowMs);
      return false;
    }

    requestTimes.current.push(now);
    return true;
  };

  const reset = () => {
    requestTimes.current = [];
    setIsLimited(false);
  };

  return { checkRateLimit, isLimited, reset };
};
