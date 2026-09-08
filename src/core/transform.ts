import { reduplicate } from "./reduplicator";
import { selectSentence, stableHash, type Intensity } from "./selector";
import { analyzeWord } from "./word-analyzer";
import { isEligible, RUSSIAN_WORD } from "./tokenizer";

export interface Transformation { start: number; end: number; replacement: string }

function sentenceRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/[.!?…]/u.test(text[index])) { ranges.push([start, index + 1]); start = index + 1; }
  }
  if (start < text.length) ranges.push([start, text.length]);
  return ranges;
}

export function planTransformations(text: string, pageUrl: string, intensity: Intensity): Transformation[] {
  const plan: Transformation[] = [];
  for (const [start, end] of sentenceRanges(text)) {
    const sentence = text.slice(start, end);
    const tokens = [...sentence.matchAll(RUSSIAN_WORD)];
    const candidates = tokens.flatMap((match, index) => {
      const word = match[0];
      const offset = match.index ?? 0;
      if (!isEligible(word) || /-ху[еяёиую]/iu.test(word)) return [];
      const transformed = reduplicate(word);
      if (!transformed) return [];
      const analysis = analyzeWord(word);
      return [{ index, partOfSpeech: analysis.partOfSpeech, quality: analysis.stressConfidence === "unknown" ? 0 : 15, tieBreaker: stableHash(`${pageUrl}\0${analysis.normalized}\0${start + offset}`), word, transformed, offset }];
    });
    const selected = selectSentence(candidates, intensity);
    for (const candidate of candidates) {
      if (selected.has(candidate.index)) plan.push({ start: start + candidate.offset, end: start + candidate.offset + candidate.word.length, replacement: `${candidate.word}-${candidate.transformed}` });
    }
  }
  return plan;
}

export function applyTransformations(text: string, transformations: Transformation[], offset = 0): string {
  const local = transformations.filter((item) => item.start >= offset && item.end <= offset + text.length);
  let cursor = 0;
  let result = "";
  for (const item of local) {
    result += text.slice(cursor, item.start - offset) + item.replacement;
    cursor = item.end - offset;
  }
  return result + text.slice(cursor);
}

export function transformText(text: string, pageUrl: string, intensity: Intensity): string {
  return applyTransformations(text, planTransformations(text, pageUrl, intensity));
}
