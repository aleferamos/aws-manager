import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface CreateCredentialDto {
  name: string;
  description?: string;
  accessKeyId: string;
  secretKeyId: string;
}

export interface UpdateCredentialDto {
  name: string;
  active?: boolean;
  status?: 'active' | 'inactive';
}

export type ListCredentialsStatusFilter = 'all' | 'active' | 'inactive';

export interface ListCredentialsQueryDto {
  search?: string;
  status?: ListCredentialsStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface ListCredentialItem {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ListCredentialsResponse {
  items: ListCredentialItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ViewCredentialResponse {
  id: string;
  name: string;
  active?: boolean;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CredentialService {
  private httpClient = inject(HttpClient);

  private urlCredential = `${environment.apiUrl}/credential`;

  create(createCredentialDto: CreateCredentialDto) {
    return this.httpClient.post(`${this.urlCredential}/create`, createCredentialDto, {
      withCredentials: true,
    });
  }

  list(query: ListCredentialsQueryDto) {
    let params = new HttpParams()
      .set('status', query.status ?? 'all')
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 10));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.httpClient.get<ListCredentialsResponse>(`${this.urlCredential}/list`, {
      params,
      withCredentials: true,
    });
  }

  view(id: string) {
    return this.httpClient.get<ViewCredentialResponse>(`${this.urlCredential}/view/${id}`, {
      withCredentials: true,
    });
  }

  update(id: string, updateCredentialDto: UpdateCredentialDto) {
    return this.httpClient.put(`${this.urlCredential}/update/${id}`, updateCredentialDto, {
      withCredentials: true,
    });
  }

  delete(id: string) {
    return this.httpClient.delete<{ success: boolean }>(`${this.urlCredential}/delete/${id}`, {
      withCredentials: true,
    });
  }
}
