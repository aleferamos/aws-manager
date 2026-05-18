import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { UPDATE_MANIFEST_URL } from '../config/update.config';

interface VersionManifest {
  version?: string;
  latestVersion?: string;
  latest_version?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionCheckService {
  private httpClient = inject(HttpClient);

  getLatestVersion() {
    return this.httpClient
      .get<VersionManifest>(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`)
      .pipe(map((manifest) => this.extractVersion(manifest)));
  }

  private extractVersion(manifest: VersionManifest): string | null {
    const version =
      manifest.version ?? manifest.latestVersion ?? manifest.latest_version;

    return typeof version === 'string' && version.trim()
      ? version.trim()
      : null;
  }
}
