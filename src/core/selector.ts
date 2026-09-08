import type { PartOfSpeech } from "./word-analyzer";

export type Intensity = 25 | 50 | 100;

export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const POS_PRIORITY: Readonly<Record<PartOfSpeech, number>> = {
  NOUN: 50, PROPN: 50, VERB: 48, ADJ: 38, ADV: 30, PRON: 5, NUM: 5,
  PREP: -100, CONJ: -100, PART: -100, OTHER: 0,
};

export interface SelectionCandidate { index: number; partOfSpeech: PartOfSpeech; quality: number; tieBreaker: number }

/** Chooses content words together, rather than sampling every token independently. */
export function selectSentence(candidates: SelectionCandidate[], intensity: Intensity): Set<number> {
  const ranked = candidates
    .filter((candidate) => POS_PRIORITY[candidate.partOfSpeech] >= 0)
    .sort((a, b) => (POS_PRIORITY[b.partOfSpeech] + b.quality) - (POS_PRIORITY[a.partOfSpeech] + a.quality) || a.tieBreaker - b.tieBreaker);
  if (ranked.length === 0) return new Set();
  if (intensity === 25 && ranked[0].tieBreaker % 4 !== 0) return new Set();
  const desired = intensity === 25 ? 1 : intensity === 50 ? 1 : Math.min(3, Math.ceil(ranked.length / 3));
  const selected = new Set<number>();
  for (const candidate of ranked) {
    if (selected.size === desired) break;
    if ([...selected].some((index) => Math.abs(index - candidate.index) <= 1)) continue;
    selected.add(candidate.index);
  }
  return selected;
}
