export type Intensity = 25 | 50 | 100;

export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function shouldTransform(key: string, intensity: Intensity): boolean {
  return stableHash(key) % 100 < intensity;
}
