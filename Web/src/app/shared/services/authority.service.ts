import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface CreateAuthorityDto {
  code: string;
  name: string;
  scope: 'SYSTEM' | 'CREDENTIAL';
  description?: string;
}

export interface UpdateAuthorityDto {
  name: string;
  scope: string;
  description?: string;
}

export interface ListAuthoritiesQueryDto {
  search?: string;
  scope?: 'SYSTEM' | 'CREDENTIAL' | string;
  page?: number;
  pageSize?: number;
}

export interface ListAuthorityItem {
  id: string;
  code: string;
  name: string;
  scope: string;
  createdAt: string;
}

export interface ListAuthoritiesResponse {
  items: ListAuthorityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ViewAuthorityResponse {
  id: string;
  code?: string;
  name: string;
  description?: string | null;
  scope: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthorityService {
  private httpClient = inject(HttpClient);

  private urlAuthority = `${environment.apiUrl}/authority`;

  create(createAuthorityDto: CreateAuthorityDto) {
    return this.httpClient.post(`${this.urlAuthority}/create`, createAuthorityDto, {
      withCredentials: true,
    });
  }

  list(query: ListAuthoritiesQueryDto) {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 10));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.scope?.trim()) {
      params = params.set('scope', query.scope.trim());
    }

    return this.httpClient.get<ListAuthoritiesResponse>(`${this.urlAuthority}/list`, {
      params,
      withCredentials: true,
    });
  }

  view(id: string) {
    return this.httpClient.get<ViewAuthorityResponse>(`${this.urlAuthority}/view/${id}`, {
      withCredentials: true,
    });
  }

  update(id: string, updateAuthorityDto: UpdateAuthorityDto) {
    return this.httpClient.put(`${this.urlAuthority}/update/${id}`, updateAuthorityDto, {
      withCredentials: true,
    });
  }

  delete(id: string) {
    return this.httpClient.delete<{ success: boolean }>(`${this.urlAuthority}/delete/${id}`, {
      withCredentials: true,
    });
  }
}
