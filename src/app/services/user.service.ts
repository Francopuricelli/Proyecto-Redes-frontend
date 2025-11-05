import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private API_URL = `${environment.apiUrl}/users`;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getHeaders(): HttpHeaders {
    if (!this.isBrowser) {
      return new HttpHeaders();
    }
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`, { headers: this.getHeaders() });
  }

  updateProfile(updateData: FormData): Observable<User> {
    if (!this.isBrowser) {
      throw new Error('Cannot update profile in server-side rendering');
    }
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.patch<User>(`${this.API_URL}/me`, updateData, { headers });
  }
}
