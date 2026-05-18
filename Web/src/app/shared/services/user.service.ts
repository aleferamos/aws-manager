import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserType } from '../config/access.config';

export interface UserInfo {
  id: string;
  personId: string;
  personName: string;
  type: UserType;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone: string;
}

export interface DefineUserPasswordDto {
  email: string;
  code: string;
  password: string;
}

export interface ForgotUserPasswordDto {
  email: string;
}

export interface SetAdminPasswordDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateUserViewDto {
  active: boolean;
  person: {
    name: string;
    phone: string;
  };
}

export type ListUsersStatusFilter = 'all' | 'active' | 'inactive' | 'pending';
export type ListUserStatus = Exclude<ListUsersStatusFilter, 'all'>;

export interface ListUsersQueryDto {
  search?: string;
  status?: ListUsersStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface ListUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: ListUserStatus;
  lastAccess: string | null;
}

export interface ListUsersResponse {
  items: ListUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ViewUserResponse {
  id: string;
  active: boolean;
  lastAccessAt: string | null;
  person: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface FirstAdminUserResponse {
  adminHasPassword: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  httpClient = inject(HttpClient);

  urlUser = `${environment.apiUrl}/user`;
  private firstAdminStatus: FirstAdminUserResponse | null = null;
  private firstAdminStatusRequest$?: Observable<FirstAdminUserResponse>;

  isFirstAdminUser(force = false) {
    if (this.firstAdminStatus && !force) {
      return of(this.firstAdminStatus);
    }

    if (this.firstAdminStatusRequest$ && !force) {
      return this.firstAdminStatusRequest$;
    }

    this.firstAdminStatusRequest$ = this.httpClient
      .get<FirstAdminUserResponse>(`${this.urlUser}/is-first-admin-user`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.firstAdminStatus = response;
        }),
        shareReplay(1),
        finalize(() => {
          this.firstAdminStatusRequest$ = undefined;
        }),
      );

    return this.firstAdminStatusRequest$;
  }

  setAdminPassword(setAdminPasswordDto: SetAdminPasswordDto) {
    return this.httpClient.put<any>(
      `${this.urlUser}/set-admin-password`,
      setAdminPasswordDto,
      {
        withCredentials: true
      },
    ).pipe(
      tap(() => {
        this.firstAdminStatus = null;
      }),
    );
  }

  getInfo() {
    return this.httpClient.get<UserInfo>(`${this.urlUser}/get-info`, {
      withCredentials: true,
    });
  }

  create(createUserDto: CreateUserDto) {
    return this.httpClient.post(`${this.urlUser}/create`, createUserDto, {
      withCredentials: true,
    });
  }

  definePassword(defineUserPasswordDto: DefineUserPasswordDto) {
    return this.httpClient.post<{ success: boolean }>(
      `${this.urlUser}/define-password`,
      defineUserPasswordDto,
    );
  }

  forgotPassword(forgotUserPasswordDto: ForgotUserPasswordDto) {
    return this.httpClient.post<{ success: boolean }>(
      `${this.urlUser}/forgot-password`,
      forgotUserPasswordDto,
    );
  }

  list(query: ListUsersQueryDto) {
    let params = new HttpParams()
      .set('status', query.status ?? 'all')
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 10));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.httpClient.get<ListUsersResponse>(`${this.urlUser}/list`, {
      params,
      withCredentials: true,
    });
  }

  view(id: string) {
    return this.httpClient.get<ViewUserResponse>(`${this.urlUser}/view/${id}`, {
      withCredentials: true,
    });
  }

  update(id: string, updateUserViewDto: UpdateUserViewDto) {
    return this.httpClient.put(`${this.urlUser}/update/${id}`, updateUserViewDto, {
      withCredentials: true,
    });
  }
}
