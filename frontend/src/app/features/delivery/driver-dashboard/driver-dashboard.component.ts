import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { Driver, Delivery, VEHICLE_TYPES } from '../../../core/models';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DeliveryMapComponent, MapPoint } from '../../../shared/components/delivery-map/delivery-map.component';
import { BACKEND_ORIGIN } from '../../../core/backend-origin';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DeliveryMapComponent],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-6">
      @if (loading()) {
        <div class="card animate-pulse h-48"></div>
      } @else if (!driver()) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">🚗</div>
          <h3 class="text-xl font-semibold mb-2">No driver profile found</h3>
          <a routerLink="/driver/register" class="btn-primary inline-block mt-4">Register as Driver</a>
        </div>
      } @else {
        <!-- Driver Header -->
        <div class="card mb-6 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div class="relative shrink-0">
            @if (driver()!.photo) {
              <img [src]="backendOrigin + driver()!.photo" class="w-24 h-24 rounded-full object-cover border-4 border-amazon-orange"/>
            } @else {
              <div class="w-24 h-24 rounded-full bg-amazon-navy flex items-center justify-center text-white text-3xl font-bold">
                {{ driver()!.user.name?.[0] }}
              </div>
            }
            <span [class]="driver()!.isAvailable ? 'bg-green-500' : 'bg-gray-400'" class="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white"></span>
          </div>

          <div class="flex-1 text-center md:text-left">
            <h1 class="text-2xl font-bold">{{ driver()!.user.name }}</h1>
            <p class="text-gray-500 text-sm">{{ driver()!.user.phone }}</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
              <span class="text-sm bg-gray-100 px-3 py-1 rounded-full">{{ getVehicleIcon() }} {{ driver()!.vehicleType | titlecase }}</span>
              @if (driver()!.vehiclePlate) {
                <span class="text-sm bg-gray-100 px-3 py-1 rounded-full">🔖 {{ driver()!.vehiclePlate }}</span>
              }
              <span class="text-sm bg-yellow-50 px-3 py-1 rounded-full">⭐ {{ driver()!.rating.toFixed(1) }} ({{ driver()!.totalRatings }})</span>
              @if (driver()!.isVerified) {
                <span class="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Verified</span>
              }
            </div>
          </div>

          <!-- Availability Toggle -->
          <div class="shrink-0 flex flex-col items-center gap-2">
            <p class="text-xs text-gray-500 font-medium">STATUS</p>
            <button
              (click)="toggleAvailability()"
              [class]="driver()!.isAvailable
                ? 'bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold text-sm transition-colors'
                : 'bg-gray-300 hover:bg-green-400 hover:text-white text-gray-700 px-6 py-2 rounded-full font-semibold text-sm transition-colors'"
            >
              {{ driver()!.isAvailable ? '🟢 Online' : '⚫ Go Online' }}
            </button>
            <p class="text-xs text-gray-400">{{ driver()!.isAvailable ? 'Available for deliveries' : 'Offline' }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-3xl font-bold text-amazon-orange">{{ driver()!.totalDeliveries }}</p>
            <p class="text-sm text-gray-500 mt-1">Deliveries</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-yellow-500">{{ driver()!.rating.toFixed(1) }}</p>
            <p class="text-sm text-gray-500 mt-1">Avg Rating</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-green-600">{{ pendingCount() }}</p>
            <p class="text-sm text-gray-500 mt-1">Pending</p>
          </div>
        </div>

        <!-- Active Delivery -->
        @if (activeDelivery()) {
          <div class="card mb-6 border-2 border-amazon-orange">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-amazon-orange">🚚 Active Delivery</h2>
              <span [class]="statusClass(activeDelivery()!.status) + ' text-xs px-2 py-1 rounded-full font-medium'">
                {{ formatStatus(activeDelivery()!.status) }}
              </span>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div class="bg-gray-50 rounded p-3">
                <p class="text-xs text-gray-500 font-medium mb-1">📦 PICKUP FROM</p>
                <p class="font-semibold text-sm">{{ activeDeliveryShopName() }}</p>
                <p class="text-xs text-gray-600">{{ activeDelivery()!.pickupAddress.street }}, {{ activeDelivery()!.pickupAddress.city }}</p>
              </div>
              <div class="bg-gray-50 rounded p-3">
                <p class="text-xs text-gray-500 font-medium mb-1">🏠 DELIVER TO</p>
                <p class="font-semibold text-sm">{{ activeDelivery()!.deliveryAddress.name }}</p>
                <p class="text-xs text-gray-600">{{ activeDelivery()!.deliveryAddress.street }}, {{ activeDelivery()!.deliveryAddress.city }}</p>
                @if (activeDelivery()!.deliveryAddress.phone) {
                  <p class="text-xs text-blue-600 mt-1">📞 {{ activeDelivery()!.deliveryAddress.phone }}</p>
                }
              </div>
            </div>

            <div class="mb-4">
              <p class="text-xs text-gray-500 font-medium mb-2">🗺️ ROUTE — pickup → drop-off{{ driverPosition() ? ' (your live position is shown too)' : '' }}</p>
              <app-delivery-map
                [pickup]="pickupPoint()"
                [dropoff]="dropoffPoint()"
                [driver]="driverPosition()"
                height="260px"
              />
            </div>

            <div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>Order: <strong>{{ activeDeliveryOrderNumber() }}</strong></span>
              <span class="text-gray-300">|</span>
              <span>Fee: <strong class="text-green-600">\${{ activeDelivery()!.deliveryFee.toFixed(2) }}</strong></span>
            </div>

            <!-- Action buttons by status -->
            <div class="flex gap-3 flex-wrap">
              @if (activeDelivery()!.status === 'assigned') {
                <button (click)="actionDelivery('accept')" class="btn-primary flex-1">✓ Accept Delivery</button>
                <button (click)="actionDelivery('reject')" class="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded font-medium flex-1 transition-colors">✗ Reject</button>
              }
              @if (activeDelivery()!.status === 'accepted') {
                <div class="w-full">
                  <p class="text-sm text-gray-500 mb-2">Head to the shop and pick up the order.</p>
                  <button (click)="actionDelivery('pickup')" class="btn-primary w-full">📦 Mark as Picked Up</button>
                </div>
              }
              @if (activeDelivery()!.status === 'in_transit') {
                <div class="w-full">
                  <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-3 flex items-center gap-2">
                    <span class="text-2xl">📍</span>
                    <div class="text-sm">
                      <p class="font-medium">Sharing your location</p>
                      <p class="text-gray-500">Your location is being tracked during delivery.</p>
                    </div>
                    <span [class]="locationSharing() ? 'text-green-600 ml-auto font-medium text-sm' : 'text-gray-400 ml-auto text-sm'">
                      {{ locationSharing() ? '● Live' : '○ Off' }}
                    </span>
                  </div>
                  <button (click)="actionDelivery('deliver')" class="btn-primary w-full py-3 text-base">🏁 Mark as Delivered</button>
                </div>
              }
            </div>
          </div>
        }

        @if (!activeDelivery() && driver()!.isAvailable) {
          <div class="card border-2 border-dashed border-gray-300 text-center py-10 mb-6">
            <div class="text-4xl mb-3">🟢</div>
            <p class="font-semibold text-gray-700">You're online and ready!</p>
            <p class="text-sm text-gray-500 mt-1">Waiting for shop owners to assign you a delivery.</p>
          </div>
        }

        <!-- Recent deliveries -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Recent Deliveries</h2>
          @if (deliveries().length === 0) {
            <p class="text-center text-gray-400 py-6">No deliveries yet.</p>
          } @else {
            <div class="space-y-3">
              @for (d of deliveries(); track d._id) {
                <div class="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <p class="font-medium text-sm">{{ getDelivOrderNum(d) }}</p>
                    <p class="text-xs text-gray-500">{{ d.createdAt | date:'shortDate' }} · {{ getDelivShopName(d) }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-green-600 font-semibold text-sm">\${{ d.deliveryFee.toFixed(2) }}</span>
                    <span [class]="statusClass(d.status) + ' text-xs px-2 py-0.5 rounded-full'">{{ formatStatus(d.status) }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private driverService = inject(DriverService);
  private deliveryService = inject(DeliveryService);
  readonly backendOrigin = BACKEND_ORIGIN;

  driver = signal<Driver | null>(null);
  deliveries = signal<Delivery[]>([]);
  activeDelivery = signal<Delivery | null>(null);
  pendingCount = signal(0);
  loading = signal(true);
  locationSharing = signal(false);
  driverPosition = signal<MapPoint | null>(null);

  private locationSub?: Subscription;
  private pollSub?: Subscription;

  vehicleTypes = VEHICLE_TYPES;

  ngOnInit(): void {
    this.driverService.getMyProfile().subscribe({
      next: res => {
        this.driver.set(res.driver);
        this.loading.set(false);
        this.loadDeliveries();
        if (res.driver.isAvailable) this.startLocationSharing();
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.locationSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  loadDeliveries(): void {
    this.driverService.getMyDeliveries({ limit: 10 }).subscribe({
      next: res => {
        this.deliveries.set(res.deliveries);
        const active = res.deliveries.find(d =>
          ['assigned', 'accepted', 'in_transit'].includes(d.status)
        );
        this.activeDelivery.set(active || null);
        this.pendingCount.set(res.deliveries.filter(d => d.status === 'assigned').length);

        if (active?.status === 'in_transit') this.startLocationSharing();
      },
    });
  }

  toggleAvailability(): void {
    const current = this.driver()!.isAvailable;
    this.driverService.setAvailability(!current).subscribe({
      next: res => {
        this.driver.update(d => d ? { ...d, isAvailable: res.isAvailable } : d);
        if (res.isAvailable) this.startLocationSharing();
        else this.stopLocationSharing();
      },
    });
  }

  actionDelivery(action: 'accept' | 'reject' | 'pickup' | 'deliver'): void {
    const id = this.activeDelivery()?._id;
    if (!id) return;

    const request = action === 'accept' ? this.deliveryService.acceptDelivery(id)
      : action === 'reject' ? this.deliveryService.rejectDelivery(id)
      : action === 'pickup' ? this.deliveryService.markPickedUp(id)
      : this.deliveryService.markDelivered(id);

    request.subscribe({
      next: res => {
        this.activeDelivery.set(res.delivery);
        if (action === 'deliver') {
          this.driver.update(d => d ? { ...d, totalDeliveries: d.totalDeliveries + 1, currentDelivery: null } : d);
          this.activeDelivery.set(null);
          this.stopLocationSharing();
          this.loadDeliveries();
        }
        if (action === 'reject') {
          this.activeDelivery.set(null);
          this.loadDeliveries();
        }
        if (action === 'pickup') {
          this.startLocationSharing();
        }
      },
    });
  }

  startLocationSharing(): void {
    if (!navigator.geolocation) return;
    this.locationSharing.set(true);
    this.locationSub?.unsubscribe();
    this.locationSub = interval(15000).subscribe(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        this.driverService.updateLocation(pos.coords.latitude, pos.coords.longitude).subscribe();
        this.driverPosition.set({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'You' });
      });
    });
    // send immediately
    navigator.geolocation.getCurrentPosition(pos => {
      this.driverService.updateLocation(pos.coords.latitude, pos.coords.longitude).subscribe();
      this.driverPosition.set({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'You' });
    });
  }

  stopLocationSharing(): void {
    this.locationSharing.set(false);
    this.locationSub?.unsubscribe();
    this.driverPosition.set(null);
  }

  pickupPoint(): MapPoint | null {
    return this.toMapPoint(this.activeDelivery()?.pickupAddress?.coordinates, this.activeDeliveryShopName());
  }

  dropoffPoint(): MapPoint | null {
    return this.toMapPoint(this.activeDelivery()?.deliveryAddress?.coordinates, this.activeDelivery()?.deliveryAddress?.name);
  }

  private toMapPoint(coordinates: number[] | undefined, label?: string): MapPoint | null {
    if (!coordinates || coordinates.length !== 2) return null;
    const [lng, lat] = coordinates;
    return { lat, lng, label };
  }

  activeDeliveryShopName(): string { return (this.activeDelivery()?.shop as any)?.name ?? ''; }
  activeDeliveryOrderNumber(): string { return (this.activeDelivery()?.order as any)?.orderNumber ?? ''; }
  getDelivOrderNum(d: any): string { return d.order?.orderNumber ?? ''; }
  getDelivShopName(d: any): string { return d.shop?.name ?? ''; }

  getVehicleIcon(): string {
    return this.vehicleTypes.find(v => v.value === this.driver()?.vehicleType)?.icon || '🚗';
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending', assigned: 'Assigned', accepted: 'Accepted',
      picked_up: 'Picked Up', in_transit: 'In Transit',
      delivered: 'Delivered', failed: 'Failed', cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      accepted: 'bg-indigo-100 text-indigo-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
}
