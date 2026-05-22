import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, finalize, firstValueFrom } from 'rxjs';

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
    phone: ['', [Validators.maxLength(30)]],
  });

  readonly viewUserForm = this.fb.group({
    active: [true],
    lastAccessAt: [''],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
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
  usersLoading = false;
  users: ListUserItem[] = [];
  userAccess: AccessUserResponse | null = null;
  private originalUserAccess: AccessUserResponse | null = null;
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
    this.listenAccessDraftSelections();
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
    const linkedAuthorityIds = new Set(
      (this.userAccess?.systemAuthorities ?? []).map((authority) => authority.id),
    );

    return this.systemAuthorities
      .filter((authority) => !linkedAuthorityIds.has(authority.id))
      .map((authority) => ({
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
        phone: this.normalizeOptionalText(phone),
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

  async submitUpdateUser(): Promise<void> {
    if (!this.selectedViewUserId || this.viewUserForm.invalid) {
      this.viewUserForm.markAllAsTouched();
      return;
    }

    const { active, name, phone } = this.viewUserForm.getRawValue();

    this.setUpdateUserLoading(true);

    try {
      await firstValueFrom(
        this.userService.update(this.selectedViewUserId, {
          active,
          person: {
            name: name.trim(),
            phone: this.normalizeOptionalText(phone),
          },
        }),
      );

      await this.persistAccessDraft();

      this.toast.success(this.t.toast.updatedSummary, this.t.toast.updatedDetail, 4000);
      if (this.userAccess) {
        this.originalUserAccess = this.cloneUserAccess(this.userAccess);
      }
      this.loadUsers();
    } catch (error: any) {
      const message =
        error?.error?.message?.message ??
        error?.error?.message ??
        this.t.toast.updateErrorDetail;

      this.toast.error(this.t.toast.updateErrorSummary, message, 5000);
    } finally {
      this.setUpdateUserLoading(false);
    }
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
    this.originalUserAccess = null;
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
    const authorityId = this.userSystemAuthorityForm.controls.authorityId.getRawValue();
    this.addSystemAuthorityDraft(authorityId);
    this.userSystemAuthorityForm.reset();
  }

  removeSystemAuthorityFromUser(authorityId: string): void {
    if (!this.userAccess) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      systemAuthorities: this.userAccess.systemAuthorities.filter(
        (authority) => authority.id !== authorityId,
      ),
    };
  }

  addCredentialToUser(): void {
    const credentialId = this.userCredentialForm.controls.credentialId.getRawValue();
    this.addCredentialDraft(credentialId);
    this.userCredentialForm.reset();
  }

  toggleUserCredential(credential: AccessCredential): void {
    if (!this.userAccess) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: this.userAccess.credentials.map((currentCredential) =>
        currentCredential.userCredentialId === credential.userCredentialId
          ? { ...currentCredential, active: !currentCredential.active }
          : currentCredential,
      ),
    };
  }

  removeCredentialFromUser(userCredentialId: string): void {
    if (!this.userAccess) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: this.userAccess.credentials.filter(
        (credential) => credential.userCredentialId !== userCredentialId,
      ),
    };
  }

  addAuthorityToUserCredential(): void {
    const { userCredentialId, authorityId } =
      this.userCredentialAuthorityForm.getRawValue();
    this.addCredentialAuthorityDraft(userCredentialId, authorityId);
    this.userCredentialAuthorityForm.controls.authorityId.reset();
  }

  removeAuthorityFromUserCredential(userCredentialId: string, authorityId: string): void {
    if (!this.userAccess) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: this.userAccess.credentials.map((credential) =>
        credential.userCredentialId === userCredentialId
          ? {
              ...credential,
              authorities: credential.authorities.filter((authority) => authority.id !== authorityId),
            }
          : credential,
      ),
    };
  }

  private listenFilterChanges(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadUsers();
      });
  }

  private listenAccessDraftSelections(): void {
    this.userSystemAuthorityForm.controls.authorityId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authorityId) => {
        this.addSystemAuthorityDraft(authorityId);
        this.userSystemAuthorityForm.controls.authorityId.reset('', { emitEvent: false });
      });

    this.userCredentialForm.controls.credentialId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((credentialId) => {
        this.addCredentialDraft(credentialId);
        this.userCredentialForm.controls.credentialId.reset('', { emitEvent: false });
      });

    this.userCredentialAuthorityForm.controls.authorityId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authorityId) => {
        const userCredentialId =
          this.userCredentialAuthorityForm.controls.userCredentialId.getRawValue();

        this.addCredentialAuthorityDraft(userCredentialId, authorityId);
        this.userCredentialAuthorityForm.controls.authorityId.reset('', { emitEvent: false });
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
          const normalizedAccess = {
            systemAuthorities: this.normalizeAccessAuthorities(
              this.getArrayValue(access, ['systemAuthorities', 'authorities']),
            ),
            credentials: this.getArrayValue(access, ['credentials', 'userCredentials'])
              .map((credential) => this.normalizeAccessCredential(credential)),
          };

          this.userAccess = normalizedAccess;
          this.originalUserAccess = this.cloneUserAccess(normalizedAccess);
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

  private addSystemAuthorityDraft(authorityId: string | number | boolean | null): void {
    if (!this.userAccess || !authorityId) {
      return;
    }

    const normalizedAuthorityId = String(authorityId);
    const authority = this.systemAuthorities.find((item) => item.id === normalizedAuthorityId);

    if (
      !authority ||
      this.userAccess.systemAuthorities.some((item) => item.id === normalizedAuthorityId)
    ) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      systemAuthorities: [
        ...this.userAccess.systemAuthorities,
        {
          id: authority.id,
          code: authority.code,
          name: authority.name,
          scope: authority.scope,
        },
      ],
    };
  }

  private addCredentialDraft(credentialId: string | number | boolean | null): void {
    if (!this.userAccess || !credentialId) {
      return;
    }

    const normalizedCredentialId = String(credentialId);
    const credential = this.availableCredentials.find((item) => item.id === normalizedCredentialId);

    if (
      !credential ||
      this.userAccess.credentials.some((item) => item.credentialId === normalizedCredentialId)
    ) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: [
        ...this.userAccess.credentials,
        {
          credentialId: credential.id,
          userCredentialId: this.createDraftUserCredentialId(credential.id),
          name: credential.name,
          active: true,
          authorities: [],
        },
      ],
    };
  }

  private addCredentialAuthorityDraft(
    userCredentialId: string | number | boolean | null,
    authorityId: string | number | boolean | null,
  ): void {
    if (!this.userAccess || !userCredentialId || !authorityId) {
      return;
    }

    const normalizedUserCredentialId = String(userCredentialId);
    const normalizedAuthorityId = String(authorityId);
    const authority = this.credentialAuthorities.find((item) => item.id === normalizedAuthorityId);

    if (!authority) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: this.userAccess.credentials.map((credential) => {
        if (
          credential.userCredentialId !== normalizedUserCredentialId ||
          credential.authorities.some((item) => item.id === normalizedAuthorityId)
        ) {
          return credential;
        }

        return {
          ...credential,
          authorities: [
            ...credential.authorities,
            {
              id: authority.id,
              code: authority.code,
              name: authority.name,
              scope: authority.scope,
            },
          ],
        };
      }),
    };
  }

  private async persistAccessDraft(): Promise<void> {
    if (!this.selectedViewUserId || !this.originalUserAccess || !this.userAccess) {
      return;
    }

    const originalSystemIds = new Set(
      this.originalUserAccess.systemAuthorities.map((authority) => authority.id),
    );
    const currentSystemIds = new Set(
      this.userAccess.systemAuthorities.map((authority) => authority.id),
    );

    for (const authorityId of currentSystemIds) {
      if (!originalSystemIds.has(authorityId)) {
        await firstValueFrom(this.accessService.addUserAuthority(this.selectedViewUserId, authorityId));
      }
    }

    for (const authorityId of originalSystemIds) {
      if (!currentSystemIds.has(authorityId)) {
        await firstValueFrom(
          this.accessService.removeUserAuthority(this.selectedViewUserId, authorityId),
        );
      }
    }

    const originalCredentialsByCredentialId = new Map(
      this.originalUserAccess.credentials.map((credential) => [credential.credentialId, credential]),
    );
    const currentCredentialsByCredentialId = new Map(
      this.userAccess.credentials.map((credential) => [credential.credentialId, credential]),
    );

    for (const originalCredential of this.originalUserAccess.credentials) {
      if (!currentCredentialsByCredentialId.has(originalCredential.credentialId)) {
        await firstValueFrom(
          this.accessService.removeUserCredential(originalCredential.userCredentialId),
        );
      }
    }

    for (const currentCredential of this.userAccess.credentials) {
      const originalCredential = originalCredentialsByCredentialId.get(currentCredential.credentialId);

      if (!originalCredential) {
        const createdCredential = await firstValueFrom(
          this.accessService.addUserCredential(
            this.selectedViewUserId,
            currentCredential.credentialId,
          ),
        );
        const createdCredentialRecord = this.asRecord(createdCredential);
        const userCredentialId = this.toText(
          createdCredentialRecord['userCredentialId'] ?? createdCredentialRecord['id'],
        );

        if (!userCredentialId) {
          continue;
        }

        this.replaceDraftUserCredentialId(currentCredential.credentialId, userCredentialId);

        for (const authority of currentCredential.authorities) {
          await firstValueFrom(
            this.accessService.addUserCredentialAuthority(userCredentialId, authority.id),
          );
        }

        continue;
      }

      if (originalCredential.active !== currentCredential.active) {
        await firstValueFrom(
          this.accessService.updateUserCredential(
            originalCredential.userCredentialId,
            currentCredential.active,
          ),
        );
      }

      await this.persistCredentialAuthoritiesDraft(originalCredential, currentCredential);
    }
  }

  private async persistCredentialAuthoritiesDraft(
    originalCredential: AccessCredential,
    currentCredential: AccessCredential,
  ): Promise<void> {
    const originalAuthorityIds = new Set(
      originalCredential.authorities.map((authority) => authority.id),
    );
    const currentAuthorityIds = new Set(
      currentCredential.authorities.map((authority) => authority.id),
    );

    for (const authorityId of currentAuthorityIds) {
      if (!originalAuthorityIds.has(authorityId)) {
        await firstValueFrom(
          this.accessService.addUserCredentialAuthority(
            originalCredential.userCredentialId,
            authorityId,
          ),
        );
      }
    }

    for (const authorityId of originalAuthorityIds) {
      if (!currentAuthorityIds.has(authorityId)) {
        await firstValueFrom(
          this.accessService.removeUserCredentialAuthority(
            originalCredential.userCredentialId,
            authorityId,
          ),
        );
      }
    }
  }

  private createDraftUserCredentialId(credentialId: string): string {
    return `draft:${credentialId}`;
  }

  private replaceDraftUserCredentialId(credentialId: string, userCredentialId: string): void {
    if (!this.userAccess) {
      return;
    }

    this.userAccess = {
      ...this.userAccess,
      credentials: this.userAccess.credentials.map((credential) =>
        credential.credentialId === credentialId
          ? { ...credential, userCredentialId }
          : credential,
      ),
    };
  }

  private cloneUserAccess(access: AccessUserResponse): AccessUserResponse {
    return {
      systemAuthorities: access.systemAuthorities.map((authority) => ({ ...authority })),
      credentials: access.credentials.map((credential) => ({
        ...credential,
        authorities: credential.authorities.map((authority) => ({ ...authority })),
      })),
    };
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
      phone: user.person.phone ?? '',
    });
  }

  private normalizeOptionalText(value: string): string | null {
    const normalizedValue = value.trim();

    return normalizedValue || null;
  }

  private setViewUserLoading(value: boolean): void {
    this.viewUserLoading = value;
    this.syncViewUserFormState();
  }

  private setUpdateUserLoading(value: boolean): void {
    this.updateUserLoading = value;
    this.syncViewUserFormState();
    this.syncAccessFormState();
  }

  private setUserAccessLoading(value: boolean): void {
    this.userAccessLoading = value;
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
    const disabled = this.userAccessLoading || this.updateUserLoading;

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
