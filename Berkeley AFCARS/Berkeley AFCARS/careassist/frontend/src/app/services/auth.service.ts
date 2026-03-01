import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<UserInfo | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem('careassist_user');
    if (saved) {
      try {
        this.currentUser$.next(JSON.parse(saved));
      } catch {
        localStorage.removeItem('careassist_user');
      }
    }
  }

  login(email: string, password: string): Observable<UserInfo> {
    return this.http.post<UserInfo>('/api/auth/login', { email, password }).pipe(
      tap(user => {
        this.currentUser$.next(user);
        localStorage.setItem('careassist_user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUser$.next(null);
    localStorage.removeItem('careassist_user');
    this.router.navigate(['/login']);
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUser$.value;
  }

  get user$(): Observable<UserInfo | null> {
    return this.currentUser$.asObservable();
  }

  isLoggedIn(): boolean {
    return this.currentUser$.value !== null;
  }

  getUserRole(): string | null {
    return this.currentUser$.value?.role ?? null;
  }

  getUserDisplayName(): string {
    const u = this.currentUser$.value;
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      social_worker: 'Social Worker',
      foster_parent: 'Foster Parent',
      aged_out_youth: 'Aged-Out Youth (18+)',
      supervisor: 'Supervisor',
      admin: 'Administrator',
    };
    return labels[role] || role;
  }
}
