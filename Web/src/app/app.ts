import { Component, HostListener, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { GlobalLoading } from './shared/components/global-loading/global-loading';
import { Toast } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, RouterOutlet, GlobalLoading, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  contextMenu: { x: number; y: number } | null = null;
  private routerSubscription: Subscription;

  constructor(private router: Router) {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.closeContextMenu();
      }
    });
  }

  openSettings(): void {
    this.closeContextMenu();
    this.router.navigate(['/configuration']);
  }

  closeContextMenu(): void {
    this.contextMenu = null;
  }

  @HostListener('document:contextmenu', ['$event'])
  handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('aws-manager-close-local-context-menus'));
    this.contextMenu = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  @HostListener('document:click')
  @HostListener('document:pointerdown')
  handleDocumentInteraction(): void {
    this.closeContextMenu();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeContextMenu();
  }

  @HostListener('window:aws-manager-close-global-context-menu')
  handleCloseGlobalContextMenu(): void {
    this.closeContextMenu();
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }
}
