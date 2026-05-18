import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, finalize, Observable } from 'rxjs';

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
  CreateCredentialDto,
  CredentialService,
  ListCredentialItem,
  ListCredentialsStatusFilter,
  ViewCredentialResponse,
} from '../../../../shared/services/credential.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  AccessCredentialResponse,
  AccessService,
  AccessUser,
} from '../../../../shared/services/access.service';
import {
  AuthorityService,
  ListAuthorityItem,
} from '../../../../shared/services/authority.service';
import {
  ListUserItem,
  UserService,
} from '../../../../shared/services/user.service';

import { credentialQueryTranslations } from './credential-query.translations';

@Component({
  selector: 'app-credential-query',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, ConfirmDialog, Dialog, AppInput, Button, DropDown, Table],
  templateUrl: './credential-query.html',
  styleUrl: './credential-query.scss',
})
export class CredentialQuery implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private credentialService = inject(CredentialService);
  private accessService = inject(AccessService);
  private authorityService = inject(AuthorityService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  readonly translations = credentialQueryTranslations;

  readonly form = this.fb.group({
    search: [''],
    status: ['all'],
  });

  readonly credentialForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(255)]],
    accessKeyId: ['', [Validators.required, Validators.maxLength(255)]],
    secretKeyId: ['', [Validators.required, Validators.maxLength(255)]],
  });

  readonly viewCredentialForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    active: [true],
  });

  readonly credentialUserForm = this.fb.group({
    userId: [''],
  });

  readonly credentialUserAuthorityForm = this.fb.group({
    userCredentialId: [''],
    authorityId: [''],
  });

  credentialDialogOpen = false;
  viewCredentialDialogOpen = false;
  createCredentialLoading = false;
  viewCredentialLoading = false;
  updateCredentialLoading = false;
  credentialAccessLoading = false;
  accessActionLoading = false;
  credentialsLoading = false;
  credentials: ListCredentialItem[] = [];
  credentialAccess: AccessCredentialResponse | null = null;
  credentialDeleteDialogOpen = false;
  credentialDeleteLoading = false;
  availableUsers: ListUserItem[] = [];
  credentialAuthorities: ListAuthorityItem[] = [];
  totalRecords = 0;
  page = 1;
  pageSize = 10;
  private selectedCredentialId: string | null = null;
  private credentialIdPendingDelete: string | null = null;

  ngOnInit(): void {
    this.loadCredentials();
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
        field: 'name',
        header: this.t.table.name,
        width: '220px',
      },
      {
        field: 'statusLabel',
        header: this.t.table.status,
        type: 'badge',
        badgeSeverityField: 'statusSeverity',
        width: '128px',
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

  get totalCredentials(): number {
    return this.totalRecords;
  }

  get activeCredentials(): number {
    return this.credentials.filter((credential) => credential.active).length;
  }

  get statusOptions(): DropDownOption[] {
    return [
      {
        label: this.t.statuses.all,
        value: 'all',
        icon: 'filter_list',
      },
      {
        label: this.t.statuses.active,
        value: 'active',
        icon: 'check_circle',
      },
      {
        label: this.t.statuses.inactive,
        value: 'inactive',
        icon: 'block',
      },
    ];
  }

  get viewStatusOptions(): DropDownOption[] {
    return [
      {
        label: this.t.statuses.active,
        value: true,
        icon: 'check_circle',
      },
      {
        label: this.t.statuses.inactive,
        value: false,
        icon: 'block',
      },
    ];
  }

  get userOptions(): DropDownOption[] {
    const linkedUserIds = new Set(
      (this.credentialAccess?.users ?? []).map((user) => user.userId),
    );

    return this.availableUsers
      .filter((user) => !linkedUserIds.has(user.id))
      .map((user) => ({
        label: user.name,
        value: user.id,
        icon: 'person',
        description: user.email,
      }));
  }

  get credentialUserOptions(): DropDownOption[] {
    return (this.credentialAccess?.users ?? []).map((user) => ({
      label: user.name,
      value: user.userCredentialId,
      icon: 'person',
      description: user.email,
    }));
  }

  get credentialAuthorityOptions(): DropDownOption[] {
    const selectedUserCredentialId =
      this.credentialUserAuthorityForm.controls.userCredentialId.getRawValue();
    const selectedUser = this.credentialAccess?.users.find(
      (user) => user.userCredentialId === selectedUserCredentialId,
    );
    const linkedAuthorityIds = new Set(
      (selectedUser?.authorities ?? []).map((authority) => authority.id),
    );

    return this.credentialAuthorities
      .filter((authority) => !linkedAuthorityIds.has(authority.id))
      .map((authority) => ({
        label: authority.name,
        value: authority.id,
        icon: 'admin_panel_settings',
        description: authority.code,
      }));
  }

  get filteredCredentials(): TableRow[] {
    return this.credentials
      .map((credential) => ({
        id: credential.id,
        name: credential.name,
        statusLabel: credential.active ? this.t.statuses.active : this.t.statuses.inactive,
        statusSeverity: credential.active ? 'success' : 'secondary',
        createdAt: credential.createdAt,
      }));
  }

  addCredential(): void {
    this.credentialForm.reset();
    this.credentialDialogOpen = true;
  }

  closeCredentialDialog(): void {
    if (this.createCredentialLoading) {
      return;
    }

    this.credentialDialogOpen = false;
  }

  closeViewCredentialDialog(): void {
    if (this.updateCredentialLoading) {
      return;
    }

    this.viewCredentialDialogOpen = false;
  }

  submitCredential(): void {
    if (this.credentialForm.invalid) {
      this.credentialForm.markAllAsTouched();
      return;
    }

    const payload = this.getCreatePayload();

    this.createCredentialLoading = true;

    this.credentialService
      .create(payload)
      .pipe(
        finalize(() => {
          this.createCredentialLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.createdSummary, this.t.toast.createdDetail, 4000);
          this.createCredentialLoading = false;
          this.closeCredentialDialog();
          this.page = 1;
          this.loadCredentials();
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
    this.loadCredentials();
  }

  handleTableAction(event: TableActionEvent): void {
    if (event.action.key === 'view') {
      this.openViewCredential(String(event.row['id'] ?? ''));
      return;
    }

    if (event.action.key === 'delete') {
      this.openDeleteCredentialDialog(String(event.row['id'] ?? ''));
    }
  }

  closeDeleteCredentialDialog(): void {
    if (this.credentialDeleteLoading) {
      return;
    }

    this.credentialDeleteDialogOpen = false;
    this.credentialIdPendingDelete = null;
  }

  confirmDeleteCredential(): void {
    if (!this.credentialIdPendingDelete) {
      return;
    }

    this.deleteCredential(this.credentialIdPendingDelete);
  }

  addUserToCredential(): void {
    if (!this.selectedCredentialId) {
      return;
    }

    const userId = this.credentialUserForm.controls.userId.getRawValue();

    if (!userId) {
      return;
    }

    this.runAccessAction(
      this.accessService.addUserCredential(userId, this.selectedCredentialId),
      () => {
        this.credentialUserForm.reset();
        this.loadCredentialAccess(this.selectedCredentialId!);
      },
    );
  }

  toggleCredentialUser(user: AccessUser): void {
    this.runAccessAction(
      this.accessService.updateUserCredential(user.userCredentialId, !user.active),
      () => this.selectedCredentialId && this.loadCredentialAccess(this.selectedCredentialId),
    );
  }

  removeUserFromCredential(userCredentialId: string): void {
    this.runAccessAction(
      this.accessService.removeUserCredential(userCredentialId),
      () => this.selectedCredentialId && this.loadCredentialAccess(this.selectedCredentialId),
    );
  }

  addAuthorityToCredentialUser(): void {
    const { userCredentialId, authorityId } =
      this.credentialUserAuthorityForm.getRawValue();

    if (!userCredentialId || !authorityId) {
      return;
    }

    this.runAccessAction(
      this.accessService.addUserCredentialAuthority(userCredentialId, authorityId),
      () => {
        this.credentialUserAuthorityForm.controls.authorityId.reset();
        this.selectedCredentialId && this.loadCredentialAccess(this.selectedCredentialId);
      },
    );
  }

  removeAuthorityFromCredentialUser(userCredentialId: string, authorityId: string): void {
    this.runAccessAction(
      this.accessService.removeUserCredentialAuthority(userCredentialId, authorityId),
      () => this.selectedCredentialId && this.loadCredentialAccess(this.selectedCredentialId),
    );
  }

  submitUpdateCredential(): void {
    if (!this.selectedCredentialId || this.viewCredentialForm.invalid) {
      this.viewCredentialForm.markAllAsTouched();
      return;
    }

    const { name, active } = this.viewCredentialForm.getRawValue();

    this.setUpdateCredentialLoading(true);

    this.credentialService
      .update(this.selectedCredentialId, {
        name: name.trim(),
        active,
      })
      .pipe(
        finalize(() => {
          this.setUpdateCredentialLoading(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.updatedSummary, this.t.toast.updatedDetail, 4000);
          this.viewCredentialDialogOpen = false;
          this.loadCredentials();
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

  private loadCredentials(): void {
    const { search, status } = this.form.getRawValue();

    this.credentialsLoading = true;

    this.credentialService
      .list({
        search,
        status: status as ListCredentialsStatusFilter,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.credentialsLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.credentials = response.items;
          this.totalRecords = response.total;
          this.page = response.page;
          this.pageSize = response.pageSize;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.credentials = [];
          this.totalRecords = 0;
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private openDeleteCredentialDialog(id: string): void {
    if (!id) {
      return;
    }

    this.credentialIdPendingDelete = id;
    this.credentialDeleteDialogOpen = true;
  }

  private deleteCredential(id: string): void {
    this.credentialDeleteLoading = true;

    this.credentialService
      .delete(id)
      .pipe(
        finalize(() => {
          this.credentialDeleteLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.deletedSummary, this.t.toast.deletedDetail, 4000);
          this.credentialDeleteDialogOpen = false;
          this.credentialIdPendingDelete = null;

          if (this.selectedCredentialId === id) {
            this.viewCredentialDialogOpen = false;
            this.selectedCredentialId = null;
          }

          this.loadCredentials();
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

  private listenFilterChanges(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadCredentials();
      });
  }

  private openViewCredential(id: string): void {
    if (!id) {
      return;
    }

    this.selectedCredentialId = id;
    this.credentialAccess = null;
    this.credentialUserForm.reset();
    this.credentialUserAuthorityForm.reset();
    this.viewCredentialForm.reset();
    this.viewCredentialDialogOpen = true;
    this.setViewCredentialLoading(true);
    this.loadCredentialAccessOptions();
    this.loadCredentialAccess(id);

    this.credentialService
      .view(id)
      .pipe(
        finalize(() => {
          this.setViewCredentialLoading(false);
        }),
      )
      .subscribe({
        next: (credential) => {
          this.fillViewCredentialForm(credential);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.viewErrorDetail;

          this.toast.error(this.t.toast.viewErrorSummary, message, 5000);
          this.viewCredentialDialogOpen = false;
        },
      });
  }

  private loadCredentialAccess(credentialId: string): void {
    this.setCredentialAccessLoading(true);

    this.accessService
      .getCredentialAccess(credentialId)
      .pipe(
        finalize(() => {
          this.setCredentialAccessLoading(false);
        }),
      )
      .subscribe({
        next: (access) => {
          this.credentialAccess = {
            users: this.getArrayValue(access, ['users', 'userCredentials'])
              .map((user) => this.normalizeAccessUser(user)),
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

  private loadCredentialAccessOptions(): void {
    this.userService
      .list({ status: 'all', page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.availableUsers = response.items;
        },
      });

    this.authorityService
      .list({ scope: 'CREDENTIAL', page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.credentialAuthorities = response.items.filter((authority) => authority.scope === 'CREDENTIAL');
        },
      });
  }

  private runAccessAction(request: Observable<unknown>, onSuccess: () => void): void {
    this.setAccessActionLoading(true);

    request
      .pipe(
        finalize(() => {
          this.setAccessActionLoading(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.accessUpdatedSummary, this.t.toast.accessUpdatedDetail, 3000);
          onSuccess();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.accessUpdateErrorDetail;

          this.toast.error(this.t.toast.accessUpdateErrorSummary, message, 5000);
        },
      });
  }

  private normalizeAccessUser(value: unknown): AccessUser {
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
      authorities: this.normalizeAccessAuthorities(
        this.getArrayValue(record, ['authorities', 'credentialAuthorities', 'userCredentialAuthorities']),
      ),
    };
  }

  private normalizeAccessAuthorities(values: unknown[]): AccessUser['authorities'] {
    return values.map((value) => {
      const record = this.asRecord(value);
      const authority = this.asRecord(record['authority'] ?? value);

      return {
        id: this.toText(record['authorityId'] ?? record['authority_id'] ?? authority['id']),
        code: this.toText(authority['code']),
        name: this.toText(authority['name'], '-'),
        scope: this.toText(authority['scope']),
      };
    });
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

  private getCreatePayload(): CreateCredentialDto {
    const { name, description, accessKeyId, secretKeyId } =
      this.credentialForm.getRawValue();

    const trimmedDescription = description.trim();
    return {
      name: name.trim(),
      accessKeyId: accessKeyId.trim(),
      secretKeyId: secretKeyId.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    };
  }

  private fillViewCredentialForm(credential: ViewCredentialResponse): void {
    this.viewCredentialForm.setValue({
      name: credential.name,
      active: credential.active ?? credential.status === 'active',
    });
  }

  private setViewCredentialLoading(value: boolean): void {
    this.viewCredentialLoading = value;
    this.syncViewCredentialFormState();
  }

  private setUpdateCredentialLoading(value: boolean): void {
    this.updateCredentialLoading = value;
    this.syncViewCredentialFormState();
  }

  private setCredentialAccessLoading(value: boolean): void {
    this.credentialAccessLoading = value;
    this.syncAccessFormState();
  }

  private setAccessActionLoading(value: boolean): void {
    this.accessActionLoading = value;
    this.syncAccessFormState();
  }

  private syncViewCredentialFormState(): void {
    const disabled = this.viewCredentialLoading || this.updateCredentialLoading;

    this.setControlsDisabled(
      [
        this.viewCredentialForm.controls.name,
        this.viewCredentialForm.controls.active,
      ],
      disabled,
    );
  }

  private syncAccessFormState(): void {
    const disabled = this.credentialAccessLoading || this.accessActionLoading;

    this.setControlsDisabled(
      [
        this.credentialUserForm.controls.userId,
        this.credentialUserAuthorityForm.controls.userCredentialId,
        this.credentialUserAuthorityForm.controls.authorityId,
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
