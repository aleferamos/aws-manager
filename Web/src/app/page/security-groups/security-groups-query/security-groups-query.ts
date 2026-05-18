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
  deleteInboundRuleLoading = false;
  deleteInboundRuleDialogOpen = false;
  activeDetailTab: SecurityGroupDetailTab = 'inbound';
  securityGroupsLoading = false;
  private inboundRulePendingDelete: SecurityGroupRuleItem | null = null;

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
        this.applySourcePreset(preset);
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

    if (this.inboundRuleForm.invalid) {
      this.inboundRuleForm.markAllAsTouched();
      return;
    }

    const { type, protocol, fromPort, toPort, source, description } =
      this.inboundRuleForm.getRawValue();
    const payload = {
      credentialId: this.selectedCredential.id,
      region: this.selectedRegion,
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
    if (event.action.key !== 'delete') {
      return;
    }

    const ruleId = String(event.row['securityGroupRuleId'] ?? '');

    if (!ruleId) {
      return;
    }

    this.inboundRulePendingDelete =
      this.inboundDetailRules.find((rule) => rule.securityGroupRuleId === ruleId) ?? null;
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
    this.resetInboundRuleForm();
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
