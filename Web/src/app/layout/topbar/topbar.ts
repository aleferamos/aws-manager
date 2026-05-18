import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, map, of } from 'rxjs';

import { DropDown, DropDownOption } from '../../shared/components/drop-down/drop-down';
import { AWS_REGIONS } from '../../shared/config/aws-regions.config';
import { APP_LANGUAGES, AppLanguage } from '../../shared/config/languages.config';
import { AuthenticatedUser, AuthService } from '../../shared/services/auth.service';
import { AccessControlService } from '../../shared/services/access-control.service';
import { CredentialContextService } from '../../shared/services/credential-context.service';
import { CredentialService } from '../../shared/services/credential.service';
import { LanguageService } from '../../shared/services/language.service';
import { UserInfo } from '../../shared/services/user.service';
import { layoutTranslations } from '../layout.translations';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropDown],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit {
  private fb = inject(FormBuilder);
  private languageService = inject(LanguageService);
  private authService = inject(AuthService);
  private accessControlService = inject(AccessControlService);
  private credentialContext = inject(CredentialContextService);
  private credentialService = inject(CredentialService);
  private elementRef = inject(ElementRef<HTMLElement>);
  private router = inject(Router);

  @Input() sidebarCollapsed = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openMobileSidebar = new EventEmitter<void>();

  readonly languageOptions = [...APP_LANGUAGES];
  readonly regionOptions: DropDownOption[] = AWS_REGIONS.map((region) => ({
    label: region.code,
    value: region.code,
    description: region.name,
  }));
  readonly translations = layoutTranslations;
  readonly currentUser$ = this.authService.me().pipe(
    map((session) => session.user),
    catchError(() => of(null)),
  );
  readonly currentUserInfo$ = this.accessControlService.loadCurrentUser().pipe(
    catchError(() => of(null)),
  );
  readonly credentials$ = this.credentialContext.credentials$;

  profileMenuOpen = false;
  logoutLoading = false;

  form = this.fb.group({
    credentialId: this.fb.control<string | null>(null),
    region: this.fb.control<string>(this.credentialContext.selectedRegion),
    language: this.fb.control<AppLanguage>(this.languageService.currentLanguage),
  });

  ngOnInit(): void {
    this.loadCredentials();

    this.form.controls.credentialId.valueChanges.subscribe((credentialId) => {
      this.credentialContext.selectCredential(credentialId);
    });

    this.form.controls.region.valueChanges.subscribe((region) => {
      this.credentialContext.selectRegion(region);
    });

    this.form.controls.language.valueChanges.subscribe((language) => {
      if (language) {
        this.languageService.setLanguage(language);
      }
    });
  }

  get language(): AppLanguage {
    return this.form.controls.language.value ?? 'en-US';
  }

  get t() {
    return this.translations[this.language];
  }

  toCredentialOptions(credentials: Array<{ id: string; name: string }>): DropDownOption[] {
    return credentials.map((credential) => ({
      label: credential.name,
      value: credential.id,
    }));
  }

  getInitials(user: AuthenticatedUser | null): string {
    const name = this.getDisplayName(user);

    if (!name) {
      return 'U';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return `${first}${last}`.toUpperCase();
  }

  getDisplayName(user: AuthenticatedUser | null): string {
    return (
      user?.personName?.trim() ||
      user?.name?.trim() ||
      user?.person?.name?.trim() ||
      user?.login?.trim() ||
      'User'
    );
  }

  getDisplayType(user: AuthenticatedUser | UserInfo | null): string {
    if (!user?.type) {
      return '';
    }

    return user.type;
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  isRoot(user: UserInfo | null): boolean {
    return user?.type === 'ROOT';
  }

  openSettings(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/configuration']);
  }

  logout(): void {
    if (this.logoutLoading) {
      return;
    }

    this.logoutLoading = true;

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.logoutLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          window.location.assign('/login');
        },
        error: () => {
          window.location.assign('/login');
        },
      });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);

    if (!clickedInside) {
      this.profileMenuOpen = false;
    }
  }

  private loadCredentials(): void {
    this.authService.me().subscribe({
      next: (session) => {
        this.credentialContext.hydrateFromSession(session);
        this.syncCredentialControl();

        if (!this.credentialContext.credentials.length) {
          this.loadCredentialListFallback();
        }
      },
    });
  }

  private loadCredentialListFallback(): void {
    this.credentialService
      .list({
        status: 'active',
        page: 1,
        pageSize: 100,
      })
      .subscribe({
        next: (response) => {
          this.credentialContext.hydrateFromCredentials(response.items);
          this.syncCredentialControl();
        },
        error: () => {
          this.syncCredentialControl();
        },
      });
  }

  private syncCredentialControl(): void {
    this.form.controls.credentialId.setValue(
      this.credentialContext.selectedCredential?.id ?? null,
      { emitEvent: false },
    );
    this.form.controls.region.setValue(this.credentialContext.selectedRegion, {
      emitEvent: false,
    });
  }
}
