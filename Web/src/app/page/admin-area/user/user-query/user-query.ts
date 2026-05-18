import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, finalize, Observable } from 'rxjs';

import { AppCard } from '../../../../shared/components/card/card';
import { Dialog } from '../../../../shared/components/dialog/dialog';
import { AppInput } from '../../../../shared/components/input/input';
import { Button } from '../../../../shared/components/button/button';
import { DropDown, DropDownOption } from '../../../../shared/components/drop-down/drop-down';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
  TableRow,
} from '../../../../shared/components/table/table';
import { AppLanguage } from '../../../../shared/config/languages.config';
import { LanguageService } from '../../../../shared/services/language.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  AccessCredential,
  AccessService,
  AccessUserResponse,
} from '../../../../shared/services/access.service';
import {
  AuthorityService,
  ListAuthorityItem,
} from '../../../../shared/services/authority.service';
import {
  CredentialService,
  ListCredentialItem,
} from '../../../../shared/services/credential.service';
import {
  ListUserItem,
  ListUserStatus,
  ListUsersStatusFilter,
  UserService,
  ViewUserResponse,
} from '../../../../shared/services/user.service';

import { userQueryTranslations } from './user-query.translations';

@Component({
  selector: 'app-user-query',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, Dialog, AppInput, Button, DropDown, Table],
  templateUrl: './user-query.html',
  styleUrl: './user-query.scss',
})
export class UserQuery implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private toast = inject(ToastService);
  private userService = inject(UserService);
  private accessService = inject(AccessService);
  private authorityService = inject(AuthorityService);
  private credentialService = inject(CredentialService);

  readonly translations = userQueryTranslations;

  readonly form = this.fb.group({
    search: [''],
    status: ['all'],
  });

  readonly newUserForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
  });

  readonly viewUserForm = this.fb.group({
    active: [true],
    lastAccessAt: [''],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
  });

  readonly userSystemAuthorityForm = this.fb.group({
    authorityId: [''],
  });

  readonly userCredentialForm = this.fb.group({
    credentialId: [''],
  });

  readonly userCredentialAuthorityForm = this.fb.group({
    userCredentialId: [''],
    authorityId: [''],
  });

  addUserDialogOpen = false;
  viewUserDialogOpen = false;
  createUserLoading = false;
  viewUserLoading = false;
  updateUserLoading = false;
  userAccessLoading = false;
  accessActionLoading = false;
  usersLoading = false;
  users: ListUserItem[] = [];
  userAccess: AccessUserResponse | null = null;
  systemAuthorities: ListAuthorityItem[] = [];
  credentialAuthorities: ListAuthorityItem[] = [];
  availableCredentials: ListCredentialItem[] = [];
  totalRecords = 0;
  page = 1;
  pageSize = 10;
  private selectedViewUserId: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
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
        field: 'email',
        header: this.t.table.email,
      },
      {
        field: 'role',
        header: this.t.table.role,
        width: '160px',
      },
      {
        field: 'statusLabel',
        header: this.t.table.status,
        type: 'badge',
        badgeSeverityField: 'statusSeverity',
        width: '128px',
      },
      {
        field: 'lastAccess',
        header: this.t.table.lastAccess,
        width: '170px',
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
    ];
  }

  get statusOptions(): DropDownOption[] {
    return [
      {
        label: this.t.filters.allStatuses,
        value: 'all',
        icon: 'filter_list',
      },
      {
        label: this.t.statuses.active,
        value: 'active',
        icon: 'check_circle',
      },
      {
        label: this.t.statuses.pending,
        value: 'pending',
        icon: 'schedule',
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

  get systemAuthorityOptions(): DropDownOption[] {
    return this.systemAuthorities.map((authority) => ({
      label: authority.name,
      value: authority.id,
      icon: 'admin_panel_settings',
      description: authority.code,
    }));
  }

  get credentialOptions(): DropDownOption[] {
    const linkedCredentialIds = new Set(
      (this.userAccess?.credentials ?? []).map((credential) => credential.credentialId),
    );

    return this.availableCredentials
      .filter((credential) => !linkedCredentialIds.has(credential.id))
      .map((credential) => ({
        label: credential.name,
        value: credential.id,
        icon: 'vpn_key',
      }));
  }

  get userCredentialOptions(): DropDownOption[] {
    return (this.userAccess?.credentials ?? []).map((credential) => ({
      label: credential.name,
      value: credential.userCredentialId,
      icon: 'vpn_key',
    }));
  }

  get credentialAuthorityOptions(): DropDownOption[] {
    const selectedUserCredentialId =
      this.userCredentialAuthorityForm.controls.userCredentialId.getRawValue();
    const selectedCredential = this.userAccess?.credentials.find(
      (credential) => credential.userCredentialId === selectedUserCredentialId,
    );
    const linkedAuthorityIds = new Set(
      (selectedCredential?.authorities ?? []).map((authority) => authority.id),
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

  get totalUsers(): number {
    return this.totalRecords;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.status === 'active').length;
  }

  get pendingUsers(): number {
    return this.users.filter((user) => user.status === 'pending').length;
  }

  get filteredUsers(): TableRow[] {
    return this.users
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: this.getRoleLabel(user.role),
        statusLabel: this.t.statuses[user.status],
        statusSeverity: this.getStatusSeverity(user.status),
        lastAccess: this.formatDateTime(user.lastAccess),
      }));
  }

  addUser(): void {
    this.newUserForm.reset();
    this.addUserDialogOpen = true;
  }

  closeAddUserDialog(): void {
    if (this.createUserLoading) {
      return;
    }

    this.addUserDialogOpen = false;
  }

  closeViewUserDialog(): void {
    if (this.updateUserLoading) {
      return;
    }

    this.viewUserDialogOpen = false;
  }

  submitAddUser(): void {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }

    const { name, email, phone } = this.newUserForm.getRawValue();

    this.createUserLoading = true;

    this.userService
      .create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      })
      .pipe(
        finalize(() => {
          this.createUserLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.createdSummary, this.t.toast.createdDetail, 4000);
          this.createUserLoading = false;
          this.closeAddUserDialog();
          this.page = 1;
          this.loadUsers();
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

  handleTableAction(event: TableActionEvent): void {
    if (event.action.key === 'view') {
      this.openViewUser(String(event.row['id'] ?? ''));
    }
  }

  handlePageChange(event: TablePageEvent): void {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  submitUpdateUser(): void {
    if (!this.selectedViewUserId || this.viewUserForm.invalid) {
      this.viewUserForm.markAllAsTouched();
      return;
    }

    const { active, name, phone } = this.viewUserForm.getRawValue();

    this.setUpdateUserLoading(true);

    this.userService
      .update(this.selectedViewUserId, {
        active,
        person: {
          name: name.trim(),
          phone: phone.trim(),
        },
      })
      .pipe(
        finalize(() => {
          this.setUpdateUserLoading(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.updatedSummary, this.t.toast.updatedDetail, 4000);
          this.viewUserDialogOpen = false;
          this.loadUsers();
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

  private loadUsers(): void {
    const { search, status } = this.form.getRawValue();

    this.usersLoading = true;

    this.userService
      .list({
        search,
        status: status as ListUsersStatusFilter,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.usersLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.users = response.items;
          this.totalRecords = response.total;
          this.page = response.page;
          this.pageSize = response.pageSize;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.users = [];
          this.totalRecords = 0;
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private openViewUser(id: string): void {
    if (!id) {
      return;
    }

    this.selectedViewUserId = id;
    this.userAccess = null;
    this.userSystemAuthorityForm.reset();
    this.userCredentialForm.reset();
    this.userCredentialAuthorityForm.reset();
    this.viewUserForm.reset();
    this.viewUserDialogOpen = true;
    this.setViewUserLoading(true);
    this.loadUserAccessOptions();
    this.loadUserAccess(id);

    this.userService
      .view(id)
      .pipe(
        finalize(() => {
          this.setViewUserLoading(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.fillViewUserForm(user);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.viewErrorDetail;

          this.toast.error(this.t.toast.viewErrorSummary, message, 5000);
          this.viewUserDialogOpen = false;
        },
      });
  }

  addSystemAuthorityToUser(): void {
    if (!this.selectedViewUserId) {
      return;
    }

    const authorityId = this.userSystemAuthorityForm.controls.authorityId.getRawValue();

    if (!authorityId) {
      return;
    }

    this.runAccessAction(
      this.accessService.addUserAuthority(this.selectedViewUserId, authorityId),
      () => {
        this.userSystemAuthorityForm.reset();
        this.loadUserAccess(this.selectedViewUserId!);
      },
    );
  }

  removeSystemAuthorityFromUser(authorityId: string): void {
    if (!this.selectedViewUserId) {
      return;
    }

    this.runAccessAction(
      this.accessService.removeUserAuthority(this.selectedViewUserId, authorityId),
      () => this.loadUserAccess(this.selectedViewUserId!),
    );
  }

  addCredentialToUser(): void {
    if (!this.selectedViewUserId) {
      return;
    }

    const credentialId = this.userCredentialForm.controls.credentialId.getRawValue();

    if (!credentialId) {
      return;
    }

    this.runAccessAction(
      this.accessService.addUserCredential(this.selectedViewUserId, credentialId),
      () => {
        this.userCredentialForm.reset();
        this.loadUserAccess(this.selectedViewUserId!);
      },
    );
  }

  toggleUserCredential(credential: AccessCredential): void {
    this.runAccessAction(
      this.accessService.updateUserCredential(credential.userCredentialId, !credential.active),
      () => this.selectedViewUserId && this.loadUserAccess(this.selectedViewUserId),
    );
  }

  removeCredentialFromUser(userCredentialId: string): void {
    this.runAccessAction(
      this.accessService.removeUserCredential(userCredentialId),
      () => this.selectedViewUserId && this.loadUserAccess(this.selectedViewUserId),
    );
  }

  addAuthorityToUserCredential(): void {
    const { userCredentialId, authorityId } =
      this.userCredentialAuthorityForm.getRawValue();

    if (!userCredentialId || !authorityId) {
      return;
    }

    this.runAccessAction(
      this.accessService.addUserCredentialAuthority(userCredentialId, authorityId),
      () => {
        this.userCredentialAuthorityForm.controls.authorityId.reset();
        this.selectedViewUserId && this.loadUserAccess(this.selectedViewUserId);
      },
    );
  }

  removeAuthorityFromUserCredential(userCredentialId: string, authorityId: string): void {
    this.runAccessAction(
      this.accessService.removeUserCredentialAuthority(userCredentialId, authorityId),
      () => this.selectedViewUserId && this.loadUserAccess(this.selectedViewUserId),
    );
  }

  private listenFilterChanges(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadUsers();
      });
  }

  private loadUserAccess(userId: string): void {
    this.setUserAccessLoading(true);

    this.accessService
      .getUserAccess(userId)
      .pipe(
        finalize(() => {
          this.setUserAccessLoading(false);
        }),
      )
      .subscribe({
        next: (access) => {
          this.userAccess = {
            systemAuthorities: this.normalizeAccessAuthorities(
              this.getArrayValue(access, ['systemAuthorities', 'authorities']),
            ),
            credentials: this.getArrayValue(access, ['credentials', 'userCredentials'])
              .map((credential) => this.normalizeAccessCredential(credential)),
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

  private loadUserAccessOptions(): void {
    this.authorityService
      .list({ scope: 'SYSTEM', page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.systemAuthorities = response.items.filter((authority) => authority.scope === 'SYSTEM');
        },
      });

    this.authorityService
      .list({ scope: 'CREDENTIAL', page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.credentialAuthorities = response.items.filter((authority) => authority.scope === 'CREDENTIAL');
        },
      });

    this.credentialService
      .list({ status: 'all', page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.availableCredentials = response.items;
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

  private normalizeAccessCredential(value: unknown): AccessCredential {
    const record = this.asRecord(value);
    const credential = this.asRecord(record['credential'] ?? record['credentials'] ?? value);

    return {
      id: this.toText(record['id']),
      userCredentialId: this.toText(
        record['userCredentialId'] ?? record['user_credential_id'] ?? record['id'],
      ),
      credentialId: this.toText(
        record['credentialId'] ?? record['credential_id'] ?? credential['id'],
      ),
      name: this.toText(record['name'] ?? credential['name'], '-'),
      active: Boolean(record['active'] ?? credential['active'] ?? true),
      authorities: this.normalizeAccessAuthorities(
        this.getArrayValue(record, ['authorities', 'credentialAuthorities', 'userCredentialAuthorities']),
      ),
    };
  }

  private normalizeAccessAuthorities(values: unknown[]): AccessCredential['authorities'] {
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

  private getRoleLabel(role: string): string {
    const roles: Record<AppLanguage, Record<string, string>> = {
      'en-US': {
        admin: 'Administrator',
        operator: 'Operator',
        viewer: 'Viewer',
      },
      'pt-BR': {
        admin: 'Administrador',
        operator: 'Operador',
        viewer: 'Visualizador',
      },
    };

    return roles[this.language][role] ?? role;
  }

  private getStatusSeverity(status: ListUserStatus): string {
    const severityByStatus: Record<ListUserStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
    };

    return severityByStatus[status];
  }

  private fillViewUserForm(user: ViewUserResponse): void {
    this.viewUserForm.setValue({
      active: user.active,
      lastAccessAt: this.formatDateTime(user.lastAccessAt),
      name: user.person.name,
      phone: user.person.phone,
    });
  }

  private setViewUserLoading(value: boolean): void {
    this.viewUserLoading = value;
    this.syncViewUserFormState();
  }

  private setUpdateUserLoading(value: boolean): void {
    this.updateUserLoading = value;
    this.syncViewUserFormState();
  }

  private setUserAccessLoading(value: boolean): void {
    this.userAccessLoading = value;
    this.syncAccessFormState();
  }

  private setAccessActionLoading(value: boolean): void {
    this.accessActionLoading = value;
    this.syncAccessFormState();
  }

  private syncViewUserFormState(): void {
    const disabled = this.viewUserLoading || this.updateUserLoading;

    this.setControlsDisabled(
      [
        this.viewUserForm.controls.active,
        this.viewUserForm.controls.name,
        this.viewUserForm.controls.phone,
      ],
      disabled,
    );
  }

  private syncAccessFormState(): void {
    const disabled = this.userAccessLoading || this.accessActionLoading;

    this.setControlsDisabled(
      [
        this.userSystemAuthorityForm.controls.authorityId,
        this.userCredentialForm.controls.credentialId,
        this.userCredentialAuthorityForm.controls.userCredentialId,
        this.userCredentialAuthorityForm.controls.authorityId,
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

  private formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }

    const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}
