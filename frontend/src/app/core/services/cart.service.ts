import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cart, CartItem, ApiResponse } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = '/api/cart';

  private _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() => this._cart()?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0);
  readonly total = computed(() => this._cart()?.total ?? 0);

  constructor(private http: HttpClient, private auth: AuthService) {}

  loadCart(): void {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<ApiResponse<{ cart: Cart }>>(`${this.baseUrl}`).subscribe({
      next: res => this._cart.set(res.data.cart),
      error: () => {},
    });
  }

  addToCart(productId: string, variantId?: string, quantity = 1): Observable<{ cart: Cart }> {
    return this.http.post<ApiResponse<{ cart: Cart }>>(`${this.baseUrl}/items`, { productId, variantId, quantity }).pipe(
      map(r => r.data),
      tap(data => this._cart.set(data.cart))
    );
  }

  updateItem(itemId: string, quantity: number): Observable<{ cart: Cart }> {
    return this.http.put<ApiResponse<{ cart: Cart }>>(`${this.baseUrl}/items/${itemId}`, { quantity }).pipe(
      map(r => r.data),
      tap(data => this._cart.set(data.cart))
    );
  }

  removeItem(itemId: string): Observable<{ cart: Cart }> {
    return this.http.delete<ApiResponse<{ cart: Cart }>>(`${this.baseUrl}/items/${itemId}`).pipe(
      map(r => r.data),
      tap(data => this._cart.set(data.cart))
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}`).pipe(
      tap(() => this._cart.set(null))
    );
  }

  clearLocal(): void {
    this._cart.set(null);
  }
}
