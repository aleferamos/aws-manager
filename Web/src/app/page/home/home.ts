import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize } from 'rxjs';

import {
  BillingCostResponse,
  BillingCostTimeResult,
  BillingService,
} from '../../shared/services/billing.service';
import {
  CredentialContextService,
  SelectedCredential,
} from '../../shared/services/credential-context.service';
import { AppLanguage } from '../../shared/config/languages.config';
import { LanguageService } from '../../shared/services/language.service';
import { homeTranslations } from './home.translations';

interface BillingChartSegment {
  key: string;
  amount: number;
  height: number;
  color: string;
}

interface BillingChartBar {
  label: string;
  total: number;
  segments: BillingChartSegment[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private destroyRef = inject(DestroyRef);
  private billingService = inject(BillingService);
  private credentialContext = inject(CredentialContextService);
  private languageService = inject(LanguageService);

  selectedCredential: SelectedCredential | null = null;
  selectedRegion = this.credentialContext.selectedRegion;
  billing: BillingCostResponse | null = null;
  billingLoading = false;
  billingError = '';

  readonly palette = [
    'var(--color-brand-600)',
    'var(--color-danger)',
    'var(--color-success)',
    'var(--color-info)',
    'var(--color-warning)',
    'var(--color-neutral-700)',
  ];
  readonly translations = homeTranslations;

  ngOnInit(): void {
    combineLatest([
      this.credentialContext.selectedCredential$,
      this.credentialContext.selectedRegion$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([credential, region]) => {
        this.selectedCredential = credential;
        this.selectedRegion = region;

        if (credential) {
          this.loadBilling(credential, region);
        } else {
          this.billing = null;
        }
      });
  }

  get totalAmount(): number {
    const results = this.billing?.resultsByTime ?? [];

    if (!results.length) {
      return this.billing?.totalAmount ?? 0;
    }

    return results.reduce((sum, result) => sum + this.getResultTotal(result), 0);
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get forecastAmount(): number {
    if (!this.billing?.resultsByTime.length) {
      return 0;
    }

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const elapsedDays = Math.max(1, this.billing.resultsByTime.length);

    return (this.totalAmount / elapsedDays) * daysInMonth;
  }

  get chartAxisMax(): number {
    const maxTotal = Math.max(...this.chartBars.map((bar) => bar.total), 0);

    return this.getNiceAxisMax(maxTotal);
  }

  get chartAxisMiddle(): number {
    return this.chartAxisMax / 2;
  }

  get chartBars(): BillingChartBar[] {
    const results = this.billing?.resultsByTime ?? [];
    const topKeys = this.getTopServiceKeys(results);
    const axisMax = this.getNiceAxisMax(Math.max(...results.map((result) => this.getResultTotal(result)), 0));

    return results.map((result) => {
      const groupsByKey = new Map(result.groups.map((group) => [group.key, group.amount]));
      const resultTotal = this.getResultTotal(result);
      const knownTotal = topKeys.reduce((sum, key) => sum + (groupsByKey.get(key) ?? 0), 0);
      const others = Math.max(0, resultTotal - knownTotal);
      const segments = [
        ...topKeys.map((key, index) => ({
          key: this.formatServiceName(key),
          amount: groupsByKey.get(key) ?? 0,
          height: ((groupsByKey.get(key) ?? 0) / axisMax) * 100,
          color: this.palette[index % this.palette.length],
        })),
        {
          key: 'Others',
          amount: others,
          height: (others / axisMax) * 100,
          color: this.palette[5],
        },
      ].filter((segment) => segment.amount > 0);

      return {
        label: this.formatShortDate(result.start),
        total: resultTotal,
        segments,
      };
    });
  }

  get legendItems(): BillingChartSegment[] {
    const items = new Map<string, BillingChartSegment>();

    this.chartBars.forEach((bar) => {
      bar.segments.forEach((segment) => {
        if (!items.has(segment.key)) {
          items.set(segment.key, segment);
        }
      });
    });

    return [...items.values()];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(this.language, {
      style: 'currency',
      currency: this.billing?.currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatAxisValue(value: number): string {
    return new Intl.NumberFormat(this.language, {
      maximumFractionDigits: value >= 10 ? 0 : 2,
    }).format(value);
  }

  reloadBilling(): void {
    if (this.selectedCredential) {
      this.loadBilling(this.selectedCredential, this.selectedRegion);
    }
  }

  private loadBilling(credential: SelectedCredential, region: string): void {
    const { startDate, endDate } = this.getCurrentMonthRange();

    this.billingLoading = true;
    this.billingError = '';

    this.billingService
      .getCostAndUsage({
        credentialId: credential.id,
        region,
        startDate,
        endDate,
        granularity: 'DAILY',
        groupBy: 'SERVICE',
      })
      .pipe(
        finalize(() => {
          this.billingLoading = false;
        }),
      )
      .subscribe({
        next: (billing) => {
          this.billing = billing;
        },
        error: (error) => {
          this.billing = null;
          this.billingError =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.errors.billingLoad;
        },
      });
  }

  private getCurrentMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now);
    end.setDate(end.getDate() + 1);

    return {
      startDate: this.toDateOnly(start),
      endDate: this.toDateOnly(end),
    };
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getTopServiceKeys(results: BillingCostTimeResult[]): string[] {
    const totals = new Map<string, number>();

    results.forEach((result) => {
      result.groups.forEach((group) => {
        totals.set(group.key, (totals.get(group.key) ?? 0) + group.amount);
      });
    });

    return [...totals.entries()]
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 5)
      .map(([key]) => key);
  }

  private getResultTotal(result: BillingCostTimeResult): number {
    const groupsTotal = result.groups.reduce((sum, group) => sum + group.amount, 0);

    return result.totalAmount > 0 ? result.totalAmount : groupsTotal;
  }

  private getNiceAxisMax(value: number): number {
    if (value <= 0) {
      return 1;
    }

    if (value <= 1) {
      return 1;
    }

    if (value <= 5) {
      return 5;
    }

    if (value <= 10) {
      return 10;
    }

    return Math.ceil(value / 10) * 10;
  }

  private formatServiceName(value: string): string {
    const serviceNames: Record<string, string> = {
      'Amazon Route 53': 'Route 53',
      Tax: 'Tax',
      'AWS Secrets Manager': 'Secrets Manager',
      'Amazon API Gateway': 'API Gateway',
      'Amazon Simple Storage Service': 'S3',
      AmazonCloudWatch: 'CloudWatch',
      'Amazon CloudFront': 'CloudFront',
      'AWS Glue': 'Glue',
    };

    return serviceNames[value] ?? value;
  }

  private formatShortDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.language, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}
