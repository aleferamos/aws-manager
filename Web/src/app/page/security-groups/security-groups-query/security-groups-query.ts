import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, finalize } from 'rxjs';

import { AppCard } from '../../../shared/components/card/card';
import { Button } from '../../../shared/components/button/button';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { DropDown, DropDownOption } from '../../../shared/components/drop-down/drop-down';
import { AppInput } from '../../../shared/components/input/input';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableCellEvent,
  TableColumn,
  TableRow,
} from '../../../shared/components/table/table';
import { AppLanguage } from '../../../shared/config/languages.config';
import {
  CredentialContextService,
  SelectedCredential,
} from '../../../shared/services/credential-context.service';
import { LanguageService } from '../../../shared/services/language.service';
import {
  CreateSecurityGroupInboundRuleDto,
  SecurityGroupItem,
  SecurityGroupRuleItem,
  SecurityGroupService,
  SecurityGroupTagItem,
} from '../../../shared/services/security-group.service';
import { ToastService } from '../../../shared/services/toast.service';

import { securityGroupsQueryTranslations } from './security-groups-query.translations';

type SecurityGroupDetailTab = 'inbound' | 'outbound' | 'tags';
type SourcePreset = 'custom' | 'anywhereIpv4' | 'anywhereIpv6' | 'myIp';

