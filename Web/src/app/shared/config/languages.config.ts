export const APP_LANGUAGES = [
  {
    value: 'en-US',
    label: 'English / US',
    flag: '🇺🇸',
    description: 'United States',
  },
  {
    value: 'pt-BR',
    label: 'Português / BR',
    flag: '🇧🇷',
    description: 'Brasil',
  }
] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number]['value'];

export const DEFAULT_LANGUAGE: AppLanguage = 'en-US';

export function isSupportedLanguage(language: string | null): language is AppLanguage {
  return APP_LANGUAGES.some((item) => item.value === language);
}
