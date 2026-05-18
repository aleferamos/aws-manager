import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppCard } from '../../shared/components/card/card';
import { Dialog } from '../../shared/components/dialog/dialog';
import { AppInput } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { DropDown } from '../../shared/components/drop-down/drop-down';

import { LanguageService } from '../../shared/services/language.service';

import { loginTranslations } from './login.translations';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { APP_LANGUAGES, AppLanguage } from '../../shared/config/languages.config';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, Dialog, AppInput, Button, DropDown],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private languageService = inject(LanguageService);
  private userService = inject(UserService);

  readonly translations = loginTranslations;

  readonly languageOptions = [...APP_LANGUAGES];

  form = this.fb.group({
    language: this.fb.control<AppLanguage>(this.languageService.currentLanguage),
    login: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  forgotPasswordDialogOpen = false;
  forgotPasswordLoading = false;

  ngOnInit(): void {
    this.listenLanguageChanges();
  }

  get language(): AppLanguage {
    return this.form.controls.language.value;
  }

  get t() {
    return this.translations[this.language];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { login, password } = this.form.getRawValue();

    this.authService.login(login, password).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        const message =
          error?.error?.message?.message ?? error?.error?.message ?? this.t.toast.loginErrorDetail;

        this.toast.error(this.t.toast.loginErrorSummary, message, 5000);
      },
    });
  }

  openForgotPasswordDialog(): void {
    this.forgotPasswordForm.reset();
    this.forgotPasswordDialogOpen = true;
  }

  closeForgotPasswordDialog(): void {
    if (this.forgotPasswordLoading) {
      return;
    }

    this.forgotPasswordDialogOpen = false;
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotPasswordForm.getRawValue();

    this.forgotPasswordLoading = true;

    this.userService
      .forgotPassword({
        email: email.trim().toLowerCase(),
      })
      .pipe(
        finalize(() => {
          this.forgotPasswordLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.forgotPasswordDialogOpen = false;
          this.toast.info(
            this.t.toast.forgotPasswordSummary,
            this.t.toast.forgotPasswordDetail,
            5000,
          );
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.forgotPasswordErrorDetail;

          this.toast.error(this.t.toast.forgotPasswordErrorSummary, message, 5000);
        },
      });
  }

  private listenLanguageChanges(): void {
    this.form.controls.language.valueChanges.subscribe((language) => {
      this.languageService.setLanguage(language);
    });
  }
}
