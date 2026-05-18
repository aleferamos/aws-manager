import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of, startWith } from 'rxjs';

import { ACCESS_RULES, AccessRule } from '../../shared/config/access.config';
import { CURRENT_APP_VERSION } from '../../shared/config/app-version.config';
import { AppLanguage } from '../../shared/config/languages.config';
import { Button } from '../../shared/components/button/button';
import { Dialog } from '../../shared/components/dialog/dialog';
import { AccessControlService } from '../../shared/services/access-control.service';
import { LanguageService } from '../../shared/services/language.service';
import { VersionCheckService } from '../../shared/services/version-check.service';
import { layoutTranslations } from '../layout.translations';

interface SidebarItem {
  key: string;
  icon: string;
  route?: string;
  access?: AccessRule;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, Button, Dialog, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  private languageService = inject(LanguageService);
  private accessControl = inject(AccessControlService);
  private versionCheckService = inject(VersionCheckService);
  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  @Input() collapsed = false;
  @Input() mobileOpen = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() closeMobile = new EventEmitter<void>();

  readonly translations = layoutTranslations;
  readonly currentVersion = CURRENT_APP_VERSION;
  readonly updateCommand =
    'docker pull alefepdias/aws-manager:latest\n\n' +
    'docker rm -f aws-manager\n\n' +
    'docker run -d \\\n' +
    '  --name aws-manager \\\n' +
    '  -p 4501:80 \\\n' +
    '  -v aws_manager_data:/var/lib/postgresql/data \\\n' +
    '  --env-file .env \\\n' +
    '  alefepdias/aws-manager:latest';

  availableVersion = CURRENT_APP_VERSION;
  updateAvailable = false;
  updateDialogOpen = false;

  readonly menuItems: SidebarItem[] = [
    {
      key: 'dashboard',
      icon: 'dashboard',
      route: '/home',
    },
    {
      key: 'ec2',
      icon: 'dns',
      children: [
        {
          key: 'ec2Instances',
          icon: 'dns',
          route: '/ec2',
        },
        {
          key: 'securityGroups',
          icon: 'security',
          route: '/security-groups',
        },
      ],
    },
    {
      key: 's3',
      icon: 'deployed_code',
      route: '/s3',
    },
    {
      key: 'adminArea',
      icon: 'admin_panel_settings',
      access: ACCESS_RULES.adminArea,
      children: [
        {
          key: 'users',
          icon: 'group',
          route: '/admin-area/user',
        },
        {
          key: 'credentials',
          icon: 'vpn_key',
          route: '/admin-area/credential',
        },
        {
          key: 'authorities',
          icon: 'admin_panel_settings',
          route: '/admin-area/authority',
        },
      ],
    },
  ];

  readonly visibleMenuItems$ = this.accessControl.filterItemsByAccess(this.menuItems).pipe(
    startWith(this.accessControl.filterItemsWithoutUser(this.menuItems)),
  );

  private readonly openGroups = new Set(['ec2', 'adminArea']);

  private resizing = false;
  private currentWidth = 272;

  private readonly expandedWidth = 272;
  private readonly collapsedWidth = 76;
  private readonly minWidth = 220;
  private readonly maxWidth = 340;
  private readonly collapseThreshold = 150;

  @HostBinding('style.--sidebar-width')
  get sidebarWidth(): string {
    return this.collapsed ? `${this.collapsedWidth}px` : `${this.currentWidth}px`;
  }

  @HostBinding('class.sidebar-host-collapsed')
  get sidebarHostCollapsed(): boolean {
    return this.collapsed;
  }

  @HostBinding('class.sidebar-host-mobile-open')
  get sidebarHostMobileOpen(): boolean {
    return this.mobileOpen;
  }

  get language(): AppLanguage {
    return this.languageService.currentLanguage;
  }

  get t() {
    return this.translations[this.language];
  }

  getMenuLabel(key: string): string {
    return this.t.menu[key as keyof typeof this.t.menu] ?? key;
  }

  ngOnInit(): void {
    this.loadVersionStatus();
  }

  openUpdateDialog(): void {
    this.updateDialogOpen = true;
    this.closeMobile.emit();
  }

  closeUpdateDialog(): void {
    this.updateDialogOpen = false;
  }

  isGroupOpen(key: string): boolean {
    return this.openGroups.has(key);
  }

  toggleGroup(key: string): void {
    if (this.openGroups.has(key)) {
      this.openGroups.delete(key);
      return;
    }

    this.openGroups.add(key);
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizing = true;
    document.body.classList.add('sidebar-resizing');
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizing) {
      return;
    }

    const newWidth = event.clientX;

    if (newWidth <= this.collapseThreshold) {
      this.setCollapsed(true);
      return;
    }

    this.setCollapsed(false);

    this.currentWidth = Math.min(Math.max(newWidth, this.minWidth), this.maxWidth);

    this.renderer.setStyle(
      this.elementRef.nativeElement,
      '--sidebar-width',
      `${this.currentWidth}px`,
    );
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.resizing) {
      return;
    }

    this.resizing = false;
    document.body.classList.remove('sidebar-resizing');
  }

  private setCollapsed(collapsed: boolean): void {
    if (this.collapsed === collapsed) {
      return;
    }

    this.collapsed = collapsed;

    if (!collapsed && this.currentWidth < this.minWidth) {
      this.currentWidth = this.expandedWidth;
    }

    this.collapsedChange.emit(collapsed);
  }

  private loadVersionStatus(): void {
    this.versionCheckService
      .getLatestVersion()
      .pipe(catchError(() => of(null)))
      .subscribe((latestVersion) => {
        if (!latestVersion) {
          return;
        }

        this.availableVersion = latestVersion;
        this.updateAvailable = latestVersion !== this.currentVersion;
      });
  }
}
