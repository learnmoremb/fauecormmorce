import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Shop, User, Order, Driver, VehicleType } from '../models';

export interface AdminStats {
  users: number;
  shops: number;
  pendingShops: number;
  products: number;
  orders: number;
  drivers: number;
  totalRevenue: number;
}

export interface ShopListResponse   { shops: Shop[];    total: number; page: number; pages: number; }
export interface UserListResponse   { users: User[];    total: number; page: number; pages: number; }
export interface OrderListResponse  { orders: Order[];  total: number; page: number; pages: number; }
export interface DriverListResponse { drivers: Driver[]; total: number; page: number; pages: number; }

export interface CreateDriverRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  licenseNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  getStats(): Observable<AdminStats> {
    return this.api.get<AdminStats>('/admin/stats');
  }

  // shops
  getShops(params?: { verified?: string; search?: string; page?: number; limit?: number }): Observable<ShopListResponse> {
    return this.api.get<ShopListResponse>('/admin/shops', params as any);
  }

  verifyShop(id: string): Observable<{ shop: Shop }> {
    return this.api.put<{ shop: Shop }>(`/admin/shops/${id}/verify`, {});
  }

  rejectShop(id: string, reason?: string): Observable<{ shop: Shop }> {
    return this.api.put<{ shop: Shop }>(`/admin/shops/${id}/reject`, { reason });
  }

  toggleShop(id: string): Observable<{ shop: Shop }> {
    return this.api.put<{ shop: Shop }>(`/admin/shops/${id}/toggle`, {});
  }

  // users
  getUsers(params?: { role?: string; search?: string; page?: number; limit?: number }): Observable<UserListResponse> {
    return this.api.get<UserListResponse>('/admin/users', params as any);
  }

  toggleUser(id: string): Observable<{ user: User }> {
    return this.api.put<{ user: User }>(`/admin/users/${id}/toggle`, {});
  }

  // drivers
  getDrivers(params?: { verified?: string; search?: string; page?: number; limit?: number }): Observable<DriverListResponse> {
    return this.api.get<DriverListResponse>('/admin/drivers', params as any);
  }

  createDriver(data: CreateDriverRequest): Observable<{ driver: Driver }> {
    return this.api.post<{ driver: Driver }>('/admin/drivers', data);
  }

  verifyDriver(id: string): Observable<{ driver: Driver }> {
    return this.api.put<{ driver: Driver }>(`/admin/drivers/${id}/verify`, {});
  }

  toggleDriver(id: string): Observable<{ driver: Driver }> {
    return this.api.put<{ driver: Driver }>(`/admin/drivers/${id}/toggle`, {});
  }

  // orders
  getOrders(params?: { status?: string; page?: number; limit?: number }): Observable<OrderListResponse> {
    return this.api.get<OrderListResponse>('/admin/orders', params as any);
  }
}
