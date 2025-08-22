/**
 * Wraps quick-lru to clone results on get.
 * @template K,V
 * @param {number} maxSize
 * @param {(v:V)=>V} [clone] - e.g. structuredClone
 */
export function makeCloningLRU(maxSize, clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : v)) {
  // eslint-disable-next-line import/default
  const QuickLRU = (await import('quick-lru')).default;
  const lru = new QuickLRU({ maxSize });
  return {
    /** @param {K} k @param {V} v */ set: (k, v) => (lru.set(k, v), true),
    /** @param {K} k */ get: (k) => (lru.has(k) ? clone(lru.get(k)) : undefined),
    has: (k) => lru.has(k),
    delete: (k) => lru.delete(k),
    clear: () => lru.clear(),
    get size() { return lru.size; },
  };
}
