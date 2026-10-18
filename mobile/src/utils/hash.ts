// FNV-1a hash — deterministic pseudo-random from reference app
export function fnvHash(str: string, min: number, max: number): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return min + (Math.abs(hash) % (max - min + 1));
}
