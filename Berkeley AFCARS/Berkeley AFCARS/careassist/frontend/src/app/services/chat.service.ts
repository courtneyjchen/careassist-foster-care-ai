import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, context?: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.api}/chat`, {
      message,
      context,
    });
  }
}
