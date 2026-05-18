import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthenticatedUser {
  id: string;
  login?: string;
  personId: string;
  personName: string;
  name?: string;
  person?: {
    name?: string;
  };
  type: string;
  active: boolean;
  isRoot?: boolean;
}

export interface AuthCredential {
  id: string;
  credentialId?: string;
  name?: string;
  credentialName?: string;
  label?: string;
  region?: string;
  active?: boolean;
  authorityCodes?: string[];
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: AuthenticatedUser;
  access?: {
    credentials?: AuthCredential[];
    availableCredentials?: AuthCredential[];
    credentialIds?: string[];
  };
  credentials?: AuthCredential[];
  availableCredentials?: AuthCredential[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  httpClient = inject(HttpClient);

  urlAuth = `${environment.apiUrl}/auth`;
  private currentSession: AuthMeResponse | null = null;
  private currentSessionRequest$?: Observable<AuthMeResponse>;

  login(login: string, password: string) {
    return this.httpClient.post(
      `${this.urlAuth}/login`,
      {
        login,
        password,
      },
      {
        withCredentials: true,
      },
    ).pipe(
      tap(() => {
        this.clearSession();
      }),
    );
  }

  me(force = false) {
    if (this.currentSession && !force) {
      return of(this.currentSession);
    }

    if (this.currentSessionRequest$ && !force) {
      return this.currentSessionRequest$;
    }

    this.currentSessionRequest$ = this.httpClient
      .get<AuthMeResponse>(`${this.urlAuth}/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((session) => {
          this.currentSession = session;
        }),
        shareReplay(1),
        finalize(() => {
          this.currentSessionRequest$ = undefined;
        }),
      );

    return this.currentSessionRequest$;
  }

  logout() {
    return this.httpClient.post(
      `${this.urlAuth}/logout`,
      {},
      {
        withCredentials: true,
      },
    ).pipe(
      tap(() => {
        this.clearSession();
      }),
    );
  }

  clearSession(): void {
    this.currentSession = null;
    this.currentSessionRequest$ = undefined;
  }
}
