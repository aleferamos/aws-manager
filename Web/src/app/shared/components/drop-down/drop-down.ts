import { Component, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl } from '@angular/forms';

export type DropDownSize = 'sm' | 'md' | 'lg';

export interface DropDownOption {
  label: string;
  value: string | number | boolean | null;
  icon?: string;
  flag?: string;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-drop-down',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-down.html',
  styleUrl: './drop-down.scss',
})
export class DropDown implements ControlValueAccessor {
  @Input() options: DropDownOption[] = [];

  @Input() label?: string;
  @Input() placeholder = 'Select';
  @Input() icon?: string;

  @Input() size: DropDownSize = 'md';
  @Input() fullWidth = true;

  @Input() readonly = false;
  @Input() disabled = false;

  @Input() helperText?: string;
  @Input() error?: string;

  @Input() id = `dropdown-${Math.random().toString(36).slice(2, 9)}`;
  @Input() ariaLabel?: string;

  /**
   * Permite limpar o valor selecionado.
   */
  @Input() clearable = false;

  /**
   * Controla se a lista mostra descrição abaixo do label.
   */
  @Input() showDescription = true;

  value: string | number | boolean | null = null;
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
      return 'Campo obrigatório.';
    }

    return 'Campo inválido.';
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
    const estimatedPanelHeight = Math.min(260, Math.max(44, this.options.length * 42 + 10));
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
}
