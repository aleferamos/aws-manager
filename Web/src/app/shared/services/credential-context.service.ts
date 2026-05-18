import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { DEFAULT_AWS_REGION } from '../config/aws-regions.config';
import { AuthCredential, AuthMeResponse } from './auth.service';

export interface SelectedCredential {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CredentialContextService {
  private readonly storageKey = 'aws-manager:selected-credential-id';
  private readonly regionStorageKey = 'aws-manager:selected-region';
  private credentialsSubject = new BehaviorSubject<SelectedCredential[]>([]);
  private selectedCredentialSubject = new BehaviorSubject<SelectedCredential | null>(null);
  private selectedRegionSubject = new BehaviorSubject<string>(
    localStorage.getItem(this.regionStorageKey) || DEFAULT_AWS_REGION,
  );

  readonly credentials$ = this.credentialsSubject.asObservable();
  readonly selectedCredential$ = this.selectedCredentialSubject.asObservable();
  readonly selectedRegion$ = this.selectedRegionSubject.asObservable();

  get selectedCredential(): SelectedCredential | null {
    return this.selectedCredentialSubject.value;
  }

  get selectedRegion(): string {
    return this.selectedRegionSubject.value;
  }

  get credentials(): SelectedCredential[] {
    return this.credentialsSubject.value;
  }

  hydrateFromSession(session: AuthMeResponse): void {
    const credentials = this.extractCredentials(session);
    this.hydrateCredentials(credentials);
  }

  hydrateFromCredentials(credentials: AuthCredential[]): void {
    const normalizedCredentials = credentials
      .map((credential) => this.normalizeCredential(credential))
      .filter((credential): credential is SelectedCredential => !!credential);

    this.hydrateCredentials(normalizedCredentials);
  }

  private hydrateCredentials(credentials: SelectedCredential[]): void {
    this.credentialsSubject.next(credentials);

    const storedId = localStorage.getItem(this.storageKey);
    const selectedCredential =
      credentials.find((credential) => credential.id === storedId) ?? credentials[0] ?? null;

    this.selectedCredentialSubject.next(selectedCredential);

    if (selectedCredential) {
      localStorage.setItem(this.storageKey, selectedCredential.id);
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  selectCredential(credentialId: string | number | boolean | null): void {
    const normalizedId = credentialId === null || credentialId === undefined ? '' : String(credentialId);
    const selectedCredential =
      this.credentialsSubject.value.find((credential) => credential.id === normalizedId) ?? null;

    this.selectedCredentialSubject.next(selectedCredential);

    if (selectedCredential) {
      localStorage.setItem(this.storageKey, selectedCredential.id);
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  selectRegion(region: string | number | boolean | null): void {
    const normalizedRegion =
      region === null || region === undefined || region === '' ? DEFAULT_AWS_REGION : String(region);

    this.selectedRegionSubject.next(normalizedRegion);
    localStorage.setItem(this.regionStorageKey, normalizedRegion);
  }

  private extractCredentials(session: AuthMeResponse): SelectedCredential[] {
    const rawCredentials =
      session.access?.credentials ??
      session.access?.availableCredentials ??
      session.credentials ??
      session.availableCredentials ??
      [];

    return rawCredentials
      .map((credential) => this.normalizeCredential(credential))
      .filter((credential): credential is SelectedCredential => !!credential);
  }

  private normalizeCredential(credential: AuthCredential): SelectedCredential | null {
    const id = credential?.id ?? credential?.credentialId;

    if (!id) {
      return null;
    }

    return {
      id: String(id),
      name:
        credential.name?.trim() ||
        credential.credentialName?.trim() ||
        credential.label?.trim() ||
        `Credential ${id}`,
    };
  }
}
