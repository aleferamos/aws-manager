import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Button } from '../../../shared/components/button/button';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { DropDown, DropDownOption } from '../../../shared/components/drop-down/drop-down';
import { AppInput } from '../../../shared/components/input/input';
import {
  Table,
  TableAction,
  TableActionEvent,
  TableColumn,
  TableRow,
} from '../../../shared/components/table/table';
import { AppLanguage } from '../../../shared/config/languages.config';
import { SelectedCredential } from '../../../shared/services/credential-context.service';
import { LanguageService } from '../../../shared/services/language.service';
import {
  CreateSecurityGroupInboundRuleDto,
  SecurityGroupItem,
  SecurityGroupRuleItem,
  SecurityGroupService,
  SecurityGroupTagItem,
} from '../../../shared/services/security-group.service';
import { ToastService } from '../../../shared/services/toast.service';

import { securityGroupsQueryTranslations } from '../security-groups-query/security-groups-query.translations';

type SecurityGroupDetailTab = 'inbound' | 'outbound' | 'tags';
type SourcePreset = 'custom' | 'anywhereIpv4' | 'anywhereIpv6' | 'myIp';

@Component({
  selector: 'app-security-group-detail-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Button, ConfirmDialog, Dialog, DropDown, AppInput, Table],
  templateUrl: './security-group-detail-dialog.html',
  styleUrl: './security-group-detail-dialog.scss',
})
export class SecurityGroupDetailDialog implements OnInit, OnChanges {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  private securityGroupService = inject(SecurityGroupService);
  private toast = inject(ToastService);

  @Input() open = false;
  @Input() groupId = '';
  @Input() credential: SelectedCredential | null = null;
  @Input() region = 'us-east-1';

  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

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

  securityGroup: SecurityGroupItem | null = null;
  inboundRules: SecurityGroupRuleItem[] = [];
  outboundRules: SecurityGroupRuleItem[] = [];
  tags: SecurityGroupTagItem[] = [];
  detailLoading = false;
  createInboundRuleLoading = false;
  updateInboundRuleLoading = false;
  deleteInboundRuleLoading = false;
  deleteInboundRuleDialogOpen = false;
  editInboundRuleDialogOpen = false;
  activeTab: SecurityGroupDetailTab = 'inbound';
  private inboundRulePendingDelete: SecurityGroupRuleItem | null = null;
  private inboundRulePendingEdit: SecurityGroupRuleItem | null = null;

  ngOnInit(): void {
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

  ngOnChanges(): void {
    if (this.open && this.groupId && this.credential) {
      this.loadSecurityGroupDetail();
      return;
    }

    if (!this.open) {
      this.resetState();
    }
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get title(): string {
    const name = this.securityGroup?.groupName || this.securityGroup?.name;

    if (this.groupId && name) {
      return `${this.groupId} - ${name}`;
    }

    return this.groupId || this.t.detail.titleFallback;
  }

  get detailFields(): Array<{ label: string; value: string | number }> {
    return [
      {
        label: this.t.detail.groupName,
        value: this.securityGroup?.groupName || this.securityGroup?.name || '-',
      },
      {
        label: this.t.detail.groupId,
        value: this.securityGroup?.groupId || this.groupId || '-',
      },
      {
        label: this.t.detail.description,
        value: this.securityGroup?.description || '-',
      },
      {
        label: this.t.detail.vpcId,
        value: this.securityGroup?.vpcId || '-',
      },
      {
        label: this.t.detail.ownerId,
        value: this.securityGroup?.ownerId || '-',
      },
      {
        label: this.t.stats.inboundRules,
        value: this.securityGroup?.inboundRuleCount ?? this.inboundRules.length,
      },
      {
        label: this.t.stats.outboundRules,
        value: this.securityGroup?.outboundRuleCount ?? this.outboundRules.length,
      },
      {
        label: this.t.detail.credential,
        value: this.credential?.name || '-',
      },
      {
        label: this.t.detail.region,
        value: this.region,
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
    return this.activeTab === 'outbound'
      ? `${this.t.rulesTable.outboundTitle} (${this.outboundRules.length})`
      : `${this.t.rulesTable.inboundTitle} (${this.inboundRules.length})`;
  }

  get activeRuleRows(): TableRow[] {
    const rules = this.activeTab === 'outbound' ? this.outboundRules : this.inboundRules;

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
    return this.tags.map((tag) => ({
      key: tag.key || '-',
      value: tag.value || '-',
    }));
  }

  close(): void {
    if (this.detailLoading) {
      return;
    }

    this.resetState();
    this.closed.emit();
  }

  setTab(tab: SecurityGroupDetailTab): void {
    this.activeTab = tab;
  }

  submitInboundRule(): void {
    if (!this.credential || !this.groupId) {
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
      .createInboundRule(this.groupId, payload)
      .pipe(
        finalize(() => {
          this.createInboundRuleLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.t.toast.ruleCreatedSummary, this.t.toast.ruleCreatedDetail, 4000);
          this.resetInboundRuleForm();
          this.loadSecurityGroupDetail();
          this.changed.emit();
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

    const rule = this.inboundRules.find((item) => item.securityGroupRuleId === ruleId) ?? null;

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
      !this.credential ||
      !this.groupId ||
      !this.inboundRulePendingDelete?.securityGroupRuleId
    ) {
      return;
    }

    const ruleId = this.inboundRulePendingDelete.securityGroupRuleId;

    this.deleteInboundRuleLoading = true;

    this.securityGroupService
      .deleteInboundRule(this.groupId, ruleId, {
        credentialId: this.credential.id,
        region: this.region,
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
          this.loadSecurityGroupDetail();
          this.changed.emit();
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

  private loadSecurityGroupDetail(): void {
    if (!this.credential || !this.groupId) {
      return;
    }

    this.detailLoading = true;

    this.securityGroupService
      .view(this.groupId, {
        credentialId: this.credential.id,
        region: this.region,
      })
      .pipe(
        finalize(() => {
          this.detailLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.securityGroup = response.securityGroup;
          this.inboundRules = response.inboundRules ?? [];
          this.outboundRules = response.outboundRules ?? [];
          this.tags = response.tags ?? [];
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
          this.close();
        },
      });
  }

  private resetState(): void {
    this.securityGroup = null;
    this.inboundRules = [];
    this.outboundRules = [];
    this.tags = [];
    this.deleteInboundRuleDialogOpen = false;
    this.inboundRulePendingDelete = null;
    this.editInboundRuleDialogOpen = false;
    this.inboundRulePendingEdit = null;
    this.activeTab = 'inbound';
    this.resetInboundRuleForm();
    this.resetEditInboundRuleForm();
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
    if (!this.credential) {
      return null;
    }

    if (form.invalid) {
      form.markAllAsTouched();
      return null;
    }

    const { type, protocol, fromPort, toPort, source, description } =
      form.getRawValue();
    const payload: CreateSecurityGroupInboundRuleDto = {
      credentialId: this.credential.id,
      region: this.region,
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
    if (!this.inboundRulePendingEdit?.securityGroupRuleId) {
      return;
    }

    this.updateInboundRuleLoading = true;

    this.securityGroupService
      .updateInboundRule(
        this.groupId,
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
          this.loadSecurityGroupDetail();
          this.changed.emit();
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
