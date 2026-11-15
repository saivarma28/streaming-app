// Base API Client with caching and unified fetch handling
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// API Cache system (3 minutes cache TTL for idempotent GET requests)
const apiCache = new Map();
const CACHE_TTL = 3 * 60 * 1000;

/**
 * Clears the in-memory GET response cache.
 * Automatically called upon mutating HTTP operations (POST, PUT, DELETE).
 */
export function clearApiCache() {
  apiCache.clear();
  console.log("[Cache] Cleared API cache.");
}

/**
 * Cached fetch wrapper that adds TTL in-memory caching to GET requests.
 * 
 * @param {string} url - Target URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<Response>}
 */
export async function cachedFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Only cache GET requests
  if (method !== "GET") {
    clearApiCache();
    return window.fetch(url, options);
  }

  const cacheKey = url;
  const now = Date.now();

  if (apiCache.has(cacheKey)) {
    const entry = apiCache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] returning cached response for: ${url}`);
      return entry.response.clone();
    } else {
      apiCache.delete(cacheKey);
    }
  }

  const response = await window.fetch(url, options);
  if (response.ok) {
    apiCache.set(cacheKey, {
      response: response.clone(),
      timestamp: now
    });
  }

  return response;
}

export { BACKEND_URL };
