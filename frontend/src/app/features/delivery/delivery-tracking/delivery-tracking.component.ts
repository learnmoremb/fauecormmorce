import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { Delivery } from '../../../core/models';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DeliveryMapComponent, MapPoint } from '../../../shared/components/delivery-map/delivery-map.component';
import { BACKEND_ORIGIN } from '../../../core/backend-origin';

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DeliveryMapComponent],
  template: `
    <div class="max-w-screen-md mx-auto px-4 py-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/orders" class="text-gray-500 hover:text-gray-700">← My Orders</a>
        <h1 class="text-2xl font-bold">Track Delivery</h1>
      </div>

      @if (loading()) {
        <div class="card animate-pulse h-48"></div>
      } @else if (!delivery()) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold mb-2">No delivery found</h3>
          <p class="text-gray-500 mb-4">This order doesn't have a delivery assigned yet.</p>
          <a routerLink="/orders" class="btn-primary inline-block">Back to Orders</a>
        </div>
      } @else {
        <!-- Status Timeline -->
        <div class="card mb-6">
          <h2 class="font-semibold mb-5 text-lg">Delivery Status</h2>
          <div class="relative">
            <!-- Progress line -->
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="absolute left-4 top-0 w-0.5 bg-amazon-orange transition-all duration-500"
                 [style.height]="progressHeight()"></div>

            <div class="space-y-6">
              @for (step of deliverySteps; track step.status) {
                <div class="flex items-center gap-4 relative">
                  <div [class]="getStepCircleClass(step.status)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-300">
                    @if (isStepDone(step.status)) {
                      <span class="text-white text-sm">✓</span>
                    } @else if (isStepCurrent(step.status)) {
                      <span class="w-3 h-3 rounded-full bg-amazon-orange animate-pulse block"></span>
                    }
                  </div>
                  <div [class]="isStepCurrent(step.status) ? 'font-semibold' : isStepDone(step.status) ? 'text-gray-700' : 'text-gray-400'">
                    <p>{{ step.label }}</p>
                    <p class="text-xs text-gray-400">{{ getStepTime(step.status) }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Driver Info -->
        @if (delivery()!.driver) {
          <div class="card mb-6">
            <h2 class="font-semibold mb-4">Your Driver</h2>
            <div class="flex items-center gap-4">
              @if (driverAvatar()) {
                <img [src]="backendOrigin + driverAvatar()" class="w-16 h-16 rounded-full object-cover"/>
              } @else {
                <div class="w-16 h-16 rounded-full bg-amazon-navy flex items-center justify-center text-white text-2xl font-bold">
                  {{ driverInitial() }}
                </div>
              }
              <div class="flex-1">
                <p class="font-semibold text-lg">{{ driverName() }}</p>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span>{{ vehicleIcon(driverVehicleType()) }} {{ driverVehicleType() | titlecase }}</span>
                  @if (driverPlate()) {
                    <span>· {{ driverPlate() }}</span>
                  }
                </div>
                <div class="flex items-center gap-1 mt-1">
                  <span class="text-amazon-orange text-sm">{{ getStars(driverRating()) }}</span>
                  <span class="text-xs text-gray-400">({{ driverTotalRatings() }} reviews)</span>
                </div>
              </div>
              @if (driverPhone()) {
                <a [href]="'tel:' + driverPhone()"
                   class="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  📞 Call
                </a>
              }
            </div>

            <!-- Live location indicator -->
            @if (delivery()!.status === 'in_transit' && delivery()!.currentDriverLocation?.coordinates?.length) {
              <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                <span class="text-2xl">📍</span>
                <div class="text-sm">
                  <p class="font-medium text-blue-800">Driver is on the way!</p>
                  <p class="text-blue-600 text-xs">Location updates every 15 seconds · Last updated {{ delivery()!.currentDriverLocation?.updatedAt | date:'shortTime' }}</p>
                </div>
                <span class="ml-auto text-green-500 animate-pulse text-lg">●</span>
              </div>
            }
          </div>
        }

        <!-- Delivery Details -->
        <div class="card mb-6">
          <h2 class="font-semibold mb-4">Delivery Details</h2>
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 rounded p-3">
              <p class="text-xs text-gray-500 font-medium mb-1">📦 PICKUP FROM</p>
              <p class="font-medium">{{ shopName() }}</p>
              <p class="text-gray-600 text-xs">{{ delivery()!.pickupAddress.street }}, {{ delivery()!.pickupAddress.city }}</p>
            </div>
            <div class="bg-gray-50 rounded p-3">
              <p class="text-xs text-gray-500 font-medium mb-1">🏠 DELIVER TO</p>
              <p class="font-medium">{{ delivery()!.deliveryAddress.name }}</p>
              <p class="text-gray-600 text-xs">{{ delivery()!.deliveryAddress.street }}, {{ delivery()!.deliveryAddress.city }}</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-xs text-gray-500 font-medium mb-2">🗺️ ROUTE — pickup → drop-off{{ liveDriverPosition() ? ' · live driver location' : '' }}</p>
            <app-delivery-map
              [pickup]="pickupPoint()"
              [dropoff]="dropoffPoint()"
              [driver]="liveDriverPosition()"
              height="260px"
            />
          </div>

          <div class="mt-3 flex gap-4 text-sm text-gray-600">
            <span>Order: <strong>{{ orderNumber() }}</strong></span>
            <span>Delivery Fee: <strong>\${{ delivery()!.deliveryFee.toFixed(2) }}</strong></span>
          </div>
        </div>

        <!-- Rate Delivery -->
        @if (delivery()!.status === 'delivered' && !delivery()!.customerRating) {
          <div class="card mb-6">
            <h2 class="font-semibold mb-4">Rate Your Delivery</h2>
            <p class="text-sm text-gray-500 mb-4">How was your delivery experience?</p>
            <div class="flex gap-2 mb-4">
              @for (star of [1,2,3,4,5]; track star) {
                <button (click)="selectedRating.set(star)"
                  [class]="star <= selectedRating() ? 'text-4xl text-amazon-orange' : 'text-4xl text-gray-300 hover:text-yellow-300'"
                >★</button>
              }
            </div>
            <textarea [(ngModel)]="ratingReview" placeholder="Tell us about your experience (optional)..." rows="3" class="input-field resize-none mb-3"></textarea>
            <button (click)="submitRating()" [disabled]="selectedRating() === 0 || submittingRating()" class="btn-primary disabled:opacity-60">
              {{ submittingRating() ? 'Submitting...' : 'Submit Rating' }}
            </button>
          </div>
        }

        @if (delivery()!.customerRating) {
          <div class="card bg-green-50 border-green-200">
            <p class="font-medium text-green-800">✓ You rated this delivery {{ delivery()!.customerRating }}/5 ⭐</p>
            @if (delivery()!.customerReview) {
              <p class="text-sm text-green-600 mt-1">"{{ delivery()!.customerReview }}"</p>
            }
          </div>
        }
      }
    </div>
  `,
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy {
  private deliveryService = inject(DeliveryService);
  private route = inject(ActivatedRoute);
  readonly backendOrigin = BACKEND_ORIGIN;

  delivery = signal<Delivery | null>(null);
  loading = signal(true);
  selectedRating = signal(0);
  ratingReview = '';
  submittingRating = signal(false);

  private pollSub?: Subscription;

  deliverySteps = [
    { status: 'pending', label: 'Order Ready', timeKey: 'createdAt' },
    { status: 'assigned', label: 'Driver Assigned', timeKey: 'assignedAt' },
    { status: 'accepted', label: 'Driver Accepted', timeKey: 'acceptedAt' },
    { status: 'in_transit', label: 'Picked Up & In Transit', timeKey: 'pickedUpAt' },
    { status: 'delivered', label: 'Delivered', timeKey: 'deliveredAt' },
  ];

  statusOrder = ['pending', 'assigned', 'accepted', 'in_transit', 'delivered'];

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId')!;
    this.loadDelivery(orderId);

    // Poll every 15s when in active states
    this.pollSub = interval(15000).pipe(
      switchMap(() => this.deliveryService.getDeliveryByOrder(orderId))
    ).subscribe({
      next: res => {
        this.delivery.set(res.delivery);
        if (res.delivery.status === 'delivered') this.pollSub?.unsubscribe();
      },
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadDelivery(orderId: string): void {
    this.deliveryService.getDeliveryByOrder(orderId).subscribe({
      next: res => { this.delivery.set(res.delivery); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get progressHeight(): () => string {
    return () => {
      const status = this.delivery()?.status || 'pending';
      const idx = this.statusOrder.indexOf(status);
      if (idx < 0) return '0%';
      return `${(idx / (this.statusOrder.length - 1)) * 100}%`;
    };
  }

  isStepDone(status: string): boolean {
    const current = this.delivery()?.status || '';
    return this.statusOrder.indexOf(current) > this.statusOrder.indexOf(status);
  }

  isStepCurrent(status: string): boolean {
    return this.delivery()?.status === status;
  }

  getStepCircleClass(status: string): string {
    if (this.isStepDone(status)) return 'bg-amazon-orange border-amazon-orange';
    if (this.isStepCurrent(status)) return 'bg-white border-amazon-orange';
    return 'bg-white border-gray-300';
  }

  getStepTime(status: string): string {
    const d = this.delivery();
    if (!d) return '';
    const timeMap: Record<string, string | undefined> = {
      pending: d.createdAt,
      assigned: d.assignedAt,
      accepted: d.acceptedAt,
      in_transit: d.pickedUpAt,
      delivered: d.deliveredAt,
    };
    const t = timeMap[status];
    return t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }

  pickupPoint(): MapPoint | null {
    return this.toMapPoint(this.delivery()?.pickupAddress?.coordinates, this.shopName());
  }

  dropoffPoint(): MapPoint | null {
    return this.toMapPoint(this.delivery()?.deliveryAddress?.coordinates, this.delivery()?.deliveryAddress?.name);
  }

  liveDriverPosition(): MapPoint | null {
    if (this.delivery()?.status !== 'in_transit') return null;
    return this.toMapPoint(this.delivery()?.currentDriverLocation?.coordinates, this.driverName());
  }

  private toMapPoint(coordinates: number[] | undefined, label?: string): MapPoint | null {
    if (!coordinates || coordinates.length !== 2) return null;
    const [lng, lat] = coordinates;
    return { lat, lng, label };
  }

  private get d(): any { return this.delivery()?.driver as any; }
  shopName(): string { return (this.delivery()?.shop as any)?.name ?? ''; }
  orderNumber(): string { return (this.delivery()?.order as any)?.orderNumber ?? ''; }
  driverName(): string { return this.d?.user?.name ?? ''; }
  driverInitial(): string { return (this.d?.user?.name ?? '?')[0]; }
  driverAvatar(): string { return this.d?.user?.avatar ?? ''; }
  driverPhone(): string { return this.d?.user?.phone ?? ''; }
  driverVehicleType(): string { return this.d?.vehicleType ?? ''; }
  driverPlate(): string { return this.d?.vehiclePlate ?? ''; }
  driverRating(): number { return this.d?.rating ?? 0; }
  driverTotalRatings(): number { return this.d?.totalRatings ?? 0; }

  vehicleIcon(type: string): string {
    const map: Record<string, string> = { bicycle: '🚲', motorcycle: '🏍️', car: '🚗', van: '🚐', truck: '🚛' };
    return map[type] || '🚗';
  }

  getStars(rating: number = 0): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  submitRating(): void {
    if (this.selectedRating() === 0) return;
    this.submittingRating.set(true);
    this.deliveryService.rateDelivery(this.delivery()!._id, this.selectedRating(), this.ratingReview || undefined).subscribe({
      next: res => {
        this.delivery.set(res.delivery);
        this.submittingRating.set(false);
      },
      error: () => this.submittingRating.set(false),
    });
  }
}
