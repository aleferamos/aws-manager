import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface AppConfigurationResponse {
  id: number;
  siteUrl: string;
  jsonConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAppConfigurationDto {
  jsonConfig: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private httpClient = inject(HttpClient);
  private urlConfiguration = `${environment.apiUrl}/configuration`;

  get() {
    return this.httpClient.get<AppConfigurationResponse>(
      this.urlConfiguration,
      {
        withCredentials: true,
      },
    );
  }

  update(dto: UpdateAppConfigurationDto) {
    return this.httpClient.put<AppConfigurationResponse>(
      this.urlConfiguration,
      dto,
      {
        withCredentials: true,
      },
    );
  }
}
