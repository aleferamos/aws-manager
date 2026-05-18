import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Badge, BadgeSeverity } from '../badge/badge';
import { Button, ButtonSeverity } from '../button/button';

export type TableColumnAlign = 'left' | 'center' | 'right';
export type TableColumnLink = string | unknown[];
export type TableColumnType = 'text' | 'badge' | 'link';

export interface TableRow {
  [key: string]: unknown;
}

export interface TableColumn {
  field: string;
  header: string;
  type?: TableColumnType;
  align?: TableColumnAlign;
  width?: string;
  badgeSeverity?: BadgeSeverity;
  badgeSeverityField?: string;
  format?: (value: unknown, row: TableRow) => string;
  link?: (value: unknown, row: TableRow) => TableColumnLink;
}

export interface TableAction {
  key: string;
  label: string;
  icon: string;
  severity?: ButtonSeverity;
  disabled?: (row: TableRow) => boolean;
}

export interface TableActionEvent {
  action: TableAction;
  row: TableRow;
}

export interface TableCellEvent {
  column: TableColumn;
  row: TableRow;
}

export interface TablePageEvent {
  page: number;
  pageSize: number;
}

export type TableActionsMode = 'buttons' | 'menu';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, RouterLink, Badge, Button],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableRow[] = [];
  @Input() actions: TableAction[] = [];
  @Input() actionsMode: TableActionsMode = 'buttons';
  @Input() rowKey = 'id';
  @Input() loading = false;
  @Input() actionsHeader = 'Actions';
  @Input() loadingLabel = 'Loading records...';
  @Input() emptyTitle = 'No records found';
  @Input() emptyDescription = 'Try changing the filters or adding a new record.';
  @Input() paginator = false;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() totalRecords?: number;
  @Input() pageSizeOptions: number[] = [5, 10, 20];
  @Input() pageSizeLabel = 'Rows per page';
  @Input() paginatorInfoTemplate = 'Showing {first}-{last} of {total}';
  @Input() firstPageLabel = 'First page';
  @Input() previousPageLabel = 'Previous page';
  @Input() nextPageLabel = 'Next page';
  @Input() lastPageLabel = 'Last page';

  @Output() actionSelected = new EventEmitter<TableActionEvent>();
  @Output() cellSelected = new EventEmitter<TableCellEvent>();
  @Output() rowSelected = new EventEmitter<TableRow>();
  @Output() pageChange = new EventEmitter<TablePageEvent>();

  openActionMenuKey: unknown = null;
  actionMenuPosition: { top: number; left: number } | null = null;

  get hasActions(): boolean {
    return this.actions.length > 0;
  }

  get isEmpty(): boolean {
    return !this.loading && this.data.length === 0;
  }

  get hasPaginator(): boolean {
    return this.paginator && !this.loading && this.totalItemCount > 0;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalItemCount / this.safePageSize));
  }

  get currentPage(): number {
    return Math.min(Math.max(this.page, 1), this.pageCount);
  }

  get safePageSize(): number {
    return Math.max(1, this.pageSize);
  }

  get firstRecord(): number {
    if (this.totalItemCount === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.safePageSize + 1;
  }

  get lastRecord(): number {
    return Math.min(this.currentPage * this.safePageSize, this.totalItemCount);
  }

  get visibleData(): TableRow[] {
    if (!this.paginator || this.usesServerPagination) {
      return this.data;
    }

    const start = (this.currentPage - 1) * this.safePageSize;
    const end = start + this.safePageSize;

    return this.data.slice(start, end);
  }

  get paginatorInfo(): string {
    return this.paginatorInfoTemplate
      .replace('{first}', String(this.firstRecord))
      .replace('{last}', String(this.lastRecord))
      .replace('{total}', String(this.totalItemCount));
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.pageCount;
  }

  private get totalItemCount(): number {
    return this.totalRecords ?? this.data.length;
  }

  private get usesServerPagination(): boolean {
    return this.totalRecords !== undefined;
  }

  getCellClasses(column: TableColumn): string[] {
    return ['table-cell', `table-cell-${column.align ?? 'left'}`];
  }

  getHeaderClasses(column: TableColumn): string[] {
    return ['table-header-cell', `table-cell-${column.align ?? 'left'}`];
  }

  getCellValue(row: TableRow, column: TableColumn): string {
    const value = row[column.field];

    if (column.format) {
      return column.format(value, row);
    }

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  getBadgeSeverity(row: TableRow, column: TableColumn): BadgeSeverity {
    const severity = column.badgeSeverityField
      ? row[column.badgeSeverityField]
      : column.badgeSeverity;

    if (this.isBadgeSeverity(severity)) {
      return severity;
    }

    return 'secondary';
  }

  getCellLink(row: TableRow, column: TableColumn): TableColumnLink | null {
    if (!column.link) {
      return null;
    }

    return column.link(row[column.field], row);
  }

  isActionDisabled(row: TableRow, action: TableAction): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  isActionMenuOpen(row: TableRow): boolean {
    return this.openActionMenuKey === this.getRowKey(row);
  }

  toggleActionMenu(event: Event, row: TableRow): void {
    event.stopPropagation();

    const key = this.getRowKey(row);

    if (this.openActionMenuKey === key) {
      this.closeActionMenu();
      return;
    }

    this.openActionMenuKey = key;
    this.actionMenuPosition = this.calculateActionMenuPosition(event.currentTarget);
  }

  selectAction(event: Event, row: TableRow, action: TableAction): void {
    event.stopPropagation();

    if (this.isActionDisabled(row, action)) {
      return;
    }

    this.openActionMenuKey = null;
    this.actionSelected.emit({ action, row });
  }

  selectCell(event: Event, row: TableRow, column: TableColumn): void {
    event.stopPropagation();
    this.cellSelected.emit({ column, row });
  }

  selectRow(row: TableRow): void {
    this.rowSelected.emit(row);
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.pageCount);

    if (nextPage === this.currentPage) {
      return;
    }

    this.page = nextPage;
    this.pageChange.emit({ page: this.page, pageSize: this.safePageSize });
  }

  setPageSize(pageSize: number): void {
    if (pageSize === this.safePageSize) {
      return;
    }

    this.pageSize = pageSize;
    this.page = 1;
    this.pageChange.emit({ page: this.page, pageSize: this.safePageSize });
  }

  trackRow(index: number, row: TableRow): unknown {
    return row[this.rowKey] ?? index;
  }

  trackColumn(index: number, column: TableColumn): string {
    return column.field || String(index);
  }

  trackAction(index: number, action: TableAction): string {
    return action.key || String(index);
  }

  @HostListener('document:click')
  closeActionMenu(): void {
    this.openActionMenuKey = null;
    this.actionMenuPosition = null;
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeActionMenuOnViewportChange(): void {
    this.closeActionMenu();
  }

  private getRowKey(row: TableRow): unknown {
    return row[this.rowKey] ?? row;
  }

  private calculateActionMenuPosition(target: EventTarget | null): { top: number; left: number } {
    const trigger = target instanceof HTMLElement ? target : null;

    if (!trigger) {
      return { top: 0, left: 0 };
    }

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 160;
    const panelHeight = Math.min(240, this.actions.length * 34 + 12);
    const gap = 2;
    const verticalOffset = 8;
    const viewportPadding = 8;
    const hasRoomBelow = rect.bottom + gap + panelHeight - verticalOffset <= window.innerHeight;
    const top = hasRoomBelow
      ? Math.max(viewportPadding, rect.bottom + gap - verticalOffset)
      : Math.max(viewportPadding, rect.top - gap - panelHeight + verticalOffset);
    const left = Math.min(
      Math.max(viewportPadding, rect.right - panelWidth),
      window.innerWidth - panelWidth - viewportPadding,
    );

    return { top, left };
  }

  private isBadgeSeverity(value: unknown): value is BadgeSeverity {
    return (
      value === 'brand' ||
      value === 'primary' ||
      value === 'secondary' ||
      value === 'success' ||
      value === 'info' ||
      value === 'warning' ||
      value === 'warn' ||
      value === 'danger' ||
      value === 'contrast'
    );
  }
}
