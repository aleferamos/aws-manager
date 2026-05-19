import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize, forkJoin } from 'rxjs';

import { AppCard } from '../../../shared/components/card/card';
import { Button } from '../../../shared/components/button/button';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { DropDown, DropDownOption } from '../../../shared/components/drop-down/drop-down';
import { FileInput } from '../../../shared/components/file-input/file-input';
import { AppInput } from '../../../shared/components/input/input';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableCellEvent,
  TableColumn,
  TablePageEvent,
  TableRow,
} from '../../../shared/components/table/table';
import { AppLanguage } from '../../../shared/config/languages.config';
import { getS3ExpressAvailabilityZones } from '../../../shared/config/s3-express-zones.config';
import {
  CredentialContextService,
  SelectedCredential,
} from '../../../shared/services/credential-context.service';
import { LanguageService } from '../../../shared/services/language.service';
import { S3BucketItem, S3ObjectItem, S3Service } from '../../../shared/services/s3.service';
import { ToastService } from '../../../shared/services/toast.service';
import { s3QueryTranslations } from './s3-query.translations';

@Component({
  selector: 'app-s3-query',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppCard,
    AppInput,
    Button,
    ConfirmDialog,
    Dialog,
    DropDown,
    FileInput,
    Table,
  ],
  templateUrl: './s3-query.html',
  styleUrl: './s3-query.scss',
})
export class S3Query implements OnInit {
  private destroyRef = inject(DestroyRef);
  private credentialContext = inject(CredentialContextService);
  private languageService = inject(LanguageService);
  private s3Service = inject(S3Service);
  private toast = inject(ToastService);

  readonly translations = s3QueryTranslations;

