import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';

import { AppCard } from '../../../shared/components/card/card';
import { Button } from '../../../shared/components/button/button';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { AppInput } from '../../../shared/components/input/input';
import {
  Table,
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
import { cloudFrontDetailTranslations } from './cloud-front-detail.translations';

type DetailTab = 'overview' | 'invalidations';

@Component({
  selector: 'app-cloud-front-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppCard, AppInput, Button, Dialog, Table],
  templateUrl: './cloud-front-detail.html',
  styleUrl: './cloud-front-detail.scss',
})
export class CloudFrontDetail implements OnInit {
  private cloudFrontService = inject(CloudFrontService);
  private credentialContext = inject(CredentialContextService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly translations = cloudFrontDetailTranslations;

  distributionId = '';
  selectedCredential: SelectedCredential | null = null;
  distribution: CloudFrontDistributionItem | null = null;
  invalidations: CloudFrontInvalidationItem[] = [];
  activeTab: DetailTab = 'overview';
  detailLoading = false;
  invalidationsLoading = false;
  createDialogOpen = false;
  createLoading = false;
  invalidationPaths = '/*';
  callerReference = '';
  page = 1;
  readonly pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.credentialContext.selectedCredential$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, credential]) => {
        this.distributionId = params.get('distributionId') ?? '';
        this.selectedCredential = credential;

        if (!this.distributionId) {
          this.router.navigate(['/cloudfront']);
          return;
        }

        if (credential) {
          this.loadDistribution(credential);
          this.loadInvalidations(credential);
        } else {
          this.distribution = null;
          this.invalidations = [];
        }
      });
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get title(): string {
    return this.distribution?.id || this.distributionId;
  }

  get overviewFields(): Array<{ label: string; value: string }> {
    const distribution = this.distribution;

    return [
      { label: this.t.overview.status, value: distribution?.status || '-' },
      { label: this.t.overview.enabled, value: distribution?.enabled ? 'Yes' : 'No' },
      { label: this.t.overview.domainName, value: distribution?.domainName || '-' },
      { label: this.t.overview.arn, value: distribution?.arn || '-' },
      { label: this.t.overview.aliases, value: this.joinValues(distribution?.aliases) },
      { label: this.t.overview.origins, value: this.joinValues(distribution?.origins) },
      { label: this.t.overview.priceClass, value: distribution?.priceClass || '-' },
      { label: this.t.overview.httpVersion, value: distribution?.httpVersion || '-' },
      { label: this.t.overview.ipv6, value: distribution?.ipv6Enabled ? 'Yes' : 'No' },
      {
        label: this.t.overview.lastModified,
        value: this.formatDateTime(distribution?.lastModifiedTime ?? null),
      },
      { label: this.t.overview.comment, value: distribution?.comment || '-' },
    ];
  }

  get invalidationColumns(): TableColumn[] {
    return [
      { field: 'id', header: this.t.table.id, width: '260px' },
      {
        field: 'status',
        header: this.t.table.status,
        type: 'badge',
        badgeSeverityField: 'statusSeverity',
        width: '160px',
      },
      { field: 'createTimeLabel', header: this.t.table.createTime, width: '220px' },
    ];
  }

  get invalidationRows(): TableRow[] {
    return this.invalidations.map((invalidation) => ({
      ...invalidation,
      createTimeLabel: this.formatDateTime(invalidation.createTime),
      statusSeverity: invalidation.status === 'Completed' ? 'success' : 'warning',
    }));
  }

  setTab(tab: DetailTab): void {
    this.activeTab = tab;
  }

  reload(): void {
    if (!this.selectedCredential) {
      return;
    }

    this.loadDistribution(this.selectedCredential);
    this.loadInvalidations(this.selectedCredential);
  }

  openCreateDialog(): void {
    this.invalidationPaths = '/*';
    this.callerReference = '';
    this.createDialogOpen = true;
  }

  closeCreateDialog(): void {
    if (this.createLoading) {
      return;
    }

    this.createDialogOpen = false;
  }

  createInvalidation(): void {
    if (!this.selectedCredential) {
      return;
    }

    const paths = this.invalidationPaths
      .split(/\r?\n|,/)
      .map((path) => path.trim())
      .filter(Boolean);

    this.createLoading = true;

    this.cloudFrontService
      .createInvalidation(this.distributionId, {
        credentialId: this.selectedCredential.id,
        paths,
        callerReference: this.callerReference.trim() || undefined,
      })
      .pipe(finalize(() => (this.createLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.createSummary, this.t.toast.createDetail, 4000);
          this.createDialogOpen = false;
          this.activeTab = 'invalidations';
          this.loadInvalidations(this.selectedCredential!);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.createErrorDetail;

          this.toast.error(this.t.toast.createErrorSummary, message, 5000);
        },
      });
  }

  handlePageChange(event: TablePageEvent): void {
    this.page = event.page;
  }

  private loadDistribution(credential: SelectedCredential): void {
    this.detailLoading = true;

    this.cloudFrontService
      .viewDistribution(this.distributionId, {
        credentialId: credential.id,
      })
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (response) => {
          this.distribution = response.distribution;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.detailErrorDetail;

          this.toast.error(this.t.toast.detailErrorSummary, message, 5000);
        },
      });
  }

  private loadInvalidations(credential: SelectedCredential): void {
    this.invalidationsLoading = true;

    this.cloudFrontService
      .listInvalidations(this.distributionId, {
        credentialId: credential.id,
      })
      .pipe(finalize(() => (this.invalidationsLoading = false)))
      .subscribe({
        next: (response) => {
          this.invalidations = response.items;
          this.page = 1;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.invalidationsErrorDetail;

          this.toast.error(this.t.toast.invalidationsErrorSummary, message, 5000);
          this.invalidations = [];
        },
      });
  }

  private joinValues(values: string[] | undefined): string {
    return values?.length ? values.join(', ') : '-';
  }

  private formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }
}
