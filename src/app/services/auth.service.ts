import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo acceder a localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  login(loginData: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, {
      usuario: loginData.usuario,
      contraseña: loginData.contraseña
    }).pipe(
      tap(response => {
        if (response.user && response.access_token) {
          this.setLocalStorageItem('currentUser', JSON.stringify(response.user));
          this.setLocalStorageItem('access_token', response.access_token);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/registro`, registerData).pipe(
      tap(response => {
        if (response.user && response.access_token) {
          this.setLocalStorageItem('currentUser', JSON.stringify(response.user));
          this.setLocalStorageItem('access_token', response.access_token);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    this.removeLocalStorageItem('currentUser');
    this.removeLocalStorageItem('access_token');
    this.currentUserSubject.next(null);
  }

  private setLocalStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  private getLocalStorageItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private removeLocalStorageItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    this.setLocalStorageItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return !!this.getLocalStorageItem('access_token');
  }

  getToken(): string | null {
    return this.getLocalStorageItem('access_token');
  }
}