  selectedCredential: SelectedCredential | null = null;
  selectedRegion = this.credentialContext.selectedRegion;
  buckets: S3BucketItem[] = [];
  s3Loading = false;
  createDialogOpen = false;
  createLoading = false;
  actionLoading = false;
  bucketName = '';
  bucketType: 'general-purpose' | 'directory' = 'general-purpose';
  availabilityZoneId = '';
  acknowledgeSingleAvailabilityZone = false;
  bucketPendingEmpty: S3BucketItem | null = null;
  bucketPendingDelete: S3BucketItem | null = null;
  bucketPage = 1;
  readonly bucketPageSize = 7;
  readonly bucketPageSizeOptions = [7];
  selectedBucket: S3BucketItem | null = null;
  objectsDialogOpen = false;
  objectsLoading = false;
  objectActionLoading = false;
  objectDownloadLoading = false;
  objects: S3ObjectItem[] = [];
  objectPrefix = '';
  objectKey = '';
  selectedObjectFiles: File[] = [];
  selectedObjectKeys = new Set<string>();
  objectContextMenu: { object: S3ObjectItem; x: number; y: number } | null = null;
  objectPendingRename: S3ObjectItem | null = null;
  renameObjectKey = '';
  objectsPage = 1;
  objectsPageSize = 10;
  readonly objectsPageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    combineLatest([
      this.credentialContext.selectedCredential$,
      this.credentialContext.selectedRegion$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([credential, region]) => {
        this.selectedCredential = credential;
        this.selectedRegion = region;
        this.syncAvailabilityZoneWithRegion(region);

        if (credential) {
          this.loadBuckets(credential, region);
        } else {
          this.buckets = [];
          this.bucketPage = 1;
          this.closeCreateDialog();
          this.closeConfirmDialogs();
        }
      });
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get totalBuckets(): number {
    return this.buckets.length;
  }

  get columns(): TableColumn[] {
    return [
      { field: 'name', header: this.t.table.name, type: 'link', width: '300px' },
      { field: 'region', header: this.t.table.region, width: '160px' },
      { field: 'creationDateLabel', header: this.t.table.creationDate, width: '190px' },
    ];
  }

  get actions(): TableAction[] {
    return [
      {
        key: 'empty',
        label: this.t.table.empty,
        icon: 'delete_sweep',
        severity: 'warn',
      },
      {
        key: 'delete',
        label: this.t.table.delete,
        icon: 'delete',
        severity: 'danger',
      },
    ];
  }

  get availabilityZoneOptions(): DropDownOption[] {
    return getS3ExpressAvailabilityZones(this.selectedRegion).map((zone) => ({
      label: `${zone.regionName} ${zone.id}`,
      value: zone.id,
      description: `Zone ID: ${zone.id}`,
      icon: 'location_on',
    }));
  }

  get directoryBucketsSupported(): boolean {
    return this.availabilityZoneOptions.length > 0;
  }

  get tableRows(): TableRow[] {
    return this.buckets.map((bucket) => ({
      ...bucket,
      region: bucket.region || '-',
      creationDateLabel: this.formatDateTime(bucket.creationDate),
    }));
  }

  get selectedObjectsLabel(): string {
    return this.t.objects.selectedCount.replace('{count}', String(this.selectedObjectKeys.size));
  }

  get allObjectsSelected(): boolean {
    return this.objects.length > 0 && this.objects.every((object) => this.selectedObjectKeys.has(object.key));
  }

  get canUploadObject(): boolean {
    return !!this.selectedBucket && this.selectedObjectFiles.length > 0;
  }

  get canDownloadObjects(): boolean {
    return this.selectedObjectKeys.size > 0 && !this.objectDownloadLoading;
  }

  get objectsPageCount(): number {
    return Math.max(1, Math.ceil(this.objects.length / this.objectsPageSize));
  }

  get currentObjectsPage(): number {
    return Math.min(Math.max(this.objectsPage, 1), this.objectsPageCount);
  }

  get paginatedObjects(): S3ObjectItem[] {
    const start = (this.currentObjectsPage - 1) * this.objectsPageSize;
    return this.objects.slice(start, start + this.objectsPageSize);
  }

  get objectFirstRecord(): number {
    return this.objects.length ? (this.currentObjectsPage - 1) * this.objectsPageSize + 1 : 0;
  }

  get objectLastRecord(): number {
    return Math.min(this.currentObjectsPage * this.objectsPageSize, this.objects.length);
  }

  get objectPaginatorInfo(): string {
    return this.t.objects.showing
      .replace('{first}', String(this.objectFirstRecord))
      .replace('{last}', String(this.objectLastRecord))
      .replace('{total}', String(this.objects.length));
  }

  get canGoPreviousObjectPage(): boolean {
    return this.currentObjectsPage > 1;
  }

  get canGoNextObjectPage(): boolean {
    return this.currentObjectsPage < this.objectsPageCount;
  }

  get canGoParentFolder(): boolean {
    return !!this.objectPrefix;
  }

  get currentFolderLabel(): string {
    return this.objectPrefix || this.t.objects.rootFolder;
  }

  reload(): void {
    if (this.selectedCredential) {
      this.loadBuckets(this.selectedCredential, this.selectedRegion);
    }
  }

  openCreateDialog(): void {
    this.resetCreateForm();
    this.createDialogOpen = true;
  }

  closeCreateDialog(): void {
    if (this.createLoading) {
      return;
    }

    this.createDialogOpen = false;
    this.resetCreateForm();
  }

  createBucket(): void {
    if (!this.selectedCredential || !this.canCreateBucket()) {
      return;
    }

    this.createLoading = true;

    this.s3Service
      .createBucket({
        credentialId: this.selectedCredential.id,
        region: this.selectedRegion,
        bucketName: this.bucketName,
        bucketType: this.bucketType,
        availabilityZoneId:
          this.bucketType === 'directory' ? this.availabilityZoneId : undefined,
        acknowledgeSingleAvailabilityZone:
          this.bucketType === 'directory'
            ? this.acknowledgeSingleAvailabilityZone
            : undefined,
      })
      .pipe(
        finalize(() => {
          this.createLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.createSuccessSummary,
            this.t.toast.createSuccessDetail,
          );
          this.createDialogOpen = false;
          this.resetCreateForm();
          this.reload();
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.createErrorSummary,
            this.getErrorMessage(error, this.t.toast.createErrorDetail),
            5000,
          );
        },
      });
  }

  setBucketType(bucketType: 'general-purpose' | 'directory'): void {
    this.bucketType = bucketType;

    if (bucketType === 'general-purpose') {
      this.availabilityZoneId = '';
      this.acknowledgeSingleAvailabilityZone = false;
    }
  }

  canCreateBucket(): boolean {
    if (!this.bucketName.trim()) {
      return false;
    }

    if (this.bucketType === 'general-purpose') {
      return true;
    }

    return (
      this.directoryBucketsSupported &&
      !!this.availabilityZoneId.trim() &&
      this.acknowledgeSingleAvailabilityZone
    );
  }

  setAvailabilityZoneId(value: string | number | boolean | null): void {
    this.availabilityZoneId = typeof value === 'string' ? value : '';
  }

  handleActionSelected(event: TableActionEvent): void {
    const bucket = this.buckets.find(
      (item) => item.name === String(event.row['name'] ?? ''),
    );

    if (!bucket) {
      return;
    }

    if (event.action.key === 'empty') {
      this.bucketPendingEmpty = bucket;
      return;
    }

    if (event.action.key === 'delete') {
      this.bucketPendingDelete = bucket;
    }
  }

  handleBucketCellSelected(event: TableCellEvent): void {
    if (event.column.field !== 'name') {
      return;
    }

    const bucket = this.buckets.find(
      (item) => item.name === String(event.row['name'] ?? ''),
    );

    if (bucket) {
      this.openObjectsDialog(bucket);
    }
  }

  handleBucketPageChange(event: TablePageEvent): void {
    this.bucketPage = event.page;
  }

  openObjectsDialog(bucket: S3BucketItem): void {
    this.selectedBucket = bucket;
    this.objectsDialogOpen = true;
    this.objectPrefix = '';
    this.objectKey = '';
    this.selectedObjectFiles = [];
    this.selectedObjectKeys.clear();
    this.objectsPage = 1;
    this.loadObjects();
  }

  closeObjectsDialog(): void {
    if (this.objectsLoading || this.objectActionLoading || this.objectDownloadLoading) {
      return;
    }

    this.objectsDialogOpen = false;
    this.selectedBucket = null;
    this.objects = [];
    this.objectPrefix = '';
    this.objectKey = '';
    this.selectedObjectFiles = [];
    this.selectedObjectKeys.clear();
    this.closeObjectContextMenu();
    this.closeRenameDialog();
    this.objectsPage = 1;
  }

  loadObjects(resetPage = true): void {
    if (!this.selectedCredential || !this.selectedBucket) {
      return;
    }

    this.objectsLoading = true;
    this.selectedObjectKeys.clear();

    if (resetPage) {
      this.objectsPage = 1;
    }

    this.s3Service
      .listObjects(this.selectedBucket.name, {
        credentialId: this.selectedCredential.id,
        region: this.resolveBucketRegion(this.selectedBucket),
        prefix: this.objectPrefix,
        maxKeys: 1000,
      })
      .pipe(
        finalize(() => {
          this.objectsLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.objects = response.items ?? [];
          this.ensureValidObjectsPage();
        },
        error: (error) => {
          this.objects = [];
          this.objectsPage = 1;
          this.toast.error(
            this.t.toast.objectListErrorSummary,
            this.getErrorMessage(error, this.t.toast.objectListErrorDetail),
            5000,
          );
        },
      });
  }

  handleObjectFilesSelected(files: File[]): void {
    this.selectedObjectFiles = files;

    if (files.length === 1 && !this.objectKey.trim()) {
      this.objectKey = `${this.objectPrefix || ''}${files[0].name}`;
    }
  }

  uploadObject(): void {
    if (!this.selectedCredential || !this.selectedBucket || this.selectedObjectFiles.length === 0) {
      return;
    }

    this.objectActionLoading = true;

    const selectedBucket = this.selectedBucket;
    const query = {
      credentialId: this.selectedCredential.id,
      region: this.resolveBucketRegion(selectedBucket),
    };
    const uploads = this.selectedObjectFiles.map((file) =>
      this.s3Service.uploadObject(
        selectedBucket.name,
        query,
        this.buildUploadObjectKey(file),
        file,
      ),
    );

    forkJoin(uploads)
      .pipe(
        finalize(() => {
          this.objectActionLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.objectUploadSuccessSummary,
            this.t.toast.objectUploadSuccessDetail,
          );
          this.objectKey = '';
          this.selectedObjectFiles = [];
          this.loadObjects();
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.objectUploadErrorSummary,
            this.getErrorMessage(error, this.t.toast.objectUploadErrorDetail),
            5000,
          );
        },
      });
  }

  toggleObjectSelection(key: string, checked: boolean): void {
    if (checked) {
      this.selectedObjectKeys.add(key);
      return;
    }

    this.selectedObjectKeys.delete(key);
  }

  toggleAllObjects(checked: boolean): void {
    this.selectedObjectKeys.clear();

    if (checked) {
      this.objects.forEach((object) => this.selectedObjectKeys.add(object.key));
    }
  }

  deleteSelectedObjects(): void {
    if (!this.selectedCredential || !this.selectedBucket || this.selectedObjectKeys.size === 0) {
      return;
    }

    this.objectActionLoading = true;

    this.s3Service
      .deleteObjects(
        this.selectedBucket.name,
        {
          credentialId: this.selectedCredential.id,
          region: this.resolveBucketRegion(this.selectedBucket),
        },
        [...this.selectedObjectKeys],
      )
      .pipe(
        finalize(() => {
          this.objectActionLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.objectDeleteSuccessSummary,
            this.t.toast.objectDeleteSuccessDetail,
          );
          this.selectedObjectKeys.clear();
          this.loadObjects(false);
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.objectDeleteErrorSummary,
            this.getErrorMessage(error, this.t.toast.objectDeleteErrorDetail),
            5000,
          );
        },
      });
  }

  downloadSelectedObjects(): void {
    this.downloadObjects([...this.selectedObjectKeys]);
  }

  downloadObject(object: S3ObjectItem): void {
    this.downloadObjects([object.key]);
    this.closeObjectContextMenu();
  }

  isObjectSelected(key: string): boolean {
    return this.selectedObjectKeys.has(key);
  }

  openObjectFolder(object: S3ObjectItem): void {
    if (object.type !== 'folder') {
      return;
    }

    this.objectPrefix = object.key;
    this.loadObjects();
  }

  openObjectContextMenu(event: MouseEvent, object: S3ObjectItem): void {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('aws-manager-close-global-context-menu'));
    this.objectContextMenu = {
      object,
      x: event.clientX,
      y: event.clientY,
    };
  }

  closeObjectContextMenu(): void {
    this.objectContextMenu = null;
  }

  openRenameDialog(object: S3ObjectItem): void {
    this.objectPendingRename = object;
    this.renameObjectKey = object.key;
    this.closeObjectContextMenu();
  }

  closeRenameDialog(): void {
    if (this.objectActionLoading) {
      return;
    }

    this.objectPendingRename = null;
    this.renameObjectKey = '';
  }

  renameObject(): void {
    if (
      !this.selectedCredential ||
      !this.selectedBucket ||
      !this.objectPendingRename ||
      !this.renameObjectKey.trim()
    ) {
      return;
    }

    this.objectActionLoading = true;

    this.s3Service
      .renameObject(
        this.selectedBucket.name,
        {
          credentialId: this.selectedCredential.id,
          region: this.resolveBucketRegion(this.selectedBucket),
        },
        this.objectPendingRename.key,
        this.renameObjectKey,
      )
      .pipe(
        finalize(() => {
          this.objectActionLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.objectRenameSuccessSummary,
            this.t.toast.objectRenameSuccessDetail,
          );
          this.objectPendingRename = null;
          this.renameObjectKey = '';
          this.loadObjects(false);
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.objectRenameErrorSummary,
            this.getErrorMessage(error, this.t.toast.objectRenameErrorDetail),
            5000,
          );
        },
      });
  }

  goToParentFolder(): void {
    if (!this.objectPrefix) {
      return;
    }

    const normalizedPrefix = this.objectPrefix.replace(/\/$/, '');
    const separatorIndex = normalizedPrefix.lastIndexOf('/');
    this.objectPrefix = separatorIndex >= 0 ? `${normalizedPrefix.slice(0, separatorIndex)}/` : '';
    this.loadObjects();
  }

  getObjectDisplayName(object: S3ObjectItem): string {
    const withoutCurrentPrefix = this.objectPrefix && object.key.startsWith(this.objectPrefix)
      ? object.key.slice(this.objectPrefix.length)
      : object.key;
    const normalized = object.type === 'folder'
      ? withoutCurrentPrefix.replace(/\/$/, '')
      : withoutCurrentPrefix;
    const parts = normalized.split('/').filter(Boolean);

    return parts.length ? parts[parts.length - 1] : object.key;
  }

  goToObjectsPage(page: number): void {
    this.objectsPage = Math.min(Math.max(page, 1), this.objectsPageCount);
  }

  setObjectsPageSize(pageSize: number): void {
    if (pageSize === this.objectsPageSize) {
      return;
    }

    this.objectsPageSize = pageSize;
    this.objectsPage = 1;
  }

  formatObjectSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  cancelEmpty(): void {
    if (!this.actionLoading) {
      this.bucketPendingEmpty = null;
    }
  }

  confirmEmpty(): void {
    if (!this.selectedCredential || !this.bucketPendingEmpty) {
      return;
    }

    this.actionLoading = true;
    const bucketName = this.bucketPendingEmpty.name;

    this.s3Service
      .emptyBucket(bucketName, {
        credentialId: this.selectedCredential.id,
        region: this.resolveBucketRegion(this.bucketPendingEmpty),
      })
      .pipe(
        finalize(() => {
          this.actionLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.emptySuccessSummary,
            this.t.toast.emptySuccessDetail,
          );
          this.bucketPendingEmpty = null;
          this.reload();
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.emptyErrorSummary,
            this.getErrorMessage(error, this.t.toast.emptyErrorDetail),
            5000,
          );
        },
      });
  }

  cancelDelete(): void {
    if (!this.actionLoading) {
      this.bucketPendingDelete = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedCredential || !this.bucketPendingDelete) {
      return;
    }

    this.actionLoading = true;
    const bucketName = this.bucketPendingDelete.name;

    this.s3Service
      .deleteBucket(bucketName, {
        credentialId: this.selectedCredential.id,
        region: this.resolveBucketRegion(this.bucketPendingDelete),
      })
      .pipe(
        finalize(() => {
          this.actionLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.t.toast.deleteSuccessSummary,
            this.t.toast.deleteSuccessDetail,
          );
          this.bucketPendingDelete = null;
          this.reload();
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.deleteErrorSummary,
            this.getErrorMessage(error, this.t.toast.deleteErrorDetail),
            5000,
          );
        },
      });
  }

  private loadBuckets(credential: SelectedCredential, region: string): void {
    this.s3Loading = true;

    this.s3Service
      .listBuckets({
        credentialId: credential.id,
        region,
      })
      .pipe(
        finalize(() => {
          this.s3Loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.buckets = response.items ?? [];
          this.bucketPage = 1;
        },
        error: (error) => {
          this.buckets = [];
          this.bucketPage = 1;
          this.toast.error(
            this.t.toast.listErrorSummary,
            this.getErrorMessage(error, this.t.toast.listErrorDetail),
            5000,
          );
        },
      });
  }

  private closeConfirmDialogs(): void {
    this.bucketPendingEmpty = null;
    this.bucketPendingDelete = null;
  }

  private resetCreateForm(): void {
    this.bucketName = '';
    this.bucketType = 'general-purpose';
    this.availabilityZoneId = '';
    this.acknowledgeSingleAvailabilityZone = false;
  }

  private syncAvailabilityZoneWithRegion(region: string): void {
    const hasSelectedZone = getS3ExpressAvailabilityZones(region).some(
      (zone) => zone.id === this.availabilityZoneId,
    );

    if (!hasSelectedZone) {
      this.availabilityZoneId = '';
    }
  }

  private ensureValidObjectsPage(): void {
    this.objectsPage = Math.min(Math.max(this.objectsPage, 1), this.objectsPageCount);
  }

  private buildUploadObjectKey(file: File): string {
    const requestedKey = this.objectKey.trim();

    if (this.selectedObjectFiles.length === 1) {
      return requestedKey || `${this.objectPrefix || ''}${file.name}`;
    }

    const prefix = requestedKey || this.objectPrefix;

    if (!prefix) {
      return file.name;
    }

    return `${prefix.endsWith('/') ? prefix : `${prefix}/`}${file.name}`;
  }

  private downloadObjects(keys: string[]): void {
    if (!this.selectedCredential || !this.selectedBucket || keys.length === 0) {
      return;
    }

    this.objectDownloadLoading = true;

    this.s3Service
      .downloadObjects(
        this.selectedBucket.name,
        {
          credentialId: this.selectedCredential.id,
          region: this.resolveBucketRegion(this.selectedBucket),
        },
        keys,
      )
      .pipe(
        finalize(() => {
          this.objectDownloadLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const blob = response.body;

          if (!blob) {
            return;
          }

          this.saveBlob(blob, this.getDownloadFilename(response.headers.get('content-disposition')));
          this.toast.success(
            this.t.toast.objectDownloadSuccessSummary,
            this.t.toast.objectDownloadSuccessDetail,
          );
        },
        error: (error) => {
          this.toast.error(
            this.t.toast.objectDownloadErrorSummary,
            this.getErrorMessage(error, this.t.toast.objectDownloadErrorDetail),
            5000,
          );
        },
      });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private getDownloadFilename(contentDisposition: string | null): string {
    const match = /filename="?([^"]+)"?/i.exec(contentDisposition ?? '');

    return match?.[1] ?? 's3-objects.zip';
  }

  private resolveBucketRegion(bucket: S3BucketItem): string {
    return bucket.region && bucket.region !== '-' ? bucket.region : this.selectedRegion;
  }

  formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const response = error as {
      error?: {
        message?: string | { message?: string };
        awsMessage?: string;
      };
    };
    const message = response.error?.message;

    if (typeof message === 'object' && message?.message) {
      return message.message;
    }

    return response.error?.awsMessage ?? (typeof message === 'string' ? message : fallback);
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.closeObjectContextMenu();
  }

  @HostListener('document:contextmenu')
  handleDocumentContextMenu(): void {
    this.closeObjectContextMenu();
  }

  @HostListener('window:aws-manager-close-local-context-menus')
  handleCloseLocalContextMenus(): void {
    this.closeObjectContextMenu();
  }
}
