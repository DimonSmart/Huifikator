export const MIN_WORD_LENGTH = 4;
// Unicode-aware boundaries prevent the Cyrillic part of `тест2` or `fooтест`
// from being treated as a standalone word.
export const RUSSIAN_WORD = /(?<![\p{L}\p{N}_])[А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)*(?![\p{L}\p{N}_])/gu;

export function isEligible(word: string): boolean {
  const letters = word.replaceAll("-", "");
  return letters.length >= MIN_WORD_LENGTH && /[аеёиоуыэюя]/iu.test(word);
}
