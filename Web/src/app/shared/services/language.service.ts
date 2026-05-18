import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AppLanguage, DEFAULT_LANGUAGE, isSupportedLanguage } from '../config/languages.config';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly storageKey = 'app_language';

  private readonly languageSubject = new BehaviorSubject<AppLanguage>(this.getInitialLanguage());

  readonly language$ = this.languageSubject.asObservable();

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value;
  }

  setLanguage(language: AppLanguage): void {
    localStorage.setItem(this.storageKey, language);
    this.languageSubject.next(language);
  }

  private getInitialLanguage(): AppLanguage {
    const storedLanguage = localStorage.getItem(this.storageKey);

    if (isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    return DEFAULT_LANGUAGE;
  }
}
