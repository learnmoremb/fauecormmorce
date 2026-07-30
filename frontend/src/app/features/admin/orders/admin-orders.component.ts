import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin" class="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
        <h1 class="text-2xl font-bold">All Orders</h1>
      </div>

      <div class="flex gap-3 mb-6">
        <select [(ngModel)]="statusFilter" (change)="load()" class="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      @if (loading()) {
        <div class="bg-white border rounded-lg animate-pulse h-64"></div>
      } @else if (orders().length === 0) {
        <div class="text-center py-16 text-gray-400">
          <div class="text-5xl mb-3">📦</div>
          <p>No orders found.</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Order #</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th class="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order._id) {
                <tr class="border-b last:border-0 hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs font-semibold">{{ order.orderNumber }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ orderUserName(order) }}</p>
                    <p class="text-xs text-gray-400">{{ orderUserEmail(order) }}</p>
                  </td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ order.createdAt | date:'mediumDate' }}</td>
                  <td class="px-4 py-3 text-right font-bold">\${{ order.total.toFixed(2) }}</td>
                  <td class="px-4 py-3">
                    <span [class]="statusClass(order.status) + ' text-xs px-2 py-0.5 rounded-full font-medium'">
                      {{ order.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="paymentClass(order.paymentStatus) + ' text-xs px-2 py-0.5 rounded-full font-medium'">
                      {{ order.paymentStatus | titlecase }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (pages() > 1) {
          <div class="flex justify-center gap-2 mt-6">
            <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="px-3 py-1 border rounded disabled:opacity-40 text-sm">←</button>
            <span class="px-3 py-1 text-sm text-gray-600">Page {{ currentPage() }} of {{ pages() }}</span>
            <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === pages()" class="px-3 py-1 border rounded disabled:opacity-40 text-sm">→</button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private adminService = inject(AdminService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pages = signal(1);
  statusFilter = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminService.getOrders({ status: this.statusFilter || undefined, page: this.currentPage(), limit: 15 }).subscribe({
      next: res => { this.orders.set(res.orders); this.pages.set(res.pages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void { this.currentPage.set(page); this.load(); }

  orderUserName(o: Order): string { return (o.user as any)?.name ?? '—'; }
  orderUserEmail(o: Order): string { return (o.user as any)?.email ?? '—'; }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }

  paymentClass(s: string): string {
    const m: Record<string, string> = {
      paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
