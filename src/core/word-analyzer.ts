import { getStress, type StressConfidence } from "./stress";
import { syllableStarts, vowelIndexes } from "./syllables";

export type PartOfSpeech = "NOUN" | "PROPN" | "VERB" | "ADJ" | "ADV" | "PRON" | "NUM" | "PREP" | "CONJ" | "PART" | "OTHER";

const FUNCTION_WORDS: Readonly<Record<string, PartOfSpeech>> = {
  и: "CONJ", а: "CONJ", но: "CONJ", или: "CONJ", что: "CONJ", чтобы: "CONJ", потому: "CONJ", в: "PREP", во: "PREP", на: "PREP", с: "PREP", со: "PREP", к: "PREP", от: "PREP", до: "PREP", по: "PREP", за: "PREP", из: "PREP", у: "PREP", о: "PREP", об: "PREP", через: "PREP", не: "PART", бы: "PART", же: "PART", ли: "PART", я: "PRON", ты: "PRON", он: "PRON", она: "PRON", мы: "PRON", вы: "PRON", они: "PRON", это: "PRON", который: "PRON",
};

export interface WordAnalysis { normalized: string; syllableStarts: number[]; vowelIndexes: number[]; stressIndex?: number; stressConfidence: StressConfidence; partOfSpeech: PartOfSpeech }

function partOfSpeech(word: string, original: string): PartOfSpeech {
  if (FUNCTION_WORDS[word]) return FUNCTION_WORDS[word];
  if (original[0] !== original[0]?.toLocaleLowerCase("ru-RU") && word.length > 2) return "PROPN";
  if (/(ть|ться|ется|ются|ила|или|ала|яли|ешь|ете|ем|им)$/u.test(word)) return "VERB";
  if (/(ый|ий|ая|ое|ые|ого|ему|ими|ую)$/u.test(word)) return "ADJ";
  if (/(о|е)$/u.test(word) && word.length > 4) return "ADV";
  return "NOUN";
}

const cache = new Map<string, WordAnalysis>();

export function analyzeWord(word: string): WordAnalysis {
  const normalized = word.toLocaleLowerCase("ru-RU");
  const cached = cache.get(normalized);
  if (cached) return { ...cached, partOfSpeech: partOfSpeech(normalized, word) };
  const stress = getStress(normalized);
  const analysis: WordAnalysis = { normalized, syllableStarts: syllableStarts(normalized), vowelIndexes: vowelIndexes(normalized), stressIndex: stress.vowelIndex, stressConfidence: stress.confidence, partOfSpeech: partOfSpeech(normalized, word) };
  cache.set(normalized, analysis);
  return analysis;
}
