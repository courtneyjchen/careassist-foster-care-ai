import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DashboardStats, FlaggedCaseSummary } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
  }

  getFlaggedCases(): Observable<FlaggedCaseSummary[]> {
    return this.http.get<FlaggedCaseSummary[]>(`${this.api}/dashboard/flagged`);
  }
}
