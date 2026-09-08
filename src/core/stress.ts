import { vowelIndexes } from "./syllables";

export type StressConfidence = "known" | "unambiguous" | "unknown" | "ambiguous";

// Vowel ordinal (not character offset). A small built-in vocabulary covers
// common page text without shipping a general NLP dictionary. Homographs are
// deliberately omitted rather than guessed.
const STRESS: Readonly<Record<string, number>> = {
  собака: 1, привет: 1, холодильник: 2, водоворот: 3, записался: 2, ряды: 1, добровольцев: 2, нашей: 0, группы: 0, новости: 0,
  сегодня: 1, правительство: 1, опубликовало: 2, новый: 0, закон: 1, новая: 0, версия: 0, приложения: 1, работает: 1, значительно: 1, быстрее: 0,
  большая: 0, красивая: 1, машина: 1, приехала: 1, домой: 1, бежала: 1, через: 0, дорогу: 1, разработчики: 2, исправили: 1, критическую: 1, ошибка: 0,
  телефон: 1, хороший: 1, очень: 0, важный: 0, интересный: 1, программа: 1, компьютер: 1, интернет: 2, магазин: 1, русский: 0, язык: 0, человек: 0,
  работа: 1, время: 0, город: 0, страна: 0, книга: 0, окно: 1, дорога: 1, система: 1, проект: 1, команда: 1, результат: 2, проблема: 1, решение: 1,
  возможность: 2, приложение: 1, пользователь: 2, данные: 0, текст: 0, страница: 0, качество: 0, алгоритм: 1, функция: 0, метод: 0, сервис: 0,
  музыка: 0, история: 1, погода: 0, дерево: 0, квартира: 1, семья: 0, ребёнок: 1, ёлка: 0, письмо: 0, встреча: 0, сообщение: 1, завтра: 0, вчера: 0,
  быстро: 0, медленно: 0, правильно: 0, удобно: 0, просто: 0, обязательно: 1, пожалуйста: 1, спасибо: 1, конечно: 0, уезжать: 2, отдать: 1, слать: 0,
  написать: 1, читать: 1, говорить: 1, смотреть: 1, купить: 1, найти: 1, понять: 1, москва: 1, россия: 1, петербург: 1, александр: 2, мария: 1,
};

const AMBIGUOUS = new Set(["замок", "плачу", "мука", "атлас", "орган"]);

export interface StressInfo { vowelIndex?: number; confidence: StressConfidence }

export function getStress(word: string): StressInfo {
  const vowels = vowelIndexes(word);
  if (vowels.length === 0) return { confidence: "unknown" };
  const yo = word.indexOf("ё");
  if (yo >= 0) return { vowelIndex: yo, confidence: "unambiguous" };
  if (AMBIGUOUS.has(word)) return { confidence: "ambiguous" };
  const ordinal = STRESS[word];
  if (ordinal !== undefined && vowels[ordinal] !== undefined) return { vowelIndex: vowels[ordinal], confidence: "known" };
  if (vowels.length === 1) return { vowelIndex: vowels[0], confidence: "unambiguous" };
  return { confidence: "unknown" };
}
