import { Component, inject } from '@angular/core';

import { LanguageService } from '../../shared/services/language.service';
import { noAccessTranslations } from './no-access.translations';

@Component({
  selector: 'app-no-access',
  standalone: true,
  templateUrl: './no-access.html',
  styleUrl: './no-access.scss',
})
export class NoAccess {
  private languageService = inject(LanguageService);

  get t() {
    return noAccessTranslations[this.languageService.currentLanguage];
  }
}
