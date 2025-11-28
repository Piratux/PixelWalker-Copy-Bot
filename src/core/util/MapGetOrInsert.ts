// Source: https://github.com/radashi-org/radashi/blob/main/src/object/getOrInsert.ts
// Refactor when this becomes widely supported: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsert

export function mapGetOrInsert<K, V>(map: Map<K, V>, key: K, value: V): V
export function mapGetOrInsert<K extends object, V>(map: Map<K, V> | WeakMap<K, V>, key: K, value: V): V
export function mapGetOrInsert(
  map: Map<unknown, unknown> | WeakMap<object, unknown>,
  key: unknown,
  value: unknown,
): unknown {
  if (map.has(key as never)) {
    return map.get(key as never)!
  }
  map.set(key as never, value)
  return value
}
