import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface FosterChild {
  child_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  ethnicity: string | null;
  has_medical_needs: boolean;
  has_behavioral_needs: boolean;
  has_disability: boolean;
  case_id: number;
  case_number: string;
  placement_type: string | null;
  permanency_goal: string | null;
  months_in_care: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class FosterParentService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyChildren(userId: number): Observable<FosterChild[]> {
    return this.http.get<FosterChild[]>(`${this.api}/foster/children/${userId}`);
  }

  getChildDetail(caseId: number): Observable<FosterChild> {
    return this.http.get<FosterChild>(`${this.api}/foster/child/${caseId}`);
  }
}
