import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppCard } from '../../shared/components/card/card';
import { AppInput } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { DropDown } from '../../shared/components/drop-down/drop-down';
import { APP_LANGUAGES, AppLanguage } from '../../shared/config/languages.config';
import { LanguageService } from '../../shared/services/language.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserService } from '../../shared/services/user.service';
import { passwordMatchValidator } from '../../shared/utils/validators.util';

import { setPasswordTranslations } from './set-password.translations';

interface SetPasswordPayload {
  email: string;
  code: string;
  password: string;
}

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, AppInput, Button, DropDown],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
})
export class SetPassword implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private languageService = inject(LanguageService);
  private toast = inject(ToastService);
  private userService = inject(UserService);

  readonly languageOptions = [...APP_LANGUAGES];
  readonly translations = setPasswordTranslations;

  readonly form = this.fb.group(
    {
      language: this.fb.control<AppLanguage>(this.languageService.currentLanguage),
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator],
    },
  );

  pendingPayload: SetPasswordPayload | null = null;
  loading = false;

  ngOnInit(): void {
    this.readInviteParams();
    this.listenLanguageChanges();
  }

  get language(): AppLanguage {
    return this.form.controls.language.value;
  }

  get t() {
    return this.translations[this.language];
  }

  get inviteIsValid(): boolean {
    return this.form.controls.email.valid && this.form.controls.code.valid;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pendingPayload = this.getPayload();

    this.loading = true;

    this.userService
      .definePassword(this.pendingPayload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          const toastRef = this.toast.success(
            this.t.toast.passwordDefinedSummary,
            this.t.toast.passwordDefinedDetail,
            2000,
          );

          toastRef.afterClosed$.subscribe(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ?? error?.error?.message ?? this.t.toast.saveErrorDetail;

          this.toast.error(this.t.toast.saveErrorSummary, message, 5000);
        },
      });
  }

  private readInviteParams(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const code = this.route.snapshot.queryParamMap.get('code') ?? '';

    this.form.patchValue({
      email,
      code,
    });
  }

  private getPayload(): SetPasswordPayload {
    const { email, code, password } = this.form.getRawValue();

    return {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      password,
    };
  }

  private listenLanguageChanges(): void {
    this.form.controls.language.valueChanges.subscribe((language) => {
      this.languageService.setLanguage(language);
    });
  }
}
