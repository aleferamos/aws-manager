import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export type AppResourceType = 'MENU' | 'PAGE' | 'ACTION';

export interface AppResourceAuthority {
  id: string;
  code: string;
  name: string;
  scope: string;
}

export interface AppResource {
  id: string;
  code: string;
  label: string;
  type: AppResourceType;
  path: string | null;
  icon: string | null;
  order: number;
  active: boolean;
  parentId: string | null;
  requiredAuthorityId: string | null;
  requiredAuthority?: AppResourceAuthority | null;
  children?: AppResource[];
}

export interface AppResourcePayload {
  code: string;
  label: string;
  type: AppResourceType;
  path?: string | null;
  icon?: string | null;
  order: number;
  active: boolean;
  parentId?: string | null;
  requiredAuthorityId?: string | null;
}

export interface ListAppResourcesQueryDto {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAppResourcesResponse {
  items: AppResource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppResourceService {
  private httpClient = inject(HttpClient);

  private urlAppResource = `${environment.apiUrl}/app-resource`;
  private menu: AppResource[] | null = null;
  private menuRequest$?: Observable<AppResource[]>;

  create(payload: AppResourcePayload) {
    return this.httpClient.post(`${this.urlAppResource}/create`, payload, {
      withCredentials: true,
    });
  }

  list(query: ListAppResourcesQueryDto = {}) {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 100));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.httpClient.get<ListAppResourcesResponse | AppResource[]>(
      `${this.urlAppResource}/list`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  view(id: string) {
    return this.httpClient.get<AppResource>(`${this.urlAppResource}/view/${id}`, {
      withCredentials: true,
    });
  }

  update(id: string, payload: AppResourcePayload) {
    return this.httpClient.put(`${this.urlAppResource}/update/${id}`, payload, {
      withCredentials: true,
    });
  }

  loadMenu(force = false): Observable<AppResource[]> {
    if (this.menu && !force) {
      return of(this.menu);
    }

    if (this.menuRequest$ && !force) {
      return this.menuRequest$;
    }

    this.menuRequest$ = this.httpClient
      .get<AppResource[]>(`${this.urlAppResource}/menu`, {
        withCredentials: true,
      })
      .pipe(
        tap((menu) => {
          this.menu = menu;
        }),
        shareReplay(1),
        finalize(() => {
          this.menuRequest$ = undefined;
        }),
      );

    return this.menuRequest$;
  }

  clearMenu(): void {
    this.menu = null;
    this.menuRequest$ = undefined;
  }

  getCachedMenu(): AppResource[] | null {
    return this.menu;
  }

  hasPath(path: string): boolean {
    return this.findByPath(path, this.menu ?? []) !== null;
  }

  firstPagePath(menu = this.menu ?? []): string | null {
    for (const item of menu) {
      if (item.type === 'PAGE' && item.path) {
        return item.path;
      }

      const childPath = this.firstPagePath(item.children ?? []);

      if (childPath) {
        return childPath;
      }
    }

    return null;
  }

  private findByPath(path: string, items: AppResource[]): AppResource | null {
    const normalizedPath = this.normalizePath(path);

    for (const item of items) {
      if (item.path && this.normalizePath(item.path) === normalizedPath) {
        return item;
      }

      const child = this.findByPath(normalizedPath, item.children ?? []);

      if (child) {
        return child;
      }
    }

    return null;
  }

  private normalizePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
