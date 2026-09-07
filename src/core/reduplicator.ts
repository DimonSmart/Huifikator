const VOWELS = "аеёиоуыэюя";

// Curated forms double as a small, local stress dictionary. The algorithm remains
// deterministic for words absent from it and never performs network requests.
const KNOWN_FORMS: Readonly<Record<string, string>> = {
  собака: "хуяка",
  привет: "хуевет",
  холодильник: "хуедильник",
  водоворот: "хуеворот",
  записался: "хуяписался",
  ряды: "хуяды",
  добровольцев: "хуебровольцев",
  нашей: "хуяшей",
  группы: "хуюппы",
  новости: "хуёвости",
};

const VOWEL_REPLACEMENT: Readonly<Record<string, string>> = {
  а: "я", е: "е", ё: "ё", и: "и", о: "ё",
  у: "ю", ы: "и", э: "е", ю: "ю", я: "я",
};

function applyCase(source: string, result: string): string {
  if (source === source.toUpperCase()) return result.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function fallback(lower: string): string | null {
  const vowelIndexes = [...lower].flatMap((letter, index) =>
    VOWELS.includes(letter) ? [index] : [],
  );
  if (vowelIndexes.length === 0) return null;

  const yoIndex = lower.indexOf("ё");
  if (yoIndex >= 0) {
    return `хуё${lower.slice(yoIndex + 1)}`;
  }

  if (vowelIndexes.length === 1) {
    const vowelIndex = vowelIndexes[0];
    return `ху${VOWEL_REPLACEMENT[lower[vowelIndex]]}${lower.slice(vowelIndex + 1)}`;
  }

  // Unknown stress: retain the final two syllables and use neutral "хуе".
  const penultimateVowel = vowelIndexes.at(-2)!;
  const preceding = lower[penultimateVowel - 1];
  const syllableStart = preceding && !VOWELS.includes(preceding) && preceding !== "-"
    ? penultimateVowel - 1
    : penultimateVowel;
  return `хуе${lower.slice(syllableStart)}`;
}

export function reduplicate(word: string): string | null {
  if (!/^[А-ЯЁа-яё-]+$/u.test(word)) return null;
  const lower = word.toLocaleLowerCase("ru-RU");
  const result = KNOWN_FORMS[lower] ?? fallback(lower);
  return result === null ? null : applyCase(word, result);
}
