import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Shop } from '../models';

export interface ShopListResponse {
  shops: Shop[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  constructor(private api: ApiService) {}

  getAllShops(params?: { category?: string; search?: string; page?: number; limit?: number }): Observable<ShopListResponse> {
    return this.api.get<ShopListResponse>('/shops', params as any);
  }

  getShopById(id: string): Observable<{ shop: Shop }> {
    return this.api.get<{ shop: Shop }>(`/shops/${id}`);
  }

  getMyShop(): Observable<{ shop: Shop }> {
    return this.api.get<{ shop: Shop }>('/shops/my-shop');
  }

  createShop(formData: FormData): Observable<{ shop: Shop }> {
    return this.api.postFormData<{ shop: Shop }>('/shops', formData);
  }

  updateShop(formData: FormData): Observable<{ shop: Shop }> {
    return this.api.putFormData<{ shop: Shop }>('/shops', formData);
  }
}
