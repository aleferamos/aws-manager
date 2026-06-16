import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AppCard } from '../../../shared/components/card/card';
import { Button } from '../../../shared/components/button/button';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { AppInput } from '../../../shared/components/input/input';
import {
  Table,
  TableCellEvent,
  TableColumn,
  TablePageEvent,
  TableRow,
} from '../../../shared/components/table/table';
import { AppLanguage } from '../../../shared/config/languages.config';
import {
  CloudFrontDistributionItem,
  CloudFrontInvalidationItem,
  CloudFrontService,
} from '../../../shared/services/cloud-front.service';
import {
  CredentialContextService,
  SelectedCredential,
} from '../../../shared/services/credential-context.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ToastService } from '../../../shared/services/toast.service';
import { formatPlatformDateTime } from '../../../shared/utils/date-format.util';
import { cloudFrontDetailTranslations } from '../cloud-front-detail/cloud-front-detail.translations';
import { cloudFrontQueryTranslations } from './cloud-front-query.translations';

type DetailTab = 'overview' | 'invalidations';

@Component({
  selector: 'app-cloud-front-query',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCard, AppInput, Button, Dialog, Table],
  templateUrl: './cloud-front-query.html',
  styleUrl: './cloud-front-query.scss',
})
export class CloudFrontQuery implements OnInit {
  private cloudFrontService = inject(CloudFrontService);
  private credentialContext = inject(CredentialContextService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private toast = inject(ToastService);

  readonly translations = cloudFrontQueryTranslations;
  readonly detailTranslations = cloudFrontDetailTranslations;
  private readonly invalidationPollIntervalMs = 5000;
  private invalidationPollHandle: ReturnType<typeof setTimeout> | null = null;

  selectedCredential: SelectedCredential | null = null;
  distributions: CloudFrontDistributionItem[] = [];
  distributionFilter = '';
  loading = false;
  page = 1;
  readonly pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50];
  detailDialogOpen = false;
  selectedDistributionId = '';
  selectedDistribution: CloudFrontDistributionItem | null = null;
  invalidations: CloudFrontInvalidationItem[] = [];
  activeDetailTab: DetailTab = 'overview';
  detailLoading = false;
  invalidationsLoading = false;
  invalidationPaths = '/*';
  callerReference = '';
  createInvalidationLoading = false;
  invalidationsPage = 1;
  readonly invalidationsPageSize = 10;
  readonly invalidationsPageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.clearInvalidationPolling());

    this.credentialContext.selectedCredential$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((credential) => {
        this.selectedCredential = credential;
        this.page = 1;
        this.distributionFilter = '';

        if (credential) {
          this.loadDistributions(credential);
        } else {
          this.distributions = [];
        }
      });
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get detailT() {
    return this.detailTranslations[this.language];
  }

  get totalDistributions(): number {
    return this.distributions.length;
  }

  get enabledDistributions(): number {
    return this.distributions.filter((distribution) => distribution.enabled).length;
  }

  get filteredDistributions(): CloudFrontDistributionItem[] {
    const terms = this.normalizeSearch(this.distributionFilter)
      .split(' ')
      .filter(Boolean);

    if (!terms.length) {
      return this.distributions;
    }

    return this.distributions.filter((distribution) => {
      const searchableContent = this.buildDistributionSearchContent(distribution);

      return terms.every((term) => searchableContent.includes(term));
    });
  }

  get columns(): TableColumn[] {
    return [
      {
        field: 'id',
        header: this.t.table.id,
        type: 'link',
        width: '190px',
      },
      {
        field: 'enabledLabel',
        header: this.t.table.enabled,
        type: 'badge',
        badgeSeverityField: 'enabledSeverity',
        width: '130px',
      },
      { field: 'status', header: this.t.table.status, width: '130px' },
      { field: 'domainName', header: this.t.table.domainName, width: '260px' },
      { field: 'aliasesLabel', header: this.t.table.aliases, width: '260px' },
      { field: 'originsLabel', header: this.t.table.origins, width: '260px' },
      { field: 'priceClass', header: this.t.table.priceClass, width: '160px' },
      { field: 'lastModifiedLabel', header: this.t.table.lastModified, width: '190px' },
    ];
  }

  get tableRows(): TableRow[] {
    return this.filteredDistributions.map((distribution) => ({
      ...distribution,
      enabledLabel: distribution.enabled ? 'Enabled' : 'Disabled',
      enabledSeverity: distribution.enabled ? 'success' : 'secondary',
      aliasesLabel: distribution.aliases.length ? distribution.aliases.join(', ') : '-',
      originsLabel: distribution.origins.length ? distribution.origins.join(', ') : '-',
      lastModifiedLabel: this.formatDateTime(distribution.lastModifiedTime),
    }));
  }

  get detailTitle(): string {
    return this.selectedDistribution?.id || this.selectedDistributionId;
  }

  get overviewFields(): Array<{ label: string; value: string }> {
    const distribution = this.selectedDistribution;

    return [
      { label: this.detailT.overview.status, value: distribution?.status || '-' },
      { label: this.detailT.overview.enabled, value: distribution?.enabled ? 'Yes' : 'No' },
      { label: this.detailT.overview.domainName, value: distribution?.domainName || '-' },
      { label: this.detailT.overview.arn, value: distribution?.arn || '-' },
      { label: this.detailT.overview.aliases, value: this.joinValues(distribution?.aliases) },
      { label: this.detailT.overview.origins, value: this.joinValues(distribution?.origins) },
      { label: this.detailT.overview.priceClass, value: distribution?.priceClass || '-' },
      { label: this.detailT.overview.httpVersion, value: distribution?.httpVersion || '-' },
      { label: this.detailT.overview.ipv6, value: distribution?.ipv6Enabled ? 'Yes' : 'No' },
      {
        label: this.detailT.overview.lastModified,
        value: this.formatDateTime(distribution?.lastModifiedTime ?? null),
      },
      { label: this.detailT.overview.comment, value: distribution?.comment || '-' },
    ];
  }

  get invalidationColumns(): TableColumn[] {
    return [
      { field: 'id', header: this.detailT.table.id, width: '260px' },
      {
        field: 'status',
        header: this.detailT.table.status,
        type: 'badge',
        badgeSeverityField: 'statusSeverity',
        badgeLoadingField: 'statusLoading',
        width: '160px',
      },
      { field: 'createTimeLabel', header: this.detailT.table.createTime, width: '220px' },
    ];
  }

  get invalidationRows(): TableRow[] {
    return this.invalidations.map((invalidation) => ({
      ...invalidation,
      createTimeLabel: this.formatDateTime(invalidation.createTime),
      statusSeverity: invalidation.status === 'Completed' ? 'success' : 'warning',
      statusLoading: invalidation.status !== 'Completed',
    }));
  }

  reload(): void {
    if (!this.selectedCredential) {
      return;
    }

    this.loadDistributions(this.selectedCredential);
  }

  handleCellSelected(event: TableCellEvent): void {
    if (event.column.field === 'id') {
      this.openDistributionDetail(String(event.row['id'] ?? ''));
    }
  }

  handlePageChange(event: TablePageEvent): void {
    this.page = event.page;
  }

  handleDistributionFilterChange(value: string): void {
    this.distributionFilter = value;
    this.page = 1;
  }

  handleInvalidationsPageChange(event: TablePageEvent): void {
    this.invalidationsPage = event.page;
  }

  setDetailTab(tab: DetailTab): void {
    this.activeDetailTab = tab;
  }

  closeDetailDialog(): void {
    if (this.createInvalidationLoading) {
      return;
    }

    this.detailDialogOpen = false;
    this.clearInvalidationPolling();
    this.selectedDistributionId = '';
    this.selectedDistribution = null;
    this.invalidations = [];
    this.activeDetailTab = 'overview';
  }

  reloadDetail(): void {
    if (!this.selectedCredential || !this.selectedDistributionId) {
      return;
    }

    this.loadDistributionDetail(this.selectedCredential, this.selectedDistributionId);
    this.loadInvalidations(this.selectedCredential, this.selectedDistributionId);
  }

  createInvalidation(): void {
    if (!this.selectedCredential || !this.selectedDistributionId) {
      return;
    }

    const paths = this.invalidationPaths
      .split(/\r?\n|,/)
      .map((path) => path.trim())
      .filter(Boolean);

    this.createInvalidationLoading = true;

    this.cloudFrontService
      .createInvalidation(this.selectedDistributionId, {
        credentialId: this.selectedCredential.id,
        paths,
        callerReference: this.callerReference.trim() || undefined,
      })
      .pipe(finalize(() => (this.createInvalidationLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(
            this.detailT.toast.createSummary,
            this.detailT.toast.createDetail,
            4000,
          );
          this.invalidationPaths = '/*';
          this.callerReference = '';
          this.activeDetailTab = 'invalidations';
          this.loadInvalidations(this.selectedCredential!, this.selectedDistributionId);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.detailT.toast.createErrorDetail;

          this.toast.error(this.detailT.toast.createErrorSummary, message, 5000);
        },
      });
  }

  private loadDistributions(credential: SelectedCredential): void {
    this.loading = true;

    this.cloudFrontService
      .listDistributions({
        credentialId: credential.id,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.distributions = response.items;
          this.page = 1;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
          this.distributions = [];
        },
      });
  }

  private openDistributionDetail(distributionId: string): void {
    if (!distributionId || !this.selectedCredential) {
      return;
    }

    this.selectedDistributionId = distributionId;
    this.selectedDistribution =
      this.distributions.find((distribution) => distribution.id === distributionId) ?? null;
    this.clearInvalidationPolling();
    this.invalidations = [];
    this.invalidationsPage = 1;
    this.invalidationPaths = '/*';
    this.callerReference = '';
    this.activeDetailTab = 'overview';
    this.detailDialogOpen = true;
    this.loadDistributionDetail(this.selectedCredential, distributionId);
    this.loadInvalidations(this.selectedCredential, distributionId);
  }

  private loadDistributionDetail(
    credential: SelectedCredential,
    distributionId: string,
  ): void {
    this.detailLoading = true;

    this.cloudFrontService
      .viewDistribution(distributionId, {
        credentialId: credential.id,
      })
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (response) => {
          this.selectedDistribution = response.distribution;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.detailT.toast.detailErrorDetail;

          this.toast.error(this.detailT.toast.detailErrorSummary, message, 5000);
        },
      });
  }

  private loadInvalidations(
    credential: SelectedCredential,
    distributionId: string,
    options: { silent?: boolean } = {},
  ): void {
    if (!options.silent) {
      this.invalidationsLoading = true;
    }

    this.cloudFrontService
      .listInvalidations(distributionId, {
        credentialId: credential.id,
      })
      .pipe(
        finalize(() => {
          if (!options.silent) {
            this.invalidationsLoading = false;
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!this.detailDialogOpen || this.selectedDistributionId !== distributionId) {
            return;
          }

          this.invalidations = response.items;

          if (!options.silent) {
            this.invalidationsPage = 1;
          }

          this.scheduleInvalidationPolling();
        },
        error: (error) => {
          this.clearInvalidationPolling();

          if (options.silent) {
            return;
          }

          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.detailT.toast.invalidationsErrorDetail;

          this.toast.error(this.detailT.toast.invalidationsErrorSummary, message, 5000);
          this.invalidations = [];
        },
      });
  }

  private joinValues(values: string[] | undefined): string {
    return values?.length ? values.join(', ') : '-';
  }

  private formatDateTime(value: string | null): string {
    return formatPlatformDateTime(value);
  }

  private buildDistributionSearchContent(distribution: CloudFrontDistributionItem): string {
    return this.normalizeSearch(
      [
        distribution.id,
        distribution.arn,
        distribution.status,
        distribution.enabled ? 'enabled yes active true' : 'disabled no inactive false',
        distribution.domainName,
        distribution.aliases.join(' '),
        distribution.origins.join(' '),
        distribution.priceClass,
        distribution.httpVersion,
        distribution.ipv6Enabled ? 'ipv6 yes true enabled' : 'ipv6 no false disabled',
        distribution.lastModifiedTime,
        this.formatDateTime(distribution.lastModifiedTime),
        distribution.comment,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private scheduleInvalidationPolling(): void {
    this.clearInvalidationPolling();

    if (!this.detailDialogOpen || !this.selectedCredential || !this.selectedDistributionId) {
      return;
    }

    const hasPendingInvalidations = this.invalidations.some(
      (invalidation) => invalidation.status !== 'Completed',
    );

    if (!hasPendingInvalidations) {
      return;
    }

    const credential = this.selectedCredential;
    const distributionId = this.selectedDistributionId;

    this.invalidationPollHandle = setTimeout(() => {
      this.loadInvalidations(credential, distributionId, { silent: true });
    }, this.invalidationPollIntervalMs);
  }

  private clearInvalidationPolling(): void {
    if (!this.invalidationPollHandle) {
      return;
    }

    clearTimeout(this.invalidationPollHandle);
    this.invalidationPollHandle = null;
  }
}
