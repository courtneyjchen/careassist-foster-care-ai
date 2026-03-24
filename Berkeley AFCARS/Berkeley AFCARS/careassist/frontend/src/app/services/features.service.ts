import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  RiskScoreHistory,
  FamilyMember,
  SiblingLink,
  AppNotification,
  SharedNote,
  TimelineEvent,
} from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class FeaturesService {
  private api = environment.apiUrl + '/features';

  constructor(private http: HttpClient) {}

  // Risk score trend
  getRiskHistory(caseId: number): Observable<RiskScoreHistory[]> {
    return this.http.get<RiskScoreHistory[]>(`${this.api}/cases/${caseId}/risk-history`);
  }

  // Family members
  getFamilyMembers(caseId: number): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.api}/cases/${caseId}/family`);
  }

  addFamilyMember(caseId: number, member: Partial<FamilyMember>): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(`${this.api}/cases/${caseId}/family`, member);
  }

  // Siblings
  getSiblings(caseId: number): Observable<SiblingLink[]> {
    return this.http.get<SiblingLink[]>(`${this.api}/cases/${caseId}/siblings`);
  }

  // Timeline
  getTimeline(caseId: number): Observable<TimelineEvent[]> {
    return this.http.get<TimelineEvent[]>(`${this.api}/cases/${caseId}/timeline`);
  }

  // Notifications
  getNotifications(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.api}/notifications/${userId}`);
  }

  getUnreadCount(userId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/notifications/${userId}/unread-count`);
  }

  markNotificationRead(notifId: number): Observable<any> {
    return this.http.post(`${this.api}/notifications/${notifId}/read`, {});
  }

  markAllRead(userId: number): Observable<any> {
    return this.http.post(`${this.api}/notifications/${userId}/read-all`, {});
  }

  // Shared notes
  getSharedNotes(caseId: number): Observable<SharedNote[]> {
    return this.http.get<SharedNote[]>(`${this.api}/cases/${caseId}/shared-notes`);
  }

  addSharedNote(caseId: number, content: string, authorId: number): Observable<SharedNote> {
    return this.http.post<SharedNote>(`${this.api}/cases/${caseId}/shared-notes`, {
      content,
      author_id: authorId,
    });
  }
}
