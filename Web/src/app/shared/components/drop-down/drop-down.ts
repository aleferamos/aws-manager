import { Component, ElementRef, HostListener, Input, Optional, Self, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { AppLanguage } from '../../config/languages.config';
import { LanguageService } from '../../services/language.service';

export type DropDownSize = 'sm' | 'md' | 'lg';

export interface DropDownOption {
  label: string;
  value: string | number | boolean | null;
  icon?: string;
  flag?: string;
  description?: string;
  disabled?: boolean;
}

const dropdownTranslations: Record<AppLanguage, {
  required: string;
  invalid: string;
  clearSearch: string;
}> = {
  'en-US': {
    required: 'Required field.',
    invalid: 'Invalid field.',
    clearSearch: 'Clear search',
  },
  'pt-BR': {
    required: 'Campo obrigatorio.',
    invalid: 'Campo invalido.',
    clearSearch: 'Limpar busca',
  },
};

@Component({
  selector: 'app-drop-down',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drop-down.html',
  styleUrl: './drop-down.scss',
})
export class DropDown implements ControlValueAccessor {
  private languageService = inject(LanguageService);

  @Input() options: DropDownOption[] = [];

  @Input() label?: string;
  @Input() placeholder = 'Select';
  @Input() icon?: string;

  @Input() size: DropDownSize = 'md';
  @Input() fullWidth = true;
  @Input() panelMaxHeight = 340;
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Search';
  @Input() emptySearchLabel = 'No options found.';

  @Input() readonly = false;
  @Input() disabled = false;

  @Input() helperText?: string;
  @Input() error?: string;

  @Input() id = `dropdown-${Math.random().toString(36).slice(2, 9)}`;
  @Input() ariaLabel?: string;

  /**
   * Allows clearing the selected value.
   */
  @Input() clearable = false;

  /**
   * Controls whether the list shows a description below the label.
   */
  @Input() showDescription = true;

  value: string | number | boolean | null = null;
  searchTerm = '';
  isOpen = false;
  openUp = false;
  touched = false;

  private onChange: (value: string | number | boolean | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get selectedOption(): DropDownOption | undefined {
    return this.options.find((option) => option.value === this.value);
  }

  get filteredOptions(): DropDownOption[] {
    const normalizedSearch = this.normalizeSearch(this.searchTerm);

    if (!normalizedSearch) {
      return this.options;
    }

    return this.options.filter((option) =>
      [
        option.label,
        option.description,
        option.value,
        option.icon,
        option.flag,
      ]
        .map((value) => this.normalizeSearch(value))
        .some((value) => value.includes(normalizedSearch)),
    );
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
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

    return this.t.invalid;
  }

  get t() {
    return dropdownTranslations[this.languageService.currentLanguage];
  }

  get classes(): string[] {
    return [
      'dropdown',
      `dropdown-${this.size}`,
      this.fullWidth ? 'dropdown-full' : '',
      this.isOpen ? 'dropdown-open' : '',
      this.openUp ? 'dropdown-open-up' : '',
      this.hasError ? 'dropdown-invalid' : '',
      this.disabled ? 'dropdown-disabled' : '',
    ].filter(Boolean);
  }

  writeValue(value: string | number | boolean | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | boolean | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled || this.readonly) {
      return;
    }

    if (!this.isOpen) {
      this.updatePanelDirection();
    }

    this.isOpen = !this.isOpen;
    this.markAsTouched();
  }

  close(): void {
    this.isOpen = false;
    this.openUp = false;
    this.searchTerm = '';
  }

  selectOption(option: DropDownOption): void {
    if (option.disabled) {
      return;
    }

    this.value = option.value;
    this.onChange(option.value);
    this.markAsTouched();
    this.close();
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled || this.readonly) {
      return;
    }

    this.value = null;
    this.onChange(null);
    this.markAsTouched();
  }

  isSelected(option: DropDownOption): boolean {
    return option.value === this.value;
  }

  handleSearchClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private markAsTouched(): void {
    if (this.touched) {
      return;
    }

    this.touched = true;
    this.onTouched();
  }

  private updatePanelDirection(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const boundary = this.elementRef.nativeElement.closest('.dialog-content');
    const boundaryRect = boundary?.getBoundingClientRect();
    const boundaryBottom = boundaryRect?.bottom ?? window.innerHeight;
    const boundaryTop = boundaryRect?.top ?? 0;
    const estimatedPanelHeight = Math.min(
      this.panelMaxHeight,
      Math.max(44, this.filteredOptions.length * 42 + (this.searchable ? 62 : 10)),
    );
    const spaceBelow = boundaryBottom - rect.bottom;
    const spaceAbove = rect.top - boundaryTop;

    this.openUp = spaceBelow < estimatedPanelHeight + 16 && spaceAbove > spaceBelow;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);

    if (!clickedInside) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  handleEscape(): void {
    this.close();
  }

  private normalizeSearch(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
