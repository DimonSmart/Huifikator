# Linguistic data

The extension ships a deliberately small list of common word-form stress positions in `src/core/stress.ts`, rather than a full morphology package. It was manually curated from the openly accessible entries in [Russian Wiktionary](https://ru.wiktionary.org/), which is available under CC BY-SA 3.0. The stored data is only a word form and a vowel ordinal; it contains no copied dictionary definitions or phonetic transcriptions.

`ё` is handled algorithmically as stressed. Known homographs are explicitly marked ambiguous and skipped. Unknown words are transformed only when the conservative fallback can retain at least two final syllables.
