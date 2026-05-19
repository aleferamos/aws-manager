import { CommonModule } from '@angular/common';
import { Component, Input, Optional, Self, inject } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { AppLanguage } from '../../config/languages.config';
import { LanguageService } from '../../services/language.service';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputIconPosition = 'left' | 'right';

export type InputMask =
  | ''
  | 'cpf'
  | 'cnpj'
  | 'cpfCnpj'
  | 'cep'
  | 'phone'
  | 'date'
  | 'currency'
  | string;

const inputTranslations: Record<AppLanguage, {
  required: string;
  email: string;
  minLength: string;
  maxLength: string;
  passwordMismatch: string;
  invalid: string;
}> = {
  'en-US': {
    required: 'Required field.',
    email: 'Enter a valid email.',
    minLength: 'Minimum of {value} characters.',
    maxLength: 'Maximum of {value} characters.',
    passwordMismatch: 'Passwords do not match.',
    invalid: 'Invalid field.',
  },
  'pt-BR': {
    required: 'Campo obrigatorio.',
    email: 'Informe um email valido.',
    minLength: 'Minimo de {value} caracteres.',
    maxLength: 'Maximo de {value} caracteres.',
    passwordMismatch: 'As senhas nao coincidem.',
    invalid: 'Campo invalido.',
  },
};

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class AppInput implements ControlValueAccessor {
  private languageService = inject(LanguageService);

  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' = 'text';

  @Input() mask: InputMask = '';
  @Input() unmask = false;

  @Input() icon?: string;
  @Input() iconPos: InputIconPosition = 'left';

  @Input() size: InputSize = 'md';
  @Input() fullWidth = true;

  @Input() readonly = false;
  @Input() disabled = false;

  @Input() helperText?: string;
  @Input() error?: string;

  @Input() id = `input-${Math.random().toString(36).slice(2, 9)}`;
  @Input() name?: string;
  @Input() autocomplete?: string;
  @Input() ariaLabel?: string;

  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get hasError(): boolean {
    return !!this.error || !!(this.ngControl?.invalid && this.ngControl?.touched);
  }

  get displayedError(): string | null {
    if (this.error) {
      return this.error;
    }

    const errors = this.ngControl?.errors;

    if (!errors || !this.ngControl?.touched) {
      return null;
    }

    if (errors['required']) {
      return this.t.required;
    }

    if (errors['email']) {
      return this.t.email;
    }

    if (errors['minlength']) {
      return this.t.minLength.replace('{value}', String(errors['minlength'].requiredLength));
    }

    if (errors['maxlength']) {
      return this.t.maxLength.replace('{value}', String(errors['maxlength'].requiredLength));
    }

    if (errors['passwordMismatch']) {
      return this.t.passwordMismatch;
    }

    return this.t.invalid;
  }

  get t() {
    return inputTranslations[this.languageService.currentLanguage];
  }

  get classes(): string[] {
    return [
      'input-control',
      `input-${this.size}`,
      this.icon ? `input-with-icon input-icon-${this.iconPos}` : '',
      this.fullWidth ? 'input-full' : '',
      this.hasError ? 'input-invalid' : '',
      this.disabled ? 'input-disabled' : '',
    ].filter(Boolean);
  }

  writeValue(value: string | number | null): void {
    const rawValue = value === null || value === undefined ? '' : String(value);
    this.value = this.applyMask(rawValue);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const maskedValue = this.applyMask(input.value);
    this.value = maskedValue;
    input.value = maskedValue;

    const valueToEmit = this.unmask ? this.onlyNumbers(maskedValue) : maskedValue;

    this.onChange(valueToEmit);
  }

  handleBlur(): void {
    this.onTouched();
  }

  private applyMask(value: string): string {
    if (!this.mask) {
      return value;
    }

    switch (this.mask) {
      case 'cpf':
        return this.maskByPattern(this.onlyNumbers(value).slice(0, 11), '000.000.000-00');

      case 'cnpj':
        return this.maskByPattern(this.onlyNumbers(value).slice(0, 14), '00.000.000/0000-00');

      case 'cpfCnpj': {
        const numbers = this.onlyNumbers(value).slice(0, 14);
        const pattern = numbers.length <= 11 ? '000.000.000-00' : '00.000.000/0000-00';

        return this.maskByPattern(numbers, pattern);
      }

      case 'cep':
        return this.maskByPattern(this.onlyNumbers(value).slice(0, 8), '00000-000');

      case 'phone': {
        const numbers = this.onlyNumbers(value).slice(0, 11);
        const pattern = numbers.length <= 10 ? '(00) 0000-0000' : '(00) 00000-0000';

        return this.maskByPattern(numbers, pattern);
      }

      case 'date':
        return this.maskByPattern(this.onlyNumbers(value).slice(0, 8), '00/00/0000');

      case 'currency':
        return this.maskCurrency(value);

      default:
        return this.maskByPattern(this.onlyNumbers(value), this.mask);
    }
  }

  private onlyNumbers(value: string): string {
    return value.replace(/\D/g, '');
  }

  private maskByPattern(numbers: string, pattern: string): string {
    let result = '';
    let numberIndex = 0;

    for (let i = 0; i < pattern.length; i++) {
      const patternChar = pattern[i];

      if (patternChar === '0') {
        if (numberIndex >= numbers.length) {
          break;
        }

        result += numbers[numberIndex];
        numberIndex++;
      } else {
        if (numberIndex < numbers.length) {
          result += patternChar;
        }
      }
    }

    return result;
  }

  private maskCurrency(value: string): string {
    const numbers = this.onlyNumbers(value);

    if (!numbers) {
      return '';
    }

    const amount = Number(numbers) / 100;

    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
