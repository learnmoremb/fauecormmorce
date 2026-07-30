import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, ShippingAddress } from '../models';

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  createOrder(shippingAddress: ShippingAddress, notes?: string): Observable<{ order: Order }> {
    return this.api.post<{ order: Order }>('/orders', { shippingAddress, notes });
  }

  getMyOrders(params?: { page?: number; limit?: number; status?: string }): Observable<OrderListResponse> {
    return this.api.get<OrderListResponse>('/orders', params as any);
  }

  getOrderById(id: string): Observable<{ order: Order }> {
    return this.api.get<{ order: Order }>(`/orders/${id}`);
  }

  cancelOrder(id: string): Observable<{ order: Order }> {
    return this.api.put<{ order: Order }>(`/orders/${id}/cancel`, {});
  }

  getShopOrders(params?: { page?: number; limit?: number; status?: string }): Observable<OrderListResponse> {
    return this.api.get<OrderListResponse>('/orders/shop-orders', params as any);
  }

  updateOrderStatus(id: string, status: string): Observable<{ order: Order }> {
    return this.api.put<{ order: Order }>(`/orders/${id}/status`, { status });
  }
}
