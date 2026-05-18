import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

export type FileInputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-input.html',
  styleUrl: './file-input.scss',
})
export class FileInput implements OnChanges {
  @Input() label?: string;
  @Input() helperText?: string;
  @Input() placeholder = 'Choose file';
  @Input() chooseLabel = 'Browse';
  @Input() icon = 'upload_file';
  @Input() accept?: string;
  @Input() disabled = false;
  @Input() fullWidth = true;
  @Input() size: FileInputSize = 'md';
  @Input() file: File | null = null;
  @Input() id = `file-input-${Math.random().toString(36).slice(2, 9)}`;
  @Input() ariaLabel?: string;

  @Output() fileChange = new EventEmitter<File | null>();

  @ViewChild('nativeInput') private nativeInput?: ElementRef<HTMLInputElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file'] && !this.file && this.nativeInput?.nativeElement) {
      this.nativeInput.nativeElement.value = '';
    }
  }

  get fileName(): string {
    return this.file?.name || this.placeholder;
  }

  get classes(): string[] {
    return [
      'file-input-control',
      `file-input-${this.size}`,
      this.fullWidth ? 'file-input-full' : '',
      this.disabled ? 'file-input-disabled' : '',
      this.file ? 'file-input-has-file' : '',
    ].filter(Boolean);
  }

  openPicker(): void {
    if (this.disabled) {
      return;
    }

    this.nativeInput?.nativeElement.click();
  }

  handleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileChange.emit(input.files?.[0] ?? null);
  }
}
