import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';
import { BACKEND_ORIGIN } from '../../../core/backend-origin';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-6">
      @if (success()) {
        <div class="bg-green-50 border border-green-300 text-green-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <span class="text-3xl">🎉</span>
          <div>
            <p class="font-semibold">Order placed successfully!</p>
            <p class="text-sm">Your order is confirmed and will be processed shortly.</p>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="card animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      } @else if (order()) {
        <!-- Header -->
        <div class="flex flex-wrap justify-between items-start gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold">Order {{ order()!.orderNumber }}</h1>
            <p class="text-gray-500 text-sm mt-1">Placed on {{ order()!.createdAt | date:'longDate' }}</p>
          </div>
          <div class="flex gap-2">
            <span [class]="statusClass(order()!.status) + ' px-3 py-1 rounded-full text-sm font-semibold'">{{ order()!.status | titlecase }}</span>
            @if (['pending', 'confirmed'].includes(order()!.status)) {
              <button (click)="cancelOrder()" class="text-sm text-red-600 border border-red-300 px-3 py-1 rounded hover:bg-red-50">Cancel</button>
            }
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <!-- Items -->
          <div class="md:col-span-2 space-y-4">
            <div class="card">
              <h2 class="font-semibold mb-4">Items Ordered</h2>
              <div class="space-y-4">
                @for (item of order()!.items; track item._id) {
                  <div class="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <img [src]="getImg(item)" class="w-20 h-20 object-cover rounded border" (error)="onImgError($event)"/>
                    <div class="flex-1">
                      <p class="font-medium text-sm">{{ item.name }}</p>
                      @if (item.color) { <p class="text-xs text-gray-500 mt-0.5">Color: {{ item.color }}</p> }
                      @if (item.size) { <p class="text-xs text-gray-500">Size: {{ item.size }}</p> }
                      <p class="text-xs text-gray-500">Sold by: <a [routerLink]="['/shops', item.shop._id]" class="text-blue-600 hover:underline">{{ item.shop.name }}</a></p>
                      <p class="text-sm mt-1">x{{ item.quantity }} × \${{ item.price.toFixed(2) }}</p>
                    </div>
                    <p class="font-semibold text-sm shrink-0">\${{ (item.quantity * item.price).toFixed(2) }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Shipping -->
            <div class="card">
              <h2 class="font-semibold mb-3">Shipping Address</h2>
              <div class="text-sm text-gray-700 space-y-0.5">
                <p class="font-medium">{{ order()!.shippingAddress.name }}</p>
                @if (order()!.shippingAddress.phone) { <p>{{ order()!.shippingAddress.phone }}</p> }
                <p>{{ order()!.shippingAddress.street }}</p>
                <p>{{ order()!.shippingAddress.city }}{{ order()!.shippingAddress.state ? ', ' + order()!.shippingAddress.state : '' }}</p>
                <p>{{ order()!.shippingAddress.country }}{{ order()!.shippingAddress.zipCode ? ' ' + order()!.shippingAddress.zipCode : '' }}</p>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="space-y-4">
            <div class="card">
              <h2 class="font-semibold mb-3">Payment Summary</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Subtotal</span><span>\${{ order()!.subtotal.toFixed(2) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Shipping</span><span>{{ order()!.shippingFee === 0 ? 'FREE' : '\$' + order()!.shippingFee.toFixed(2) }}</span></div>
                <hr/>
                <div class="flex justify-between font-bold text-base"><span>Total</span><span>\${{ order()!.total.toFixed(2) }}</span></div>
                <div class="pt-2 text-xs text-gray-500">
                  <p>Payment: {{ order()!.paymentMethod }}</p>
                  <p>Status: <span [class]="order()!.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-yellow-600'">{{ order()!.paymentStatus | titlecase }}</span></p>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="card">
              <h2 class="font-semibold mb-3">Order Status</h2>
              <div class="space-y-2">
                @for (step of orderSteps; track step.status) {
                  <div class="flex items-center gap-2 text-sm">
                    @if (isCompleted(step.status)) {
                      <span class="text-green-600 text-lg">✓</span>
                    } @else if (isCurrent(step.status)) {
                      <span class="text-amazon-orange text-lg">●</span>
                    } @else {
                      <span class="text-gray-300 text-lg">○</span>
                    }
                    <span [class]="isCurrent(step.status) ? 'font-semibold text-amazon-orange' : isCompleted(step.status) ? 'text-gray-700' : 'text-gray-400'">
                      {{ step.label }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3 flex-wrap">
          <a routerLink="/orders" class="btn-secondary text-sm px-4 py-2">← Back to Orders</a>
          @if (['shipped', 'confirmed', 'processing'].includes(order()!.status)) {
            <a [routerLink]="['/track', order()!._id]" class="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded font-semibold transition-colors">
              📍 Track Delivery
            </a>
          }
          <a routerLink="/products" class="btn-primary text-sm px-4 py-2">Continue Shopping</a>
        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  order = signal<Order | null>(null);
  loading = signal(true);
  success = signal(false);

  orderSteps = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'confirmed', label: 'Order Confirmed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ];

  statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  ngOnInit(): void {
    this.success.set(this.route.snapshot.queryParams['success'] === '1');
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderService.getOrderById(id).subscribe({
      next: res => { this.order.set(res.order); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getImg(item: any): string {
    if (item.image) return item.image.startsWith('/') ? `${BACKEND_ORIGIN}${item.image}` : item.image;
    return 'https://placehold.co/80x80?text=Item';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=Item';
  }

  isCompleted(status: string): boolean {
    const current = this.order()?.status || '';
    return this.statusOrder.indexOf(current) > this.statusOrder.indexOf(status);
  }

  isCurrent(status: string): boolean {
    return this.order()?.status === status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-indigo-100 text-indigo-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  cancelOrder(): void {
    const id = this.order()?._id;
    if (!id) return;
    this.orderService.cancelOrder(id).subscribe({
      next: res => this.order.set(res.order),
    });
  }
}
