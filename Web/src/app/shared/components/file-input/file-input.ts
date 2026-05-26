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
  @Input() files: File[] = [];
  @Input() multiple = false;
  @Input() allowDirectory = false;
  @Input() multipleSelectedLabel = '{count} files selected';
  @Input() id = `file-input-${Math.random().toString(36).slice(2, 9)}`;
  @Input() ariaLabel?: string;

  @Output() fileChange = new EventEmitter<File | null>();
  @Output() filesChange = new EventEmitter<File[]>();

  @ViewChild('nativeInput') private nativeInput?: ElementRef<HTMLInputElement>;

  ngOnChanges(changes: SimpleChanges): void {
    const hasFile = this.multiple ? this.files.length > 0 : !!this.file;

    if ((changes['file'] || changes['files']) && !hasFile && this.nativeInput?.nativeElement) {
      this.nativeInput.nativeElement.value = '';
    }
  }

  get fileName(): string {
    if (this.multiple && this.files.length > 1) {
      return this.multipleSelectedLabel.replace('{count}', String(this.files.length));
    }

    if (this.multiple && this.files.length === 1) {
      return this.files[0].name;
    }

    return this.file?.name || this.placeholder;
  }

  get hasFile(): boolean {
    return this.multiple ? this.files.length > 0 : !!this.file;
  }

  get classes(): string[] {
    return [
      'file-input-control',
      `file-input-${this.size}`,
      this.fullWidth ? 'file-input-full' : '',
      this.disabled ? 'file-input-disabled' : '',
      this.hasFile ? 'file-input-has-file' : '',
    ].filter(Boolean);
  }

  handlePickerClick(event: Event): void {
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    this.openPicker();
  }

  openPicker(event?: Event): void {
    event?.stopPropagation();

    if (this.disabled) {
      return;
    }

    this.nativeInput?.nativeElement.click();
  }

  handleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.filesChange.emit(files);
    this.fileChange.emit(files[0] ?? null);
  }
}
