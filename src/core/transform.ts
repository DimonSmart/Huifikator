import { reduplicate } from "./reduplicator";
import { shouldTransform, type Intensity } from "./selector";
import { isEligible, RUSSIAN_WORD } from "./tokenizer";

export function transformText(text: string, pageUrl: string, intensity: Intensity): string {
  let occurrence = 0;
  return text.replace(RUSSIAN_WORD, (word) => {
    const index = occurrence++;
    if (!isEligible(word) || /-ху[еяёиую]/iu.test(word)) return word;
    if (!shouldTransform(`${pageUrl}\0${word.toLocaleLowerCase("ru-RU")}\0${index}`, intensity)) {
      return word;
    }
    const transformed = reduplicate(word);
    return transformed ? `${word}-${transformed}` : word;
  });
}
