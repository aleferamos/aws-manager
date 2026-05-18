import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { AppLanguage } from './backend.translations';

interface LanguageStore {
  language: AppLanguage;
}

@Injectable()
export class LanguageContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<LanguageStore>();

  run(language: AppLanguage, callback: () => void): void {
    this.asyncLocalStorage.run({ language }, callback);
  }

  getLanguage(): AppLanguage | undefined {
    return this.asyncLocalStorage.getStore()?.language;
  }
}
