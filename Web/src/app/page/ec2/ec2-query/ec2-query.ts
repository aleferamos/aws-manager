import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize } from 'rxjs';

import { AppCard } from '../../../shared/components/card/card';
import { Button } from '../../../shared/components/button/button';
import { Dialog } from '../../../shared/components/dialog/dialog';
import {
  Table,
  TableCellEvent,
  TableColumn,
  TableRow,
} from '../../../shared/components/table/table';
import { AppLanguage } from '../../../shared/config/languages.config';
import {
  CredentialContextService,
  SelectedCredential,
} from '../../../shared/services/credential-context.service';
import {
  Ec2InstanceItem,
  Ec2Service,
  ViewEc2InstanceResponse,
} from '../../../shared/services/ec2.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ToastService } from '../../../shared/services/toast.service';
import { formatPlatformDateTime } from '../../../shared/utils/date-format.util';
import { SecurityGroupDetailDialog } from '../../security-groups/security-group-detail-dialog/security-group-detail-dialog';

import { ec2QueryTranslations } from './ec2-query.translations';

@Component({
  selector: 'app-ec2-query',
  standalone: true,
  imports: [AppCard, Button, Dialog, SecurityGroupDetailDialog, Table],
  templateUrl: './ec2-query.html',
  styleUrl: './ec2-query.scss',
})
export class Ec2Query implements OnInit {
  private destroyRef = inject(DestroyRef);
  private credentialContext = inject(CredentialContextService);
  private ec2Service = inject(Ec2Service);
  private languageService = inject(LanguageService);
  private toast = inject(ToastService);

  readonly translations = ec2QueryTranslations;

  selectedCredential: SelectedCredential | null = null;
  selectedRegion = this.credentialContext.selectedRegion;
  instances: Ec2InstanceItem[] = [];
  selectedInstance: ViewEc2InstanceResponse | null = null;
  selectedSecurityGroupId = '';
  ec2Loading = false;
  detailDialogOpen = false;
  securityGroupDetailDialogOpen = false;
  detailLoading = false;

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
          this.loadInstances(credential, region);

