import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CaseSummary, CaseDetail, CaseNote, NoteType } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCases(): Observable<CaseSummary[]> {
    return this.http.get<CaseSummary[]>(`${this.api}/cases`);
  }

  getCaseDetail(id: number): Observable<CaseDetail> {
    return this.http.get<CaseDetail>(`${this.api}/cases/${id}`);
  }

  addNote(caseId: number, noteType: NoteType, content: string): Observable<CaseNote> {
    return this.http.post<CaseNote>(`${this.api}/cases/${caseId}/notes`, {
      note_type: noteType,
      content,
    });
  }
}
