import { describe, expect, it } from "vitest";
import { reduplicate } from "../src/core/reduplicator";
import { transformText } from "../src/core/transform";
import { generateCandidates } from "../src/core/reduplicator";
import { analyzeWord } from "../src/core/word-analyzer";

describe("reduplicate", () => {
  it.each([
    ["собака", "хуяка"], ["привет", "хуевет"], ["холодильник", "хуедильник"],
    ["водоворот", "хуеворот"], ["записался", "хуяписался"], ["ряды", "хуяды"],
    ["добровольцев", "хуебровольцев"], ["нашей", "хуяшей"], ["группы", "хуюппы"],
  ])("%s → %s", (word, expected) => expect(reduplicate(word)).toBe(expected));

  it("preserves casing", () => {
    expect(reduplicate("Собака")).toBe("Хуяка");
    expect(reduplicate("СОБАКА")).toBe("ХУЯКА");
  });

  it("handles one syllable, ё, unknown words, and rejects non-Russian tokens", () => {
    expect(reduplicate("сайт")).toBe("хуяйт");
    expect(reduplicate("ёлка")).toBe("хуёлка");
    expect(reduplicate("бармаглот")).toBe("хуемаглот");
    expect(reduplicate("hello")).toBeNull();
    expect(reduplicate("тест2")).toBeNull();
    expect(reduplicate("🙂")).toBeNull();
  });

  it("uses stress candidates and safely skips ambiguous stress", () => {
    const candidates = generateCandidates(analyzeWord("телефон"));
    expect(candidates.length).toBeGreaterThan(1);
    expect(reduplicate("замок")).toBeNull();
    expect(reduplicate("плачу")).toBeNull();
    expect(reduplicate("уезжать")).not.toBe("хуять");
  });
});

describe("transformText", () => {
  it("keeps punctuation and skips Latin, digits and emoji", () => {
    expect(transformText("Привет, hello тест2 🙂", "https://example.test", 100))
      .toBe("Привет-Хуевет, hello тест2 🙂");
  });

  it("is idempotent for already transformed text", () => {
    const once = transformText("собака", "https://example.test", 100);
    expect(transformText(once, "https://example.test", 100)).toBe(once);
  });

  it("selects content words per sentence and keeps neighbours apart", () => {
    const result = transformText("Очень хороший новый телефон работает быстро.", "https://example.test", 100);
    expect(result.match(/-ху/gu)?.length).toBeGreaterThanOrEqual(1);
    expect(result).not.toMatch(/Очень-ху[^ ]* хороший-ху/u);
    expect(transformText("В и на с", "https://example.test", 100)).toBe("В и на с");
  });
});
