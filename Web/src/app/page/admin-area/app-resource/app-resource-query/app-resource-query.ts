import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, finalize } from 'rxjs';

import { AppCard } from '../../../../shared/components/card/card';
import { Button } from '../../../../shared/components/button/button';
import { Dialog } from '../../../../shared/components/dialog/dialog';
import { DropDown, DropDownOption } from '../../../../shared/components/drop-down/drop-down';
import { AppInput } from '../../../../shared/components/input/input';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableColumn,
  TableRow,
} from '../../../../shared/components/table/table';
import { AppLanguage } from '../../../../shared/config/languages.config';
import {
  AppResource,
  AppResourcePayload,
  AppResourceService,
  AppResourceType,
  ListAppResourcesResponse,
} from '../../../../shared/services/app-resource.service';
import {
  AuthorityService,
  ListAuthorityItem,
} from '../../../../shared/services/authority.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { ToastService } from '../../../../shared/services/toast.service';

import { appResourceQueryTranslations } from './app-resource-query.translations';

@Component({
  selector: 'app-app-resource-query',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, Button, Dialog, DropDown, AppInput, Table],
  templateUrl: './app-resource-query.html',
  styleUrl: './app-resource-query.scss',
})
export class AppResourceQuery implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private appResourceService = inject(AppResourceService);
  private authorityService = inject(AuthorityService);
  private toast = inject(ToastService);

  readonly translations = appResourceQueryTranslations;

  readonly filterForm = this.fb.group({
    search: [''],
  });

  readonly resourceForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
    label: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['PAGE' as AppResourceType, [Validators.required]],
    path: [''],
    icon: [''],
    order: ['0', [Validators.required]],
    active: [true],
    parentId: [''],
    requiredAuthorityId: [''],
  });

  dialogOpen = false;
  editMode = false;
  resourcesLoading = false;
  saveLoading = false;
  viewLoading = false;
  resources: AppResource[] = [];
  authorities: ListAuthorityItem[] = [];
  totalRecords = 0;
  page = 1;
  pageSize = 10;
  private selectedResourceId: string | null = null;

  ngOnInit(): void {
    this.loadResources();
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
      { field: 'code', header: this.t.table.code, width: '180px' },
      { field: 'label', header: this.t.table.label, width: '180px' },
      { field: 'typeLabel', header: this.t.table.type, type: 'badge', badgeSeverity: 'info', width: '120px' },
      { field: 'path', header: this.t.table.path },
      {
        field: 'activeLabel',
        header: this.t.table.active,
        type: 'badge',
        badgeSeverityField: 'activeSeverity',
        width: '120px',
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

  get typeOptions(): DropDownOption[] {
    return [
      { label: this.t.types.menu, value: 'MENU', icon: 'folder' },
      { label: this.t.types.page, value: 'PAGE', icon: 'article' },
      { label: this.t.types.action, value: 'ACTION', icon: 'bolt' },
    ];
  }

  get statusOptions(): DropDownOption[] {
    return [
      { label: this.t.statuses.active, value: true, icon: 'check_circle' },
      { label: this.t.statuses.inactive, value: false, icon: 'block' },
    ];
  }

  get parentOptions(): DropDownOption[] {
    return [
      {
        label: this.t.form.parentPlaceholder,
        value: '',
        icon: 'layers_clear',
      },
      ...this.resources
        .filter((resource) => resource.id !== this.selectedResourceId)
        .map((resource) => ({
          label: resource.label,
          value: resource.id,
          icon: this.iconForType(resource.type),
          description: resource.code,
        })),
    ];
  }

  get authorityOptions(): DropDownOption[] {
    return [
      {
        label: this.t.form.authorityPlaceholder,
        value: '',
        icon: 'lock_open',
      },
      ...this.authorities.map((authority) => ({
        label: authority.name,
        value: authority.id,
        icon: 'admin_panel_settings',
        description: authority.code,
      })),
    ];
  }

  get tableRows(): TableRow[] {
    return this.resources.map((resource) => ({
      id: resource.id,
      code: resource.code,
      label: resource.label,
      typeLabel: this.getTypeLabel(resource.type),
      path: resource.path ?? '-',
      activeLabel: resource.active ? this.t.statuses.active : this.t.statuses.inactive,
      activeSeverity: resource.active ? 'success' : 'secondary',
    }));
  }

  openCreateDialog(): void {
    this.editMode = false;
    this.selectedResourceId = null;
    this.resourceForm.reset({
      code: '',
      label: '',
      type: 'PAGE',
      path: '',
      icon: '',
      order: '0',
      active: true,
      parentId: '',
      requiredAuthorityId: '',
    });
    this.dialogOpen = true;
  }

  closeDialog(): void {
    if (this.saveLoading || this.viewLoading) {
      return;
    }

    this.dialogOpen = false;
  }

  submitResource(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    const payload = this.getPayload();

    this.setSaveLoading(true);

    const request = this.editMode && this.selectedResourceId
      ? this.appResourceService.update(this.selectedResourceId, payload)
      : this.appResourceService.create(payload);

    request
      .pipe(
        finalize(() => {
          this.setSaveLoading(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.editMode ? this.t.toast.updatedSummary : this.t.toast.createdSummary,
            this.editMode ? this.t.toast.updatedDetail : this.t.toast.createdDetail,
            4000,
          );
          this.dialogOpen = false;
          this.appResourceService.clearMenu();
          this.loadResources();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            (this.editMode ? this.t.toast.updateErrorDetail : this.t.toast.createErrorDetail);

          this.toast.error(
            this.editMode ? this.t.toast.updateErrorSummary : this.t.toast.createErrorSummary,
            message,
            5000,
          );
        },
      });
  }

  handleTableAction(event: TableActionEvent): void {
    if (event.action.key === 'view') {
      this.openViewDialog(String(event.row['id'] ?? ''));
    }
  }

  handlePageChange(event: { page: number; pageSize: number }): void {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadResources();
  }

  private openViewDialog(id: string): void {
    if (!id) {
      return;
    }

    this.editMode = true;
    this.selectedResourceId = id;
    this.dialogOpen = true;
    this.setViewLoading(true);

    this.appResourceService
      .view(id)
      .pipe(
        finalize(() => {
          this.setViewLoading(false);
        }),
      )
      .subscribe({
        next: (resource) => {
          this.fillForm(resource);
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.viewErrorDetail;

          this.toast.error(this.t.toast.viewErrorSummary, message, 5000);
          this.dialogOpen = false;
        },
      });
  }

  private loadResources(): void {
    const { search } = this.filterForm.getRawValue();

    this.resourcesLoading = true;

    this.appResourceService
      .list({
        search,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(
        finalize(() => {
          this.resourcesLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.resources = response;
            this.totalRecords = response.length;
            return;
          }

          const paged = response as ListAppResourcesResponse;
          this.resources = paged.items;
          this.totalRecords = paged.total;
          this.page = paged.page;
          this.pageSize = paged.pageSize;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.resources = [];
          this.totalRecords = 0;
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private loadAuthorities(): void {
    this.authorityService
      .list({ page: 1, pageSize: 100 })
      .subscribe({
        next: (response) => {
          this.authorities = response.items;
        },
      });
  }

  private listenFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadResources();
      });
  }

  private getPayload(): AppResourcePayload {
    const {
      code,
      label,
      type,
      path,
      icon,
      order,
      active,
      parentId,
      requiredAuthorityId,
    } = this.resourceForm.getRawValue();

    return {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      type,
      path: this.emptyToNull(path),
      icon: this.emptyToNull(icon),
      order: Number(order || 0),
      active,
      parentId: this.emptyToNull(parentId),
      requiredAuthorityId: this.emptyToNull(requiredAuthorityId),
    };
  }

  private fillForm(resource: AppResource): void {
    this.resourceForm.setValue({
      code: resource.code,
      label: resource.label,
      type: resource.type,
      path: resource.path ?? '',
      icon: resource.icon ?? '',
      order: String(resource.order ?? 0),
      active: resource.active,
      parentId: resource.parentId ?? '',
      requiredAuthorityId: resource.requiredAuthorityId ?? resource.requiredAuthority?.id ?? '',
    });
  }

  private emptyToNull(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private getTypeLabel(type: AppResourceType): string {
    const labels: Record<AppResourceType, string> = {
      MENU: this.t.types.menu,
      PAGE: this.t.types.page,
      ACTION: this.t.types.action,
    };

    return labels[type] ?? type;
  }

  private iconForType(type: AppResourceType): string {
    const icons: Record<AppResourceType, string> = {
      MENU: 'folder',
      PAGE: 'article',
      ACTION: 'bolt',
    };

    return icons[type] ?? 'circle';
  }

  private setSaveLoading(value: boolean): void {
    this.saveLoading = value;
    this.syncResourceFormState();
  }

  private setViewLoading(value: boolean): void {
    this.viewLoading = value;
    this.syncResourceFormState();
  }

  private syncResourceFormState(): void {
    const disabled = this.viewLoading || this.saveLoading;

    this.setControlsDisabled(
      [
        this.resourceForm.controls.code,
        this.resourceForm.controls.label,
        this.resourceForm.controls.type,
        this.resourceForm.controls.path,
        this.resourceForm.controls.icon,
        this.resourceForm.controls.order,
        this.resourceForm.controls.active,
        this.resourceForm.controls.parentId,
        this.resourceForm.controls.requiredAuthorityId,
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
