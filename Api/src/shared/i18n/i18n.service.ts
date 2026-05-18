import { Injectable } from '@nestjs/common';
import {
  AppLanguage,
  backendTranslations,
  TranslationKey,
} from './backend.translations';
import { LanguageContextService } from './language-context.service';

type TranslateParams = Record<
  string,
  string | number | boolean | null | undefined
>;

@Injectable()
export class I18nService {
  private readonly defaultLanguage: AppLanguage = 'en-US';

  constructor(private readonly languageContext: LanguageContextService) {}

  translate(
    key: TranslationKey,
    params?: TranslateParams,
    language?: string,
  ): string {
    const normalizedLanguage = language
      ? this.normalizeLanguage(language)
      : (this.languageContext.getLanguage() ?? this.defaultLanguage);

    const translatedValue = this.getNestedValue(
      backendTranslations[normalizedLanguage],
      key,
    );

    const fallbackValue = this.getNestedValue(
      backendTranslations[this.defaultLanguage],
      key,
    );

    const value = translatedValue ?? fallbackValue ?? key;

    return this.interpolate(value, params);
  }

  normalizeLanguage(language?: string): AppLanguage {
    if (!language) {
      return this.defaultLanguage;
    }

    const cleanLanguage = language.toLowerCase();

    if (cleanLanguage.startsWith('pt')) {
      return 'pt-BR';
    }

    if (cleanLanguage.startsWith('es')) {
      return 'es-ES';
    }

    if (cleanLanguage.startsWith('en')) {
      return 'en-US';
    }

    return this.defaultLanguage;
  }

  private getNestedValue(
    translations: (typeof backendTranslations)[AppLanguage],
    key: TranslationKey,
  ): string | null {
    const parts = key.split('.');

    let value: any = translations;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'string' ? value : null;
  }

  private interpolate(value: string, params?: TranslateParams): string {
    if (!params) {
      return value;
    }

    return value.replace(/\{(\w+)}/g, (_, key: string) => {
      const paramValue = params[key];

      return paramValue === null || paramValue === undefined
        ? ''
        : String(paramValue);
    });
  }
}
