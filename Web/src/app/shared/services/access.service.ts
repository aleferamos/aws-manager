import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface AccessAuthority {
  id: string;
  code?: string;
  name: string;
  scope?: string;
}

export interface AccessCredential {
  id?: string;
  credentialId: string;
  userCredentialId: string;
  name: string;
  region?: string;
  active: boolean;
  authorities: AccessAuthority[];
}

export interface AccessUser {
  id?: string;
  userId: string;
  userCredentialId: string;
  name: string;
  email?: string;
  active: boolean;
  authorities: AccessAuthority[];
}

export interface AccessAuthorityCredentialUsage {
  userCredentialId: string;
  userId?: string;
  userName?: string;
  credentialId?: string;
  credentialName?: string;
  active?: boolean;
}

export interface AccessUserResponse {
  systemAuthorities: AccessAuthority[];
  credentials: AccessCredential[];
}

export interface AccessCredentialResponse {
  users: AccessUser[];
}

export interface AccessAuthorityResponse {
  scope: 'SYSTEM' | 'CREDENTIAL' | string;
  users: AccessUser[];
  userCredentials: AccessAuthorityCredentialUsage[];
}

@Injectable({
  providedIn: 'root',
})
export class AccessService {
  private httpClient = inject(HttpClient);

  private urlAccess = `${environment.apiUrl}/access`;

  getUserAccess(userId: string) {
    return this.httpClient.get<AccessUserResponse>(`${this.urlAccess}/user/${userId}`, {
      withCredentials: true,
    });
  }

  getCredentialAccess(credentialId: string) {
    return this.httpClient.get<AccessCredentialResponse>(
      `${this.urlAccess}/credential/${credentialId}`,
      { withCredentials: true },
    );
  }

  getAuthorityAccess(authorityId: string) {
    return this.httpClient.get<AccessAuthorityResponse>(
      `${this.urlAccess}/authority/${authorityId}`,
      { withCredentials: true },
    );
  }

  addUserAuthority(userId: string, authorityId: string) {
    return this.httpClient.post(
      `${this.urlAccess}/user-authority`,
      { userId, authorityId },
      { withCredentials: true },
    );
  }

  removeUserAuthority(userId: string, authorityId: string) {
    return this.httpClient.delete(`${this.urlAccess}/user/${userId}/authority/${authorityId}`, {
      withCredentials: true,
    });
  }

  addUserCredential(userId: string, credentialId: string) {
    return this.httpClient.post<{ userCredentialId: string }>(
      `${this.urlAccess}/user-credential`,
      { userId, credentialId, active: true },
      { withCredentials: true },
    );
  }

  updateUserCredential(userCredentialId: string, active: boolean) {
    return this.httpClient.put(
      `${this.urlAccess}/user-credential/${userCredentialId}`,
      { active },
      { withCredentials: true },
    );
  }

  removeUserCredential(userCredentialId: string) {
    return this.httpClient.delete(`${this.urlAccess}/user-credential/${userCredentialId}`, {
      withCredentials: true,
    });
  }

  addUserCredentialAuthority(userCredentialId: string, authorityId: string) {
    return this.httpClient.post(
      `${this.urlAccess}/user-credential-authority`,
      { userCredentialId, authorityId },
      { withCredentials: true },
    );
  }

  removeUserCredentialAuthority(userCredentialId: string, authorityId: string) {
    return this.httpClient.delete(
      `${this.urlAccess}/user-credential/${userCredentialId}/authority/${authorityId}`,
      { withCredentials: true },
    );
  }
}
