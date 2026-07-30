import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">My Orders</h1>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="card animate-pulse">
              <div class="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
            </div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">📦</div>
          <h3 class="text-xl font-semibold mb-2">No orders yet</h3>
          <a routerLink="/products" class="btn-primary inline-block mt-4">Start Shopping</a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order._id) {
            <div class="card hover:shadow-md transition-shadow">
              <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
                <div>
                  <p class="font-semibold">{{ order.orderNumber }}</p>
                  <p class="text-xs text-gray-500">{{ order.createdAt | date:'medium' }}</p>
                </div>
                <div class="flex gap-2">
                  <span [class]="statusClass(order.status) + ' text-xs px-2 py-1 rounded-full font-medium'">
                    {{ order.status | titlecase }}
                  </span>
                  <span [class]="paymentClass(order.paymentStatus) + ' text-xs px-2 py-1 rounded-full font-medium'">
                    {{ order.paymentStatus | titlecase }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
                @for (item of order.items.slice(0, 4); track item._id) {
                  <img [src]="getImg(item)" class="w-14 h-14 object-cover rounded border shrink-0" (error)="onImgError($event)"/>
                }
                @if (order.items.length > 4) {
                  <div class="w-14 h-14 rounded border bg-gray-100 flex items-center justify-center text-gray-500 text-sm shrink-0">
                    +{{ order.items.length - 4 }}
                  </div>
                }
              </div>

              <div class="flex justify-between items-center">
                <span class="font-bold">\${{ order.total.toFixed(2) }}</span>
                <a [routerLink]="['/orders', order._id]" class="text-sm text-blue-600 hover:underline">View Details →</a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: res => { this.orders.set(res.orders); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getImg(item: any): string {
    if (item.image) return item.image;
    return 'https://placehold.co/60x60?text=Item';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=Item';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-indigo-100 text-indigo-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  paymentClass(status: string): string {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }
}
