import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export type BillingGranularity = 'DAILY' | 'MONTHLY';
export type BillingGroupBy = 'SERVICE';

export interface BillingCostQuery {
  credentialId: string;
  region: string;
  startDate: string;
  endDate: string;
  granularity: BillingGranularity;
  groupBy: BillingGroupBy;
}

export interface BillingCostGroup {
  key: string;
  amount: number;
  unit: string;
}

export interface BillingCostTimeResult {
  start: string;
  end: string;
  estimated: boolean;
  totalAmount: number;
  totalUnit: string;
  groups: BillingCostGroup[];
}

export interface BillingCostResponse {
  credentialId: string;
  credentialName: string;
  region: string;
  currency: string;
  totalAmount: number;
  resultsByTime: BillingCostTimeResult[];
}

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private httpClient = inject(HttpClient);

  private urlBilling = `${environment.apiUrl}/billing`;

  getCostAndUsage(query: BillingCostQuery) {
    const params = new HttpParams()
      .set('credentialId', query.credentialId)
      .set('region', query.region)
      .set('startDate', query.startDate)
      .set('endDate', query.endDate)
      .set('granularity', query.granularity)
      .set('groupBy', query.groupBy);

    return this.httpClient.get<BillingCostResponse>(`${this.urlBilling}/cost-and-usage`, {
      params,
      withCredentials: true,
    });
  }
}