@Component({
  selector: 'app-security-groups-query',
  standalone: true,
  imports: [ReactiveFormsModule, AppCard, Button, ConfirmDialog, Dialog, DropDown, AppInput, Table],
  templateUrl: './security-groups-query.html',
  styleUrl: './security-groups-query.scss',
})
export class SecurityGroupsQuery implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private credentialContext = inject(CredentialContextService);
  private languageService = inject(LanguageService);
  private securityGroupService = inject(SecurityGroupService);
  private toast = inject(ToastService);

  readonly translations = securityGroupsQueryTranslations;

  readonly inboundRuleForm = this.fb.group({
    type: ['Custom TCP', [Validators.required]],
    protocol: ['tcp'],
    fromPort: [''],
    toPort: [''],
    sourcePreset: ['custom' as SourcePreset],
    source: ['0.0.0.0/0', [Validators.required]],
    description: [''],
  });

  readonly editInboundRuleForm = this.fb.group({
    type: ['Custom TCP', [Validators.required]],
    protocol: ['tcp'],
    fromPort: [''],
    toPort: [''],
    sourcePreset: ['custom' as SourcePreset],
    source: ['0.0.0.0/0', [Validators.required]],
    description: [''],
  });

  selectedCredential: SelectedCredential | null = null;
  selectedRegion = this.credentialContext.selectedRegion;
  securityGroups: SecurityGroupItem[] = [];
  selectedSecurityGroup: SecurityGroupItem | null = null;
  inboundDetailRules: SecurityGroupRuleItem[] = [];
  outboundDetailRules: SecurityGroupRuleItem[] = [];
  detailTags: SecurityGroupTagItem[] = [];
  detailDialogOpen = false;
  detailLoading = false;
  createInboundRuleLoading = false;
  updateInboundRuleLoading = false;
  deleteInboundRuleLoading = false;
  deleteInboundRuleDialogOpen = false;
  editInboundRuleDialogOpen = false;
  activeDetailTab: SecurityGroupDetailTab = 'inbound';
  securityGroupsLoading = false;
  private inboundRulePendingDelete: SecurityGroupRuleItem | null = null;
  private inboundRulePendingEdit: SecurityGroupRuleItem | null = null;

  ngOnInit(): void {
    combineLatest([
      this.credentialContext.selectedCredential$,
      this.credentialContext.selectedRegion$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([credential, region]) => {
        this.selectedCredential = credential;
        this.selectedRegion = region;

        if (credential) {
          this.loadSecurityGroups(credential, region);

          if (this.detailDialogOpen && this.selectedSecurityGroup?.groupId) {
            this.loadSecurityGroupDetail(this.selectedSecurityGroup.groupId, credential, region);
          }
        } else {
          this.securityGroups = [];
          this.resetDetailDialog();
        }
      });

    this.inboundRuleForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.applyInboundRuleTypeDefaults(type);
      });

    this.inboundRuleForm.controls.sourcePreset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preset) => {
        this.applySourcePreset(preset, this.inboundRuleForm);
      });

    this.editInboundRuleForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.applyInboundRuleTypeDefaults(type, this.editInboundRuleForm);
      });

    this.editInboundRuleForm.controls.sourcePreset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preset) => {
        this.applySourcePreset(preset, this.editInboundRuleForm);
      });
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get totalSecurityGroups(): number {
    return this.securityGroups.length;
  }

  get inboundRules(): number {
    return this.securityGroups.reduce(
      (total, securityGroup) => total + Number(securityGroup.inboundRuleCount ?? 0),
      0,
    );
  }

  get outboundRules(): number {
    return this.securityGroups.reduce(
      (total, securityGroup) => total + Number(securityGroup.outboundRuleCount ?? 0),
      0,
    );
  }

  get columns(): TableColumn[] {
    return [
      {
        field: 'groupId',
        header: this.t.table.groupId,
        type: 'link',
        width: '180px',
      },
      {
        field: 'groupName',
        header: this.t.table.groupName,
        width: '180px',
      },
      {
        field: 'description',
        header: this.t.table.description,
        width: '260px',
      },
      {
        field: 'vpcId',
        header: this.t.table.vpcId,
        width: '180px',
      },
      {
        field: 'ownerId',
        header: this.t.table.ownerId,
        width: '150px',
      },
      {
        field: 'inboundRuleCount',
        header: this.t.table.inboundRuleCount,
        width: '130px',
      },
      {
        field: 'outboundRuleCount',
        header: this.t.table.outboundRuleCount,
        width: '140px',
      },
    ];
  }

  get inboundRuleActions(): TableAction[] {
    return [
      {
        key: 'edit',
        label: this.t.actions.edit,
        icon: 'edit',
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

  get inboundRuleTypeOptions(): DropDownOption[] {
    return [
      'Custom TCP',
      'Custom UDP',
      'Custom ICMP - IPv4',
      'Custom Protocol',
      'All TCP',
      'All UDP',
      'All ICMP - IPv4',
      'All ICMP - IPv6',
      'All traffic',
      'SSH',
      'SMTP',
      'DNS (UDP)',
      'DNS (TCP)',
      'HTTP',
      'POP3',
      'IMAP',
      'LDAP',
      'HTTPS',
      'SMB',
      'SMTPS',
      'IMAPS',
      'POP3S',
      'MSSQL',
      'NFS',
      'MYSQL/Aurora',
      'RDP',
      'Redshift',
      'PostgreSQL',
      'Oracle-RDS',
      'WinRM-HTTP',
      'WinRM-HTTPS',
      'Elastic Graphics',
      'CQLSH / CASSANDRA',
    ].map((type) => ({
      label: type,
      value: type,
      icon: 'rule',
    }));
  }

  get sourcePresetOptions(): DropDownOption[] {
    return [
      {
        label: 'Custom',
        value: 'custom',
        icon: 'edit',
      },
      {
        label: 'Anywhere-IPv4',
        value: 'anywhereIpv4',
        icon: 'public',
        description: '0.0.0.0/0',
      },
      {
        label: 'Anywhere-IPv6',
        value: 'anywhereIpv6',
        icon: 'public',
        description: '::/0',
      },
      {
        label: 'My IP',
        value: 'myIp',
        icon: 'my_location',
      },
    ];
  }

  get tableRows(): TableRow[] {
    return this.securityGroups.map((securityGroup) => ({
      ...securityGroup,
      name: securityGroup.name || '-',
      groupName: securityGroup.groupName || '-',
      description: securityGroup.description || '-',
      vpcId: securityGroup.vpcId || '-',
      ownerId: securityGroup.ownerId || '-',
      inboundRuleCount: String(securityGroup.inboundRuleCount ?? 0),
      outboundRuleCount: String(securityGroup.outboundRuleCount ?? 0),
    }));
  }

  get detailTitle(): string {
    const groupId = this.selectedSecurityGroup?.groupId;
    const name = this.selectedSecurityGroup?.groupName || this.selectedSecurityGroup?.name;

    if (groupId && name) {
      return `${groupId} - ${name}`;
    }

    return groupId || this.t.detail.titleFallback;
  }

  get detailFields(): Array<{ label: string; value: string | number }> {
    return [
      {
        label: this.t.detail.groupName,
        value: this.selectedSecurityGroup?.groupName || this.selectedSecurityGroup?.name || '-',
      },
      {
        label: this.t.detail.groupId,
        value: this.selectedSecurityGroup?.groupId || '-',
      },
      {
        label: this.t.detail.description,
        value: this.selectedSecurityGroup?.description || '-',
      },
      {
        label: this.t.detail.vpcId,
        value: this.selectedSecurityGroup?.vpcId || '-',
      },
      {
        label: this.t.detail.ownerId,
        value: this.selectedSecurityGroup?.ownerId || '-',
      },
      {
        label: this.t.stats.inboundRules,
        value: this.selectedSecurityGroup?.inboundRuleCount ?? this.inboundDetailRules.length,
      },
      {
        label: this.t.stats.outboundRules,
        value: this.selectedSecurityGroup?.outboundRuleCount ?? this.outboundDetailRules.length,
      },
      {
        label: this.t.detail.credential,
        value: this.selectedCredential?.name || '-',
      },
      {
        label: this.t.detail.region,
        value: this.selectedRegion,
      },
    ];
  }

  get ruleColumns(): TableColumn[] {
    return [
      { field: 'securityGroupRuleId', header: this.t.rulesTable.ruleId, width: '210px' },
      { field: 'ipVersion', header: this.t.rulesTable.ipVersion, width: '110px' },
      { field: 'type', header: this.t.rulesTable.type, width: '150px' },
      { field: 'protocol', header: this.t.rulesTable.protocol, width: '110px' },
      { field: 'portRange', header: this.t.rulesTable.portRange, width: '120px' },
      { field: 'source', header: this.t.rulesTable.source, width: '170px' },
      { field: 'destination', header: this.t.rulesTable.destination, width: '170px' },
      { field: 'description', header: this.t.rulesTable.description, width: '200px' },
    ];
  }

  get tagColumns(): TableColumn[] {
    return [
      { field: 'key', header: this.t.tagsTable.key, width: '220px' },
      { field: 'value', header: this.t.tagsTable.value },
    ];
  }

  get activeRulesTitle(): string {
    return this.activeDetailTab === 'outbound'
      ? `${this.t.rulesTable.outboundTitle} (${this.outboundDetailRules.length})`
      : `${this.t.rulesTable.inboundTitle} (${this.inboundDetailRules.length})`;
  }

  get activeRuleRows(): TableRow[] {
    const rules = this.activeDetailTab === 'outbound'
      ? this.outboundDetailRules
      : this.inboundDetailRules;

    return rules.map((rule) => ({
      ...rule,
      name: rule.name || '-',
      securityGroupRuleId: rule.securityGroupRuleId || '-',
      ipVersion: rule.ipVersion || '-',
      type: rule.type || '-',
      protocol: rule.protocol || '-',
      portRange: rule.portRange || '-',
      source: rule.source || '-',
      destination: rule.destination || '-',
      description: rule.description || '-',
    }));
  }

  get selectedInboundRuleType(): string {
    return this.inboundRuleForm.controls.type.getRawValue();
  }

  get showInboundRuleProtocol(): boolean {
    return this.selectedInboundRuleType === 'Custom Protocol';
  }

  get showInboundRulePorts(): boolean {
    return ['Custom TCP', 'Custom UDP', 'Custom Protocol'].includes(this.selectedInboundRuleType);
  }

  get selectedEditInboundRuleType(): string {
    return this.editInboundRuleForm.controls.type.getRawValue();
  }

  get showEditInboundRuleProtocol(): boolean {
    return this.selectedEditInboundRuleType === 'Custom Protocol';
  }

  get showEditInboundRulePorts(): boolean {
    return ['Custom TCP', 'Custom UDP', 'Custom Protocol'].includes(this.selectedEditInboundRuleType);
  }

  get tagRows(): TableRow[] {
    return this.detailTags.map((tag) => ({
      key: tag.key || '-',
      value: tag.value || '-',
    }));
  }

  reload(): void {
    if (this.selectedCredential) {
      this.loadSecurityGroups(this.selectedCredential, this.selectedRegion);
    }
  }

  handleCellSelected(event: TableCellEvent): void {
    if (event.column.field !== 'groupId') {
      return;
    }

    const groupId = String(event.row['groupId'] ?? '');

    if (groupId) {
      this.openSecurityGroupDetail(groupId);
    }
  }

  setDetailTab(tab: SecurityGroupDetailTab): void {
    this.activeDetailTab = tab;
  }

  submitInboundRule(): void {
    if (!this.selectedCredential || !this.selectedSecurityGroup?.groupId) {
      return;
    }

    const payload = this.buildInboundRulePayload(
      this.inboundRuleForm,
      this.showInboundRulePorts,
    );

    if (!payload) {
      return;
    }

    this.createInboundRuleLoading = true;

    this.securityGroupService
      .createInboundRule(this.selectedSecurityGroup.groupId, payload)
      .pipe(
        finalize(() => {
          this.createInboundRuleLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.ruleCreatedSummary, this.t.toast.ruleCreatedDetail, 4000);
          this.resetInboundRuleForm();
          this.refreshSelectedSecurityGroup();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.ruleCreateErrorDetail;

          this.toast.error(this.t.toast.ruleCreateErrorSummary, message, 5000);
        },
      });
  }

  handleInboundRuleAction(event: TableActionEvent): void {
    const ruleId = String(event.row['securityGroupRuleId'] ?? '');

    if (!ruleId) {
      return;
    }

    const rule = this.inboundDetailRules.find((item) => item.securityGroupRuleId === ruleId) ?? null;

    if (!rule) {
      return;
    }

    if (event.action.key === 'edit') {
      this.startEditInboundRule(rule);
      return;
    }

    if (event.action.key === 'delete') {
      this.inboundRulePendingDelete = rule;
      this.deleteInboundRuleDialogOpen = true;
    }
  }

  cancelEditInboundRule(): void {
    if (this.updateInboundRuleLoading) {
      return;
    }

    this.editInboundRuleDialogOpen = false;
    this.inboundRulePendingEdit = null;
    this.resetEditInboundRuleForm();
  }

  submitEditInboundRule(): void {
    const payload = this.buildInboundRulePayload(
      this.editInboundRuleForm,
      this.showEditInboundRulePorts,
    );

    if (payload) {
      this.updateInboundRule(payload);
    }
  }

  closeDeleteInboundRuleDialog(): void {
    if (this.deleteInboundRuleLoading) {
      return;
    }

    this.deleteInboundRuleDialogOpen = false;
    this.inboundRulePendingDelete = null;
  }

  confirmDeleteInboundRule(): void {
    if (
      !this.selectedCredential ||
      !this.selectedSecurityGroup?.groupId ||
      !this.inboundRulePendingDelete?.securityGroupRuleId
    ) {
      return;
    }

    const groupId = this.selectedSecurityGroup.groupId;
    const ruleId = this.inboundRulePendingDelete.securityGroupRuleId;

    this.deleteInboundRuleLoading = true;

    this.securityGroupService
      .deleteInboundRule(groupId, ruleId, {
        credentialId: this.selectedCredential.id,
        region: this.selectedRegion,
      })
      .pipe(
        finalize(() => {
          this.deleteInboundRuleLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.ruleDeletedSummary, this.t.toast.ruleDeletedDetail, 4000);
          this.deleteInboundRuleDialogOpen = false;
          this.inboundRulePendingDelete = null;
          this.cancelEditInboundRule();
          this.refreshSelectedSecurityGroup();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.ruleDeleteErrorDetail;

          this.toast.error(this.t.toast.ruleDeleteErrorSummary, message, 5000);
        },
      });
  }

  closeDetailDialog(): void {
    if (this.detailLoading) {
      return;
    }

    this.resetDetailDialog();
  }

  private loadSecurityGroups(credential: SelectedCredential, region: string): void {
    this.securityGroupsLoading = true;

    this.securityGroupService
      .list({
        credentialId: credential.id,
        region,
      })
      .pipe(
        finalize(() => {
          this.securityGroupsLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.securityGroups = response.items ?? [];
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.securityGroups = [];
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private openSecurityGroupDetail(groupId: string): void {
    if (!this.selectedCredential) {
      return;
    }

    this.activeDetailTab = 'inbound';
    this.selectedSecurityGroup =
      this.securityGroups.find((securityGroup) => securityGroup.groupId === groupId) ?? null;
    this.detailDialogOpen = true;
    this.loadSecurityGroupDetail(groupId, this.selectedCredential, this.selectedRegion);
  }

  private loadSecurityGroupDetail(
    groupId: string,
    credential: SelectedCredential,
    region: string,
  ): void {
    this.detailLoading = true;

    this.securityGroupService
      .view(groupId, {
        credentialId: credential.id,
        region,
      })
      .pipe(
        finalize(() => {
          this.detailLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedSecurityGroup = response.securityGroup;
          this.inboundDetailRules = response.inboundRules ?? [];
          this.outboundDetailRules = response.outboundRules ?? [];
          this.detailTags = response.tags ?? [];
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
          this.resetDetailDialog();
        },
      });
  }

  private resetDetailDialog(): void {
    this.detailDialogOpen = false;
    this.selectedSecurityGroup = null;
    this.inboundDetailRules = [];
    this.outboundDetailRules = [];
    this.detailTags = [];
    this.deleteInboundRuleDialogOpen = false;
    this.inboundRulePendingDelete = null;
    this.editInboundRuleDialogOpen = false;
    this.inboundRulePendingEdit = null;
    this.resetInboundRuleForm();
    this.resetEditInboundRuleForm();
  }

  private refreshSelectedSecurityGroup(): void {
    if (!this.selectedCredential || !this.selectedSecurityGroup?.groupId) {
      return;
    }

    this.loadSecurityGroupDetail(
      this.selectedSecurityGroup.groupId,
      this.selectedCredential,
      this.selectedRegion,
    );
    this.loadSecurityGroups(this.selectedCredential, this.selectedRegion);
  }

  private resetInboundRuleForm(): void {
    this.inboundRuleForm.reset({
      type: 'Custom TCP',
      protocol: 'tcp',
      fromPort: '',
      toPort: '',
      sourcePreset: 'custom',
      source: '0.0.0.0/0',
      description: '',
    });
  }

  private resetEditInboundRuleForm(): void {
    this.editInboundRuleForm.reset({
      type: 'Custom TCP',
      protocol: 'tcp',
      fromPort: '',
      toPort: '',
      sourcePreset: 'custom',
      source: '0.0.0.0/0',
      description: '',
    });
  }

  private buildInboundRulePayload(
    form: typeof this.inboundRuleForm,
    showPorts: boolean,
  ): CreateSecurityGroupInboundRuleDto | null {
    if (!this.selectedCredential) {
      return null;
    }

    if (form.invalid) {
      form.markAllAsTouched();
      return null;
    }

    const { type, protocol, fromPort, toPort, source, description } =
      form.getRawValue();
    const payload: CreateSecurityGroupInboundRuleDto = {
      credentialId: this.selectedCredential.id,
      region: this.selectedRegion,
      type,
      source: source.trim(),
      description: description.trim(),
    };
    const protocolValue = this.getProtocolForInboundRule(type, protocol);

    if (protocolValue) {
      payload.protocol = protocolValue;
    }

    if (showPorts) {
      const parsedFromPort = Number(fromPort);
      const parsedToPort = Number(toPort);

      if (!Number.isInteger(parsedFromPort) || !Number.isInteger(parsedToPort)) {
        this.toast.error(this.t.toast.ruleCreateErrorSummary, this.t.ruleForm.invalidPorts, 4000);
        return null;
      }

      payload.fromPort = parsedFromPort;
      payload.toPort = parsedToPort;
    }

    return payload;
  }

  private startEditInboundRule(rule: SecurityGroupRuleItem): void {
    this.inboundRulePendingEdit = rule;
    this.editInboundRuleDialogOpen = true;
    this.editInboundRuleForm.reset({
      type: this.resolveRuleFormType(rule),
      protocol: this.resolveRuleFormProtocol(rule),
      fromPort: this.resolveRuleFormFromPort(rule),
      toPort: this.resolveRuleFormToPort(rule),
      sourcePreset: this.resolveSourcePreset(rule.source ?? ''),
      source: rule.source ?? '',
      description: rule.description ?? '',
    });
  }

  private updateInboundRule(payload: CreateSecurityGroupInboundRuleDto): void {
    if (
      !this.selectedSecurityGroup?.groupId ||
      !this.inboundRulePendingEdit?.securityGroupRuleId
    ) {
      return;
    }

    this.updateInboundRuleLoading = true;

    this.securityGroupService
      .updateInboundRule(
        this.selectedSecurityGroup.groupId,
        this.inboundRulePendingEdit.securityGroupRuleId,
        payload,
      )
      .pipe(
        finalize(() => {
          this.updateInboundRuleLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.ruleUpdatedSummary, this.t.toast.ruleUpdatedDetail, 4000);
          this.editInboundRuleDialogOpen = false;
          this.inboundRulePendingEdit = null;
          this.resetEditInboundRuleForm();
          this.refreshSelectedSecurityGroup();
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.ruleUpdateErrorDetail;

          this.toast.error(this.t.toast.ruleUpdateErrorSummary, message, 5000);
        },
      });
  }

  private applyInboundRuleTypeDefaults(
    type: string,
    form: typeof this.inboundRuleForm = this.inboundRuleForm,
  ): void {
    const protocol = this.getProtocolForInboundRule(type, '');

    if (protocol) {
      form.controls.protocol.setValue(protocol, { emitEvent: false });
    }
  }

  private getProtocolForInboundRule(type: string, fallback: string): string | null {
    if (type === 'All traffic') {
      return '-1';
    }

    if (type === 'Custom TCP') {
      return 'tcp';
    }

    if (type === 'Custom UDP') {
      return 'udp';
    }

    if (type === 'Custom ICMP - IPv4') {
      return 'icmp';
    }

    if (type === 'All ICMP - IPv4') {
      return 'icmp';
    }

    if (type === 'All ICMP - IPv6') {
      return 'icmpv6';
    }

    if (type === 'Custom Protocol') {
      return fallback.trim();
    }

    return null;
  }

  private resolveRuleFormType(rule: SecurityGroupRuleItem): string {
    const type = rule.type || 'Custom TCP';
    const option = this.inboundRuleTypeOptions.find((item) => item.value === type);

    return option ? type : 'Custom Protocol';
  }

  private resolveRuleFormProtocol(rule: SecurityGroupRuleItem): string {
    const protocol = rule.protocol?.toLowerCase();

    if (!protocol || protocol === 'all') {
      return '-1';
    }

    if (protocol === 'icmpv6') {
      return 'icmpv6';
    }

    return protocol;
  }

  private resolveRuleFormFromPort(rule: SecurityGroupRuleItem): string {
    const [fromPort] = this.parsePortRange(rule.portRange);
    return fromPort;
  }

  private resolveRuleFormToPort(rule: SecurityGroupRuleItem): string {
    const [fromPort, toPort] = this.parsePortRange(rule.portRange);
    return toPort || fromPort;
  }

  private parsePortRange(portRange: string | null): [string, string] {
    if (!portRange || portRange === 'All') {
      return ['', ''];
    }

    const [fromPort, toPort] = portRange.split('-');

    return [fromPort ?? '', toPort ?? fromPort ?? ''];
  }

  private resolveSourcePreset(source: string): SourcePreset {
    if (source === '0.0.0.0/0') {
      return 'anywhereIpv4';
    }

    if (source === '::/0') {
      return 'anywhereIpv6';
    }

    return 'custom';
  }

  private applySourcePreset(
    preset: SourcePreset,
    form: typeof this.inboundRuleForm = this.inboundRuleForm,
  ): void {
    if (preset === 'custom') {
      return;
    }

    if (preset === 'anywhereIpv4') {
      form.controls.source.setValue('0.0.0.0/0');
      return;
    }

    if (preset === 'anywhereIpv6') {
      form.controls.source.setValue('::/0');
      return;
    }

    this.fillCurrentPublicIp(form);
  }

  private fillCurrentPublicIp(form: typeof this.inboundRuleForm): void {
    fetch('https://api.ipify.org?format=json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to detect public IP.');
        }

        return response.json() as Promise<{ ip?: string }>;
      })
      .then(({ ip }) => {
        if (!ip) {
          throw new Error('Unable to detect public IP.');
        }

        const cidr = ip.includes(':') ? `${ip}/128` : `${ip}/32`;
        form.controls.source.setValue(cidr);
      })
      .catch(() => {
        form.controls.sourcePreset.setValue('custom', { emitEvent: false });
        form.controls.source.setValue('');
        this.toast.error(this.t.toast.sourceIpErrorSummary, this.t.toast.sourceIpErrorDetail, 5000);
      });
  }
}
