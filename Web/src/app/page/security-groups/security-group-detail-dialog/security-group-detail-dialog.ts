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

  securityGroup: SecurityGroupItem | null = null;
  inboundRules: SecurityGroupRuleItem[] = [];
  outboundRules: SecurityGroupRuleItem[] = [];
  tags: SecurityGroupTagItem[] = [];
  detailLoading = false;
  createInboundRuleLoading = false;
  deleteInboundRuleLoading = false;
  deleteInboundRuleDialogOpen = false;
  activeTab: SecurityGroupDetailTab = 'inbound';
  private inboundRulePendingDelete: SecurityGroupRuleItem | null = null;

  ngOnInit(): void {
    this.inboundRuleForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.applyInboundRuleTypeDefaults(type);
      });

    this.inboundRuleForm.controls.sourcePreset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preset) => {
        this.applySourcePreset(preset);
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

    if (this.inboundRuleForm.invalid) {
      this.inboundRuleForm.markAllAsTouched();
      return;
    }

    const { type, protocol, fromPort, toPort, source, description } =
      this.inboundRuleForm.getRawValue();
    const payload = {
      credentialId: this.credential.id,
      region: this.region,
      type,
      source: source.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
    };

    const protocolValue = this.getProtocolForInboundRule(type, protocol);

    if (protocolValue) {
      Object.assign(payload, { protocol: protocolValue });
    }

    if (this.showInboundRulePorts) {
      const parsedFromPort = Number(fromPort);
      const parsedToPort = Number(toPort);

      if (!Number.isInteger(parsedFromPort) || !Number.isInteger(parsedToPort)) {
        this.toast.error(this.t.toast.ruleCreateErrorSummary, this.t.ruleForm.invalidPorts, 4000);
        return;
      }

      Object.assign(payload, {
        fromPort: parsedFromPort,
        toPort: parsedToPort,
      });
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
    if (event.action.key !== 'delete') {
      return;
    }

    const ruleId = String(event.row['securityGroupRuleId'] ?? '');

    if (!ruleId) {
      return;
    }

    this.inboundRulePendingDelete =
      this.inboundRules.find((rule) => rule.securityGroupRuleId === ruleId) ?? null;
    this.deleteInboundRuleDialogOpen = true;
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
    this.activeTab = 'inbound';
    this.resetInboundRuleForm();
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

  private applyInboundRuleTypeDefaults(type: string): void {
    const protocol = this.getProtocolForInboundRule(type, '');

    if (protocol) {
      this.inboundRuleForm.controls.protocol.setValue(protocol, { emitEvent: false });
    }
  }

  private getProtocolForInboundRule(type: string, fallback: string): string | null {
    if (type === 'Custom TCP') {
      return 'tcp';
    }

    if (type === 'Custom UDP') {
      return 'udp';
    }

    if (type === 'Custom ICMP - IPv4') {
      return 'icmp';
    }

    if (type === 'Custom Protocol') {
      return fallback.trim();
    }

    return null;
  }

  private applySourcePreset(preset: SourcePreset): void {
    if (preset === 'custom') {
      return;
    }

    if (preset === 'anywhereIpv4') {
      this.inboundRuleForm.controls.source.setValue('0.0.0.0/0');
      return;
    }

    if (preset === 'anywhereIpv6') {
      this.inboundRuleForm.controls.source.setValue('::/0');
      return;
    }

    this.fillCurrentPublicIp();
  }

  private fillCurrentPublicIp(): void {
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
        this.inboundRuleForm.controls.source.setValue(cidr);
      })
      .catch(() => {
        this.inboundRuleForm.controls.sourcePreset.setValue('custom', { emitEvent: false });
        this.inboundRuleForm.controls.source.setValue('');
        this.toast.error(this.t.toast.sourceIpErrorSummary, this.t.toast.sourceIpErrorDetail, 5000);
      });
  }
}
