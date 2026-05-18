import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, finalize } from 'rxjs';

import { AppCard } from '../../../../shared/components/card/card';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Dialog } from '../../../../shared/components/dialog/dialog';
import { AppInput } from '../../../../shared/components/input/input';
import { Button } from '../../../../shared/components/button/button';
import { DropDown, DropDownOption } from '../../../../shared/components/drop-down/drop-down';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableColumn,
  TableRow,
} from '../../../../shared/components/table/table';
import { AppLanguage } from '../../../../shared/config/languages.config';
import {
  AuthorityService,
  CreateAuthorityDto,
  ListAuthorityItem,
  UpdateAuthorityDto,
  ViewAuthorityResponse,
} from '../../../../shared/services/authority.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  AccessAuthorityResponse,
  AccessService,
} from '../../../../shared/services/access.service';

import { authorityQueryTranslations } from './authority-query.translations';

@Component({
  selector: 'app-authority-query',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, ConfirmDialog, Dialog, AppInput, Button, DropDown, Table],
  templateUrl: './authority-query.html',
  styleUrl: './authority-query.scss',
})
export class AuthorityQuery implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private authorityService = inject(AuthorityService);
  private accessService = inject(AccessService);
  private toast = inject(ToastService);

  readonly translations = authorityQueryTranslations;

  readonly form = this.fb.group({
    search: [''],
  });

  readonly authorityForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    scope: ['SYSTEM', [Validators.required]],
    description: ['', [Validators.maxLength(255)]],
  });

  readonly viewAuthorityForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    scope: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
  });

  authorityDialogOpen = false;
  viewAuthorityDialogOpen = false;
  createAuthorityLoading = false;
  viewAuthorityLoading = false;
  updateAuthorityLoading = false;
  authorityAccessLoading = false;
  authoritiesLoading = false;
  authorities: ListAuthorityItem[] = [];
  authorityAccess: AccessAuthorityResponse | null = null;
  authorityDeleteDialogOpen = false;
  authorityDeleteLoading = false;
  totalRecords = 0;
  page = 1;
  pageSize = 10;
  private selectedAuthorityId: string | null = null;
  private authorityIdPendingDelete: string | null = null;

  ngOnInit(): void {
    this.loadAuthorities();
    this.listenFilterChanges();
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get columns(): TableColumn[] {
    return [
      {
        field: 'code',
        header: this.t.table.code,
        width: '120px',
      },
      {
        field: 'name',
        header: this.t.table.name,
        width: '240px',
      },
      {
        field: 'scope',
        header: this.t.table.scope,
        type: 'badge',
        badgeSeverity: 'info',
        width: '150px',
      },
      {
        field: 'createdAt',
        header: this.t.table.createdAt,
        width: '150px',
      },
    ];
  }

  get actions(): TableAction[] {
    return [
      {
        key: 'view',
        label: this.t.actions.view,
        icon: 'visibility',
        severity: 'secondary',
      },
      {
        key: 'delete',
        label: this.t.actions.delete,
        icon: 'delete',
        severity: 'danger',
      },
    ];
  }

  get scopeOptions(): DropDownOption[] {
    return [
      {
        label: this.t.scopes.system,
        value: 'SYSTEM',
        icon: 'settings_applications',
      },
      {
        label: this.t.scopes.credential,
        value: 'CREDENTIAL',
        icon: 'vpn_key',
      },
    ];
  }

  get totalAuthorities(): number {
    return this.totalRecords;
  }

  get filteredAuthorities(): TableRow[] {
    return this.authorities
      .map((authority) => ({
        id: authority.id,
        code: authority.code,
        name: authority.name,
        scope: authority.scope,
        createdAt: authority.createdAt,
      }));
  }

  addAuthority(): void {
    this.authorityForm.reset();
    this.authorityDialogOpen = true;
  }

  closeAuthorityDialog(): void {
    if (this.createAuthorityLoading) {
      return;
    }

    this.authorityDialogOpen = false;
  }

  closeViewAuthorityDialog(): void {
    if (this.updateAuthorityLoading) {
      return;
    }

    this.viewAuthorityDialogOpen = false;
  }

  submitAuthority(): void {
    if (this.authorityForm.invalid) {
      this.authorityForm.markAllAsTouched();
      return;
    }

    const payload = this.getCreatePayload();

    this.createAuthorityLoading = true;

    this.authorityService
      .create(payload)
      .pipe(
        finalize(() => {
          this.createAuthorityLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.createdSummary, this.t.toast.createdDetail, 4000);
          this.createAuthorityLoading = false;
          this.closeAuthorityDialog();
          this.page = 1;
          this.loadAuthorities();
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

  handlePageChange(event: { page: number; pageSize: number }): void {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadAuthorities();
  }

  handleTableAction(event: TableActionEvent): void {
    if (event.action.key === 'view') {
      this.openViewAuthority(String(event.row['id'] ?? ''));
      return;
    }

    if (event.action.key === 'delete') {
      this.openDeleteAuthorityDialog(String(event.row['id'] ?? ''));
    }
  }

  closeDeleteAuthorityDialog(): void {
    if (this.authorityDeleteLoading) {
      return;
    }

    this.authorityDeleteDialogOpen = false;
    this.authorityIdPendingDelete = null;
  }

  confirmDeleteAuthority(): void {
    if (!this.authorityIdPendingDelete) {
      return;
    }

    this.deleteAuthority(this.authorityIdPendingDelete);
  }

  submitUpdateAuthority(): void {
    if (!this.selectedAuthorityId || this.viewAuthorityForm.invalid) {
      this.viewAuthorityForm.markAllAsTouched();
      return;
    }

    const payload = this.getUpdatePayload();

    this.setUpdateAuthorityLoading(true);

    this.authorityService
      .update(this.selectedAuthorityId, payload)
      .pipe(
        finalize(() => {
          this.setUpdateAuthorityLoading(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.updatedSummary, this.t.toast.updatedDetail, 4000);
          this.viewAuthorityDialogOpen = false;
          this.loadAuthorities();
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

  private loadAuthorities(): void {
    const { search } = this.form.getRawValue();

    this.authoritiesLoading = true;

    this.authorityService
      .list({
        search,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.authoritiesLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.authorities = response.items;
          this.totalRecords = response.total;
          this.page = response.page;
          this.pageSize = response.pageSize;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.authorities = [];
          this.totalRecords = 0;
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private listenFilterChanges(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadAuthorities();
      });
  }

  private openDeleteAuthorityDialog(id: string): void {
    if (!id) {
      return;
    }

    this.authorityIdPendingDelete = id;
    this.authorityDeleteDialogOpen = true;
  }

  private deleteAuthority(id: string): void {
    this.authorityDeleteLoading = true;

    this.authorityService
      .delete(id)
      .pipe(
        finalize(() => {
          this.authorityDeleteLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.deletedSummary, this.t.toast.deletedDetail, 4000);
          this.authorityDeleteDialogOpen = false;
          this.authorityIdPendingDelete = null;

          if (this.selectedAuthorityId === id) {
            this.viewAuthorityDialogOpen = false;
            this.selectedAuthorityId = null;
          }

          this.loadAuthorities();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.deleteErrorDetail;

          this.toast.error(this.t.toast.deleteErrorSummary, message, 5000);
        },
      });
  }

  private openViewAuthority(id: string): void {
    if (!id) {
      return;
    }

    this.selectedAuthorityId = id;
    this.authorityAccess = null;
    this.viewAuthorityForm.reset();
    this.viewAuthorityDialogOpen = true;
    this.setViewAuthorityLoading(true);
    this.loadAuthorityAccess(id);

    this.authorityService
      .view(id)
      .pipe(
        finalize(() => {
          this.setViewAuthorityLoading(false);
        }),
      )
      .subscribe({
        next: (authority) => {
          this.fillViewAuthorityForm(authority);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.viewErrorDetail;

          this.toast.error(this.t.toast.viewErrorSummary, message, 5000);
          this.viewAuthorityDialogOpen = false;
        },
      });
  }

  private loadAuthorityAccess(authorityId: string): void {
    this.authorityAccessLoading = true;

    this.accessService
      .getAuthorityAccess(authorityId)
      .pipe(
        finalize(() => {
          this.authorityAccessLoading = false;
        }),
      )
      .subscribe({
        next: (access) => {
          this.authorityAccess = {
            scope: access.scope,
            users: this.getArrayValue(access, ['users'])
              .map((user) => this.normalizeAccessUser(user)),
            userCredentials: this.getArrayValue(access, ['userCredentials', 'credentials'])
              .map((usage) => this.normalizeAuthorityCredentialUsage(usage)),
          };
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.accessErrorDetail;

          this.toast.error(this.t.toast.accessErrorSummary, message, 5000);
        },
      });
  }

  private normalizeAccessUser(value: unknown): AccessAuthorityResponse['users'][number] {
    const record = this.asRecord(value);
    const user = this.asRecord(record['user'] ?? value);
    const person = this.asRecord(user['person'] ?? record['person']);

    return {
      id: this.toText(user['id'] ?? record['id']),
      userId: this.toText(record['userId'] ?? record['user_id'] ?? user['id']),
      userCredentialId: this.toText(
        record['userCredentialId'] ?? record['user_credential_id'] ?? record['id'],
      ),
      name: this.toText(record['name'] ?? user['name'] ?? person['name'], '-'),
      email: this.toText(record['email'] ?? user['email'] ?? person['email']),
      active: Boolean(record['active'] ?? true),
      authorities: [],
    };
  }

  private normalizeAuthorityCredentialUsage(value: unknown): AccessAuthorityResponse['userCredentials'][number] {
    const record = this.asRecord(value);
    const user = this.asRecord(record['user']);
    const person = this.asRecord(user['person']);
    const credential = this.asRecord(record['credential']);

    return {
      userCredentialId: this.toText(
        record['userCredentialId'] ?? record['user_credential_id'] ?? record['id'],
      ),
      userId: this.toText(record['userId'] ?? record['user_id'] ?? user['id']),
      userName: this.toText(record['userName'] ?? user['name'] ?? person['name']),
      credentialId: this.toText(
        record['credentialId'] ?? record['credential_id'] ?? credential['id'],
      ),
      credentialName: this.toText(record['credentialName'] ?? credential['name']),
      active: Boolean(record['active'] ?? true),
    };
  }

  private getArrayValue(value: unknown, keys: string[]): unknown[] {
    const record = this.asRecord(value);

    for (const key of keys) {
      const possibleValue = record[key];

      if (Array.isArray(possibleValue)) {
        return possibleValue;
      }
    }

    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
  }

  private toText(value: unknown, fallback = ''): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    return String(value);
  }

  private getCreatePayload(): CreateAuthorityDto {
    const { code, name, scope, description } = this.authorityForm.getRawValue();
    const trimmedDescription = description.trim();

    return {
      code: code.trim(),
      name: name.trim(),
      scope: scope as 'SYSTEM' | 'CREDENTIAL',
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    };
  }

  private getUpdatePayload(): UpdateAuthorityDto {
    const { name, scope, description } = this.viewAuthorityForm.getRawValue();
    const trimmedDescription = description.trim();

    return {
      name: name.trim(),
      scope: scope.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    };
  }

  private fillViewAuthorityForm(authority: ViewAuthorityResponse): void {
    this.viewAuthorityForm.setValue({
      name: authority.name,
      scope: authority.scope,
      description: authority.description ?? '',
    });
  }

  private setViewAuthorityLoading(value: boolean): void {
    this.viewAuthorityLoading = value;
    this.syncViewAuthorityFormState();
  }

  private setUpdateAuthorityLoading(value: boolean): void {
    this.updateAuthorityLoading = value;
    this.syncViewAuthorityFormState();
  }

  private syncViewAuthorityFormState(): void {
    const disabled = this.viewAuthorityLoading || this.updateAuthorityLoading;

    this.setControlsDisabled(
      [
        this.viewAuthorityForm.controls.name,
        this.viewAuthorityForm.controls.scope,
        this.viewAuthorityForm.controls.description,
      ],
      disabled,
    );
  }

  private setControlsDisabled(controls: AbstractControl[], disabled: boolean): void {
    controls.forEach((control) => {
      if (disabled && control.enabled) {
        control.disable({ emitEvent: false });
        return;
      }

      if (!disabled && control.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }
}
