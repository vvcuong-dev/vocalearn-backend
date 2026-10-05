import pronunciationData from '../modules/dictionary/data/pronunciations.json';

export interface DictionaryPronunciation {
  phonetic: string | null;
  audioUrl: string;
  audioSourceUrl: string;
}

// Keep the static import so TypeScript also emits the JSON in build/watch mode.
export const dictionaryConfig = {
  pronunciations: pronunciationData as Record<string, DictionaryPronunciation>,
  suggestionLimit: 20,
};