          if (this.detailDialogOpen && this.selectedInstance?.instanceId) {
            this.loadInstanceDetail(this.selectedInstance.instanceId, credential, region);
          }
        } else {
          this.instances = [];
          this.resetDetailDialog();
        }
      });
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  get totalInstances(): number {
    return this.instances.length;
  }

  get runningInstances(): number {
    return this.instances.filter((instance) => instance.instanceState === 'running').length;
  }

  get columns(): TableColumn[] {
    return [
      {
        field: 'name',
        header: this.t.table.name,
        width: '180px',
      },
      {
        field: 'instanceId',
        header: this.t.table.instanceId,
        type: 'link',
        width: '170px',
      },
      {
        field: 'instanceStateLabel',
        header: this.t.table.state,
        type: 'badge',
        badgeSeverityField: 'instanceStateSeverity',
        width: '120px',
      },
      {
        field: 'instanceType',
        header: this.t.table.type,
        width: '120px',
      },
      {
        field: 'statusCheck',
        header: this.t.table.statusCheck,
        width: '170px',
      },
      {
        field: 'availabilityZone',
        header: this.t.table.availabilityZone,
        width: '110px',
      },
      {
        field: 'publicIpv4',
        header: this.t.table.publicIpv4,
        width: '140px',
      },
      {
        field: 'elasticIp',
        header: this.t.table.elasticIp,
        width: '140px',
      },
      {
        field: 'platform',
        header: this.t.table.platform,
        width: '140px',
      },
    ];
  }

  get tableRows(): TableRow[] {
    return this.instances.map((instance) => ({
      ...instance,
      instanceStateLabel: instance.instanceState || '-',
      instanceStateSeverity: this.getStateSeverity(instance.instanceState),
    }));
  }

  get detailTitle(): string {
    if (this.selectedInstance?.instanceId && this.selectedInstance.name) {
      return `${this.selectedInstance.instanceId} - ${this.selectedInstance.name}`;
    }

    return this.selectedInstance?.instanceId || this.t.detail.titleFallback;
  }

  get detailFields(): Array<{ label: string; value: string | number }> {
    const instance = this.selectedInstance;

    return [
      { label: this.t.detail.name, value: instance?.name || '-' },
      { label: this.t.detail.instanceId, value: instance?.instanceId || '-' },
      { label: this.t.detail.imageId, value: instance?.imageId || '-' },
      { label: this.t.detail.imageName, value: instance?.imageName || '-' },
      { label: this.t.detail.state, value: instance?.instanceState || '-' },
      { label: this.t.detail.instanceType, value: instance?.instanceType || '-' },
      { label: this.t.detail.publicIpv4, value: instance?.publicIpv4Address || '-' },
      { label: this.t.detail.privateIpv4, value: this.formatList(instance?.privateIpv4Addresses) },
      { label: this.t.detail.ipv6, value: this.formatList(instance?.ipv6Addresses) },
      { label: this.t.detail.publicDns, value: instance?.publicDns || '-' },
      { label: this.t.detail.privateDns, value: instance?.privateDnsName || '-' },
      { label: this.t.detail.vpcId, value: instance?.vpcId || '-' },
      { label: this.t.detail.subnetId, value: instance?.subnetId || '-' },
      { label: this.t.detail.instanceArn, value: instance?.instanceArn || '-' },
      { label: this.t.detail.launchTime, value: this.formatDateTime(instance?.launchTime) },
      { label: this.t.detail.ownerId, value: instance?.ownerId || '-' },
      { label: this.t.detail.keyName, value: instance?.keyName || '-' },
      { label: this.t.detail.iamRole, value: instance?.iamRole || '-' },
      { label: this.t.detail.imdsv2, value: instance?.imdsv2 || '-' },
      { label: this.t.detail.managed, value: instance?.managed ? this.t.detail.yes : this.t.detail.no },
      { label: this.t.detail.credential, value: this.selectedCredential?.name || '-' },
      { label: this.t.detail.region, value: this.selectedRegion },
    ];
  }

  get connectFields(): Array<{ label: string; value: string | number }> {
    const instance = this.selectedInstance;

    return [
      { label: this.t.connect.instanceId, value: this.formatInstanceLabel() },
      { label: this.t.connect.vpcId, value: instance?.vpcId || '-' },
      { label: this.t.connect.securityGroups, value: this.securityGroupSummary },
      { label: this.t.connect.iamRole, value: instance?.iamRole || '-' },
      { label: this.t.connect.keyPair, value: instance?.keyName || '-' },
      { label: this.t.connect.publicDns, value: instance?.publicDns || instance?.publicIpv4Address || '-' },
      { label: this.t.connect.username, value: instance?.sshUsername || '-' },
    ];
  }

  get securityGroupSummary(): string {
    const securityGroups = this.selectedInstance?.securityGroups ?? [];

    return securityGroups.length
      ? securityGroups.map((securityGroup) => securityGroup.groupId).join(', ')
      : '-';
  }

  get sshPortStatus(): string {
    if (this.selectedInstance?.sshPortOpen === true) {
      return this.t.connect.sshPortOpen;
    }

    if (this.selectedInstance?.sshPortOpen === false) {
      return this.t.connect.sshPortClosed;
    }

    return this.t.connect.sshPortUnknown;
  }

  get showSshWarning(): boolean {
    return this.selectedInstance?.sshPortOpen === false;
  }

  get elasticIpColumns(): TableColumn[] {
    return [
      { field: 'publicIp', header: this.t.elasticIps.publicIp, width: '160px' },
      { field: 'name', header: this.t.elasticIps.name, width: '180px' },
      { field: 'allocationId', header: this.t.elasticIps.allocationId, width: '220px' },
      { field: 'associationId', header: this.t.elasticIps.associationId, width: '220px' },
    ];
  }

  get securityGroupColumns(): TableColumn[] {
    return [
      { field: 'groupId', header: this.t.securityGroups.groupId, type: 'link', width: '220px' },
      { field: 'groupName', header: this.t.securityGroups.groupName },
    ];
  }

  get elasticIpRows(): TableRow[] {
    return (this.selectedInstance?.elasticIpAddresses ?? []).map((elasticIp) => ({
      publicIp: elasticIp.publicIp || '-',
      name: elasticIp.name || '-',
      allocationId: elasticIp.allocationId || '-',
      associationId: elasticIp.associationId || '-',
    }));
  }

  get securityGroupRows(): TableRow[] {
    return (this.selectedInstance?.securityGroups ?? []).map((securityGroup) => ({
      groupId: securityGroup.groupId || '-',
      groupName: securityGroup.groupName || '-',
    }));
  }

  reload(): void {
    if (this.selectedCredential) {
      this.loadInstances(this.selectedCredential, this.selectedRegion);
    }
  }

  handleCellSelected(event: TableCellEvent): void {
    if (event.column.field !== 'instanceId') {
      return;
    }

    const instanceId = String(event.row['instanceId'] ?? '');

    if (instanceId) {
      this.openInstanceDetail(instanceId);
    }
  }

  handleSecurityGroupCellSelected(event: TableCellEvent): void {
    if (event.column.field !== 'groupId') {
      return;
    }

    const groupId = String(event.row['groupId'] ?? '');

    if (groupId) {
      this.selectedSecurityGroupId = groupId;
      this.securityGroupDetailDialogOpen = true;
    }
  }

  closeSecurityGroupDetailDialog(): void {
    this.securityGroupDetailDialogOpen = false;
    this.selectedSecurityGroupId = '';
  }

  handleSecurityGroupChanged(): void {
    if (this.selectedInstance?.instanceId && this.selectedCredential) {
      this.loadInstanceDetail(this.selectedInstance.instanceId, this.selectedCredential, this.selectedRegion);
    }
  }

  closeDetailDialog(): void {
    if (this.detailLoading) {
      return;
    }

    this.resetDetailDialog();
  }

  private loadInstances(credential: SelectedCredential, region: string): void {
    this.ec2Loading = true;

    this.ec2Service
      .list({
        credentialId: credential.id,
        region,
      })
      .pipe(
        finalize(() => {
          this.ec2Loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.instances = response.items ?? [];
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.listErrorDetail;

          this.instances = [];
          this.toast.error(this.t.toast.listErrorSummary, message, 5000);
        },
      });
  }

  private openInstanceDetail(instanceId: string): void {
    if (!this.selectedCredential) {
      return;
    }

    this.detailDialogOpen = true;
    this.selectedInstance = {
      credentialId: this.selectedCredential.id,
      region: this.selectedRegion,
      name: '',
      instanceId,
      imageId: null,
      imageName: null,
      publicIpv4Address: null,
      privateIpv4Addresses: [],
      ipv6Addresses: [],
      publicDns: null,
      privateDnsName: null,
      instanceState: '',
      instanceType: '',
      vpcId: null,
      subnetId: null,
      instanceArn: null,
      launchTime: null,
      ownerId: null,
      keyName: null,
      iamRole: null,
      iamInstanceProfileArn: null,
      sshUsername: null,
      sshCommand: null,
      sshKeyPermissionCommand: null,
      sshPortOpen: null,
      imdsv2: null,
      managed: false,
      elasticIpAddresses: [],
      securityGroups: [],
    };
    this.loadInstanceDetail(instanceId, this.selectedCredential, this.selectedRegion);
  }

  private loadInstanceDetail(instanceId: string, credential: SelectedCredential, region: string): void {
    this.detailLoading = true;

    this.ec2Service
      .view(instanceId, {
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
          this.selectedInstance = response;
        },
        error: (error) => {
          const message =
            error?.error?.message?.message ??
            error?.error?.message ??
            this.t.toast.viewErrorDetail;

          this.toast.error(this.t.toast.viewErrorSummary, message, 5000);
          this.resetDetailDialog();
        },
      });
  }

  private resetDetailDialog(): void {
    this.detailDialogOpen = false;
    this.selectedInstance = null;
    this.closeSecurityGroupDetailDialog();
  }

  private getStateSeverity(state: string) {
    if (state === 'running') {
      return 'success';
    }

    if (state === 'stopped' || state === 'terminated') {
      return 'secondary';
    }

    if (state === 'pending') {
      return 'info';
    }

    return 'warning';
  }

  private formatList(values: string[] | undefined): string {
    return values?.length ? values.join(', ') : '-';
  }

  private formatInstanceLabel(): string {
    const instanceId = this.selectedInstance?.instanceId;
    const name = this.selectedInstance?.name;

    if (instanceId && name) {
      return `${instanceId} (${name})`;
    }

    return instanceId || '-';
  }

  private formatDateTime(value: string | null | undefined): string {
    return formatPlatformDateTime(value);
  }
}
