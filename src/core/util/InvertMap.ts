export function invertMap<K, V>(m: Map<K, V>): Map<V, K> {
  const out = new Map<V, K>()
  for (const [k, v] of m) {
    out.set(v, k)
  }
  return out
}
