import { Component, inject, OnInit } from '@angular/core';
import { AppCard } from '../../shared/components/card/card';
import { AppInput } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../shared/services/language.service';
import { setPasswordAdminAreaTranslations } from './ set-password-admin-area.translations';
import { DropDown } from '../../shared/components/drop-down/drop-down';
import { UserService } from '../../shared/services/user.service';
import { passwordMatchValidator } from '../../shared/utils/validators.util';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { APP_LANGUAGES, AppLanguage } from '../../shared/config/languages.config';

@Component({
  selector: 'app-set-password-admin-area',
  imports: [AppCard, AppInput, Button, FormsModule, ReactiveFormsModule, DropDown],
  templateUrl: './set-password-admin-area.html',
  styleUrl: './set-password-admin-area.scss',
})
export class SetPasswordAdminArea implements OnInit {
  ngOnInit(): void {
    this.isFirstAdminUser();
  }

  fb = inject(FormBuilder);
  userService = inject(UserService);
  toast = inject(ToastService);
  router = inject(Router);
  languageService = inject(LanguageService);

  readonly languageOptions = [...APP_LANGUAGES];
  readonly translations = setPasswordAdminAreaTranslations;

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required]],
      language: this.fb.control<AppLanguage>(this.languageService.currentLanguage),
    },
    {
      validators: [passwordMatchValidator],
    },
  );

  get language(): AppLanguage {
    return this.form.controls.language.value ?? 'en-US';
  }

  get t() {
    return this.translations[this.language];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.form.getRawValue();

    this.userService
      .setAdminPassword({
        email: email!,
        password: password!,
        confirmPassword: confirmPassword!,
      })
      .subscribe({
      next: () => {
        const toastRef = this.toast.success(
          this.t.toast.passwordDefinedSummary,
          this.t.toast.passwordDefinedDetail,
          1000,
        );

        toastRef.afterClosed$.subscribe(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        const message = error?.error?.message ?? this.t.toast.saveErrorDetail;

        this.toast.error(this.t.toast.saveErrorSummary, message, 5000);
      },
    });
  }

  isFirstAdminUser() {
    this.userService.isFirstAdminUser().subscribe({
      next: (response) => {
        if (response.adminHasPassword) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  listenLanguageChanges(): void {
    this.form.controls.language.valueChanges.subscribe((language) => {
      if (language) {
        this.languageService.setLanguage(language);
      }
    });
  }
}
