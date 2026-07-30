import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Driver } from '../models';

export interface NearbyDriversResponse {
  drivers: Driver[];
  count: number;
}

export interface DriverDeliveriesResponse {
  deliveries: any[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class DriverService {
  constructor(private api: ApiService) {}

  registerDriver(formData: FormData): Observable<{ driver: Driver }> {
    return this.api.postFormData<{ driver: Driver }>('/drivers/register', formData);
  }

  getMyProfile(): Observable<{ driver: Driver }> {
    return this.api.get<{ driver: Driver }>('/drivers/me');
  }

  updateProfile(formData: FormData): Observable<{ driver: Driver }> {
    return this.api.putFormData<{ driver: Driver }>('/drivers/me', formData);
  }

  setAvailability(isAvailable: boolean): Observable<{ isAvailable: boolean }> {
    return this.api.put<{ isAvailable: boolean }>('/drivers/availability', { isAvailable });
  }

  updateLocation(latitude: number, longitude: number): Observable<any> {
    return this.api.put('/drivers/location', { latitude, longitude });
  }

  getNearbyDrivers(latitude: number, longitude: number, radius = 10): Observable<NearbyDriversResponse> {
    return this.api.get<NearbyDriversResponse>('/drivers/nearby', { latitude, longitude, radius });
  }

  getMyDeliveries(params?: { status?: string; page?: number; limit?: number }): Observable<DriverDeliveriesResponse> {
    return this.api.get<DriverDeliveriesResponse>('/drivers/deliveries', params as any);
  }
}
