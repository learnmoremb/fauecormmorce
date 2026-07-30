import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Delivery } from '../models';

export interface DeliveryListResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  constructor(private api: ApiService) {}

  createDelivery(orderId: string, deliveryFee = 0, notes?: string): Observable<{ delivery: Delivery }> {
    return this.api.post<{ delivery: Delivery }>('/deliveries', { orderId, deliveryFee, notes });
  }

  assignDriver(deliveryId: string, driverId: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${deliveryId}/assign`, { driverId });
  }

  acceptDelivery(id: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${id}/accept`, {});
  }

  rejectDelivery(id: string, reason?: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${id}/reject`, { reason });
  }

  markPickedUp(id: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${id}/pickup`, {});
  }

  markDelivered(id: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${id}/deliver`, {});
  }

  cancelDelivery(id: string): Observable<{ delivery: Delivery }> {
    return this.api.put<{ delivery: Delivery }>(`/deliveries/${id}/cancel`, {});
  }

  getDeliveryById(id: string): Observable<{ delivery: Delivery }> {
    return this.api.get<{ delivery: Delivery }>(`/deliveries/${id}`);
  }

  getDeliveryByOrder(orderId: string): Observable<{ delivery: Delivery }> {
    return this.api.get<{ delivery: Delivery }>(`/deliveries/order/${orderId}`);
  }

  getShopDeliveries(params?: { status?: string; page?: number; limit?: number }): Observable<DeliveryListResponse> {
    return this.api.get<DeliveryListResponse>('/deliveries/shop', params as any);
  }

  rateDelivery(id: string, rating: number, review?: string): Observable<{ delivery: Delivery }> {
    return this.api.post<{ delivery: Delivery }>(`/deliveries/${id}/rate`, { rating, review });
  }
}
