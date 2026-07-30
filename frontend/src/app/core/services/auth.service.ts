import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../models';
import { BACKEND_ORIGIN } from '../backend-origin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${BACKEND_ORIGIN}/api/auth`;
  private readonly TOKEN_KEY = 'sz_token';

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly isShopOwner = computed(() => this._currentUser()?.role === 'shop_owner');
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.http.get<ApiResponse<{ user: User }>>(`${this.baseUrl}/me`).subscribe({
        next: res => this._currentUser.set(res.data.user),
        error: () => this.clearSession(),
      });
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register`, data).pipe(
      map(r => r.data),
      tap(auth => this.saveSession(auth))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, data).pipe(
      map(r => r.data),
      tap(auth => this.saveSession(auth))
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    this._currentUser.set(auth.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);
  }
}
