const VOWELS = "аеёиоуыэюя";

export function isVowel(letter: string): boolean {
  return VOWELS.includes(letter);
}

/** Returns the start offsets of rough, but useful, Russian syllables. */
export function syllableStarts(word: string): number[] {
  const starts: number[] = [];
  let previousVowel = -1;
  for (let index = 0; index < word.length; index += 1) {
    if (!isVowel(word[index])) continue;
    if (previousVowel < 0) starts.push(0);
    else {
      let onset = previousVowel + 1;
      if (index - previousVowel > 2) onset = index - 1;
      starts.push(onset);
    }
    previousVowel = index;
  }
  return starts;
}

export function vowelIndexes(word: string): number[] {
  return [...word].flatMap((letter, index) => isVowel(letter) ? [index] : []);
}
