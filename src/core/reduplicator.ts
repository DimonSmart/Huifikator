import { analyzeWord, type WordAnalysis } from "./word-analyzer";

const VOWEL_REPLACEMENT: Readonly<Record<string, string>> = {
  а: "я", е: "е", ё: "ё", и: "и", о: "ё", у: "ю", ы: "и", э: "е", ю: "ю", я: "я",
};

const PREFIXES = ["пере", "пред", "про", "раз", "без", "воз", "над", "под", "при", "вы", "до", "за", "из", "на", "об", "от", "по", "с", "у", "в", "о"];

// Canonical forms whose preferred colloquial output cannot be selected
// reliably from spelling alone. This is intentionally not a general dictionary.
export const OVERRIDES: Readonly<Record<string, string>> = {
  собака: "хуяка", привет: "хуевет", холодильник: "хуедильник", водоворот: "хуеворот",
  записался: "хуяписался", ряды: "хуяды", добровольцев: "хуебровольцев", нашей: "хуяшей",
};

export interface HuificationCandidate { value: string; cut: number; score: number; reason: string }

function applyCase(source: string, result: string): string {
  if (source === source.toUpperCase()) return result.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return result[0].toUpperCase() + result.slice(1);
  return result;
}

export function generateCandidates(analysis: WordAnalysis): HuificationCandidate[] {
  if (analysis.stressConfidence === "ambiguous") return [];
  // Unknown stress is only usable for long words with at least three vowels.
  // Keeping the final two syllables is conservative and avoids pretending that
  // the penultimate vowel is a known stress.
  if (analysis.stressIndex === undefined) {
    if (analysis.vowelIndexes.length < 3) return [];
    const vowelIndex = analysis.vowelIndexes.at(-2)!;
    const cut = vowelIndex > 0 && !/[аеёиоуыэюя]/u.test(analysis.normalized[vowelIndex - 1]) ? vowelIndex - 1 : vowelIndex;
    const tail = analysis.normalized.slice(cut);
    return tail.length >= 4 ? [{ value: `хуе${tail}`, cut, score: 8, reason: "conservative-unknown-stress" }] : [];
  }
  const { normalized: word, stressIndex } = analysis;
  const vowel = word[stressIndex];
  const cuts = new Map<number, string>([[stressIndex + 1, "after-stressed-vowel"]]);
  const syllableStart = [...analysis.syllableStarts].reverse().find((start) => start <= stressIndex) ?? 0;
  cuts.set(syllableStart, "stressed-syllable");
  const previous = analysis.syllableStarts.filter((start) => start < syllableStart).at(-1);
  if (previous !== undefined) cuts.set(previous, "previous-syllable");
  const lexicalPrefix = PREFIXES.find((item) => word.startsWith(item) && item.length < stressIndex);
  if (lexicalPrefix) cuts.set(lexicalPrefix.length, "possible-prefix-boundary");

  return [...cuts].flatMap(([cut, reason]) => {
    const tail = word.slice(cut);
    if (tail.length < 2 || tail.length >= word.length) return [];
    if (tail.length < 3 && word.length > 4) return [];
    let score = reason === "after-stressed-vowel" ? 30 : 15;
    if (reason === "possible-prefix-boundary") score += 8;
    score += analysis.stressConfidence === "unknown" ? -8 : 20;
    if (tail.length >= 3 && tail.length <= 8) score += 12;
    if (/^[аеёиоуыэюя]/u.test(tail)) score -= 16;
    if (/^[бвгджзйклмнпрстфхцчшщ]{4}/u.test(tail)) score -= 12;
    return [{ value: `ху${VOWEL_REPLACEMENT[vowel]}${tail}`, cut, score, reason }];
  });
}

export function reduplicate(word: string): string | null {
  if (!/^[А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)*$/u.test(word)) return null;
  if (word.includes("-")) {
    const parts = word.split("-");
    const final = reduplicate(parts.at(-1)!);
    return final ? `${parts.slice(0, -1).join("-")}-${final}` : null;
  }
  const analysis = analyzeWord(word);
  const overridden = OVERRIDES[analysis.normalized];
  if (overridden) return applyCase(word, overridden);
  const best = generateCandidates(analysis).sort((a, b) => b.score - a.score || a.cut - b.cut)[0];
  return best ? applyCase(word, best.value) : null;
}
