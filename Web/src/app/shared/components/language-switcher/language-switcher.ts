import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';

export type AppLanguage = 'en-US' | 'pt-BR';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  private cdr = inject(ChangeDetectorRef);

  @Input() value: AppLanguage = 'en-US';
  @Output() valueChange = new EventEmitter<AppLanguage>();

  isChanging = false;

  readonly languages = [
    {
      value: 'en-US' as const,
      label: 'English',
      country: 'US',
      flag: '🇺🇸',
    },
    {
      value: 'pt-BR' as const,
      label: 'Português',
      country: 'BR',
      flag: '🇧🇷',
    },
  ];

  get selectedLanguage() {
    return this.languages.find((language) => language.value === this.value) ?? this.languages[0];
  }

  toggleLanguage(): void {
    const nextValue: AppLanguage = this.value === 'en-US' ? 'pt-BR' : 'en-US';

    this.value = nextValue;
    this.valueChange.emit(nextValue);

    this.restartAnimation();
  }

  private restartAnimation(): void {
    this.isChanging = false;
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      this.isChanging = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.isChanging = false;
        this.cdr.detectChanges();
      }, 260);
    });
  }
}
