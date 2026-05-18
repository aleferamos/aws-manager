import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AppCard } from '../../shared/components/card/card';
import { Button } from '../../shared/components/button/button';
import { AppInput } from '../../shared/components/input/input';
import { AppLanguage } from '../../shared/config/languages.config';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { LanguageService } from '../../shared/services/language.service';
import { ToastService } from '../../shared/services/toast.service';

import { configurationTranslations } from './configuration.translations';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, AppInput, Button],
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
})
export class Configuration implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private configurationService = inject(ConfigurationService);
  private languageService = inject(LanguageService);
  private toast = inject(ToastService);

  readonly translations = configurationTranslations;

  readonly form = this.fb.group({
    siteUrl: [
      '',
      [
        Validators.required,
        Validators.maxLength(255),
        Validators.pattern(/^https?:\/\/.+/),
      ],
    ],
  });

  loading = false;
  saving = false;
  currentSiteUrl = '';

  ngOnInit(): void {
    this.loadConfiguration();
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const siteUrl = this.form.controls.siteUrl.getRawValue().trim().replace(/\/+$/, '');

    this.saving = true;

    this.configurationService
      .update({
        jsonConfig: {
          site_url: siteUrl,
        },
      })
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: (configuration) => {
          this.currentSiteUrl = configuration.siteUrl;
          this.form.controls.siteUrl.setValue(configuration.siteUrl);
          this.toast.success(
            this.t.toast.updateSuccessSummary,
            this.t.toast.updateSuccessDetail,
            4000,
          );
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.updateErrorDetail;

          this.toast.error(this.t.toast.updateErrorSummary, message, 5000);
        },
      });
  }

  private loadConfiguration(): void {
    this.loading = true;

    this.configurationService
      .get()
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (configuration) => {
          this.currentSiteUrl = configuration.siteUrl;
          this.form.controls.siteUrl.setValue(configuration.siteUrl);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.loadErrorDetail;

          this.toast.error(this.t.toast.loadErrorSummary, message, 5000);
        },
      });
  }
}
