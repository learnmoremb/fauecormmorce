import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DriverService } from '../../../core/services/driver.service';
import { OrderService } from '../../../core/services/order.service';
import { Delivery, Driver, Order } from '../../../core/models';

@Component({
  selector: 'app-shop-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Delivery Management</h1>
        <a routerLink="/shop/dashboard" class="btn-secondary text-sm px-4 py-2">← Back to Dashboard</a>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200 mb-6">
        @for (tab of tabs; track tab.key) {
          <button
            (click)="activeTab.set(tab.key)"
            [class]="activeTab() === tab.key
              ? 'px-4 py-2 text-sm font-semibold text-amazon-orange border-b-2 border-amazon-orange -mb-px'
              : 'px-4 py-2 text-sm text-gray-500 hover:text-gray-700'"
          >{{ tab.label }}</button>
        }
      </div>

      <!-- Create Delivery Tab -->
      @if (activeTab() === 'create') {
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Orders ready for delivery -->
          <div class="card">
            <h2 class="font-semibold mb-4">Orders Ready to Ship</h2>
            @if (orders().length === 0) {
              <p class="text-gray-400 text-sm text-center py-6">No confirmed orders awaiting delivery.</p>
            } @else {
              <div class="space-y-3">
                @for (order of orders(); track order._id) {
                  <div
                    (click)="selectOrder(order)"
                    [class]="selectedOrder()?._id === order._id
                      ? 'border-2 border-amazon-orange rounded-lg p-3 cursor-pointer bg-orange-50'
                      : 'border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-400'"
                  >
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-semibold text-sm">{{ order.orderNumber }}</p>
                        <p class="text-xs text-gray-500">{{ orderUserName(order) }} · {{ orderUserPhone(order) }}</p>
                        <p class="text-xs text-gray-400 mt-1">{{ order.shippingAddress?.street }}, {{ order.shippingAddress?.city }}</p>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-bold">\${{ order.total.toFixed(2) }}</span>
                        <p class="text-xs text-gray-500">{{ order.items.length }} item(s)</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Assign delivery -->
          <div class="card">
            <h2 class="font-semibold mb-4">Assign Delivery</h2>
            @if (!selectedOrder()) {
              <div class="text-center py-10 text-gray-400">
                <p class="text-4xl mb-2">👈</p>
                <p class="text-sm">Select an order to assign a delivery driver.</p>
              </div>
            } @else {
              <div class="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm">
                <p class="font-medium text-green-800">Selected: {{ selectedOrder()!.orderNumber }}</p>
                <p class="text-green-600">To: {{ selectedOrder()!.shippingAddress?.name }}, {{ selectedOrder()!.shippingAddress?.city }}</p>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Delivery Fee ($)</label>
                <input type="number" [(ngModel)]="deliveryFee" min="0" step="0.5" class="input-field"/>
              </div>

              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm font-medium">Find Nearby Drivers</label>
                  <button (click)="findNearbyDrivers()" [disabled]="searchingDrivers()" class="text-xs text-blue-600 hover:underline disabled:opacity-50">
                    {{ searchingDrivers() ? 'Searching...' : '🔍 Search' }}
                  </button>
                </div>
                @if (nearbyDrivers().length === 0 && !searchingDrivers()) {
                  <p class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded">
                    Click Search to find available drivers near the shop.
                  </p>
                }
                <div class="space-y-2 max-h-56 overflow-y-auto">
                  @for (driver of nearbyDrivers(); track driver._id) {
                    <div
                      (click)="selectDriver(driver)"
                      [class]="selectedDriver()?._id === driver._id
                        ? 'border-2 border-amazon-orange rounded-lg p-3 cursor-pointer bg-orange-50 flex items-center gap-3'
                        : 'border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-400 flex items-center gap-3'"
                    >
                      @if (driverAvatar(driver)) {
                        <img [src]="'http://localhost:5000' + driverAvatar(driver)" class="w-10 h-10 rounded-full object-cover"/>
                      } @else {
                        <div class="w-10 h-10 rounded-full bg-amazon-navy flex items-center justify-center text-white font-bold text-sm">
                          {{ driverInitial(driver) }}
                        </div>
                      }
                      <div class="flex-1">
                        <p class="font-medium text-sm">{{ driverUserName(driver) }}</p>
                        <p class="text-xs text-gray-500">{{ getVehicleLabel(driver.vehicleType) }} · ⭐ {{ driver.rating.toFixed(1) }}</p>
                      </div>
                      <div class="text-right text-xs text-gray-500">
                        <p>{{ driver.distanceKm }} km away</p>
                        <p>{{ driver.totalDeliveries }} deliveries</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              @if (createError()) {
                <p class="text-sm text-red-600 mb-3">{{ createError() }}</p>
              }

              <button
                (click)="createAndAssign()"
                [disabled]="!selectedDriver() || assigning()"
                class="btn-primary w-full py-3 disabled:opacity-60"
              >
                {{ assigning() ? 'Assigning...' : '🚚 Assign Driver' }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Active Deliveries Tab -->
      @if (activeTab() === 'active') {
        @if (loadingDeliveries()) {
          <div class="card animate-pulse h-32"></div>
        } @else if (shopDeliveries().length === 0) {
          <div class="text-center py-16">
            <div class="text-5xl mb-3">📭</div>
            <p class="text-gray-500">No deliveries yet.</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (d of shopDeliveries(); track d._id) {
              <div class="card hover:shadow-md transition-shadow">
                <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <p class="font-semibold">{{ delivOrderNum(d) }}</p>
                    <p class="text-xs text-gray-500">{{ d.createdAt | date:'medium' }}</p>
                  </div>
                  <span [class]="statusClass(d.status) + ' text-xs px-2 py-1 rounded-full font-medium'">
                    {{ formatStatus(d.status) }}
                  </span>
                </div>

                <div class="grid sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p class="text-xs text-gray-500">Customer</p>
                    <p class="font-medium">{{ delivCustomerName(d) }}</p>
                    <p class="text-xs text-gray-400">{{ delivCustomerPhone(d) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Driver</p>
                    @if (d.driver) {
                      <p class="font-medium">{{ delivDriverName(d) }}</p>
                      <p class="text-xs text-gray-400">{{ delivDriverPhone(d) }}</p>
                    } @else {
                      <p class="text-gray-400">Not assigned</p>
                    }
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Deliver To</p>
                    <p class="font-medium">{{ d.deliveryAddress.city }}</p>
                    <p class="text-xs text-gray-400">Fee: \${{ d.deliveryFee.toFixed(2) }}</p>
                  </div>
                </div>

                @if (d.status === 'pending') {
                  <button (click)="cancelDelivery(d._id)" class="text-xs text-red-500 hover:underline">Cancel Delivery</button>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ShopDeliveryComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private driverService = inject(DriverService);
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  activeTab = signal<'create' | 'active'>('create');
  tabs = [
    { key: 'create' as const, label: 'Create Delivery' },
    { key: 'active' as const, label: 'Active Deliveries' },
  ];

  orders = signal<Order[]>([]);
  shopDeliveries = signal<Delivery[]>([]);
  nearbyDrivers = signal<Driver[]>([]);
  selectedOrder = signal<Order | null>(null);
  selectedDriver = signal<Driver | null>(null);
  deliveryFee = 3;
  searchingDrivers = signal(false);
  assigning = signal(false);
  loadingDeliveries = signal(false);
  createError = signal('');

  // shop location for nearby search (defaults; shop owner can grant browser location)
  shopLat = 0;
  shopLng = 0;

  vehicleMap: Record<string, string> = {
    bicycle: '🚲 Bicycle', motorcycle: '🏍️ Motorcycle',
    car: '🚗 Car', van: '🚐 Van', truck: '🚛 Truck',
  };

  ngOnInit(): void {
    this.orderService.getShopOrders({ status: 'confirmed', limit: 20 }).subscribe({
      next: res => this.orders.set(res.orders),
    });
    this.loadShopDeliveries();
    this.getShopLocation();
  }

  getShopLocation(): void {
    navigator.geolocation?.getCurrentPosition(pos => {
      this.shopLat = pos.coords.latitude;
      this.shopLng = pos.coords.longitude;
    });
  }

  loadShopDeliveries(): void {
    this.loadingDeliveries.set(true);
    this.deliveryService.getShopDeliveries({ limit: 20 }).subscribe({
      next: res => { this.shopDeliveries.set(res.deliveries); this.loadingDeliveries.set(false); },
      error: () => this.loadingDeliveries.set(false),
    });
  }

  selectOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.selectedDriver.set(null);
    this.nearbyDrivers.set([]);
  }

  selectDriver(driver: Driver): void {
    this.selectedDriver.set(driver);
  }

  findNearbyDrivers(): void {
    this.searchingDrivers.set(true);
    const lat = this.shopLat || 0;
    const lng = this.shopLng || 0;
    this.driverService.getNearbyDrivers(lat, lng, 20).subscribe({
      next: res => { this.nearbyDrivers.set(res.drivers); this.searchingDrivers.set(false); },
      error: () => this.searchingDrivers.set(false),
    });
  }

  createAndAssign(): void {
    if (!this.selectedOrder() || !this.selectedDriver()) return;
    this.assigning.set(true);
    this.createError.set('');

    this.deliveryService.createDelivery(this.selectedOrder()!._id, this.deliveryFee).subscribe({
      next: res => {
        this.deliveryService.assignDriver(res.delivery._id, this.selectedDriver()!._id).subscribe({
          next: () => {
            this.assigning.set(false);
            this.selectedOrder.set(null);
            this.selectedDriver.set(null);
            this.nearbyDrivers.set([]);
            this.loadShopDeliveries();
            this.activeTab.set('active');
          },
          error: (err) => {
            this.createError.set(err.error?.message || 'Failed to assign driver');
            this.assigning.set(false);
          },
        });
      },
      error: (err) => {
        this.createError.set(err.error?.message || 'Failed to create delivery');
        this.assigning.set(false);
      },
    });
  }

  cancelDelivery(id: string): void {
    this.deliveryService.cancelDelivery(id).subscribe({
      next: () => this.loadShopDeliveries(),
    });
  }

  orderUserName(order: Order): string { return (order.user as any)?.name ?? ''; }
  orderUserPhone(order: Order): string { return (order.user as any)?.phone ?? ''; }
  driverUserName(d: Driver): string { return (d.user as any)?.name ?? ''; }
  driverAvatar(d: Driver): string { return (d.user as any)?.avatar ?? ''; }
  driverInitial(d: Driver): string { return ((d.user as any)?.name ?? '?')[0]; }
  delivOrderNum(d: any): string { return d.order?.orderNumber ?? ''; }
  delivCustomerName(d: any): string { return d.customer?.name ?? ''; }
  delivCustomerPhone(d: any): string { return d.customer?.phone ?? ''; }
  delivDriverName(d: any): string { return d.driver?.user?.name ?? ''; }
  delivDriverPhone(d: any): string { return d.driver?.user?.phone ?? ''; }

  getVehicleLabel(type: string): string {
    return this.vehicleMap[type] || type;
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending', assigned: 'Assigned', accepted: 'Accepted',
      in_transit: 'In Transit', delivered: 'Delivered',
      failed: 'Failed', cancelled: 'Cancelled',
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
