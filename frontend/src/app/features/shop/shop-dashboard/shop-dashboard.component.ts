import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Shop, Order } from '../../../core/models';

@Component({
  selector: 'app-shop-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold">Seller Hub</h1>
          @if (shop()) {
            <p class="text-gray-500">{{ shop()!.name }} · <span class="capitalize">{{ shop()!.category }}</span></p>
          }
        </div>
        <div class="flex gap-2">
          <a routerLink="/shop/products/new" class="btn-primary text-sm px-4 py-2">+ Add Product</a>
          <a routerLink="/shop/deliveries" class="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded font-semibold transition-colors">🚚 Deliveries</a>
          <a routerLink="/shop/settings" class="btn-secondary text-sm px-4 py-2">Shop Settings</a>
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @for (i of [1,2,3,4]; track i) {
            <div class="card animate-pulse h-28"></div>
          }
        </div>
      } @else {
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card text-center">
            <p class="text-3xl font-bold text-amazon-orange">{{ totalProducts() }}</p>
            <p class="text-sm text-gray-500 mt-1">Products</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-blue-600">{{ totalOrders() }}</p>
            <p class="text-sm text-gray-500 mt-1">Orders</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-green-600">\${{ totalRevenue().toFixed(2) }}</p>
            <p class="text-sm text-gray-500 mt-1">Revenue</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-purple-600">{{ shop()?.rating?.toFixed(1) ?? '0.0' }}</p>
            <p class="text-sm text-gray-500 mt-1">Rating ⭐</p>
          </div>
        </div>

        <!-- Shop card -->
        @if (shop()) {
          <div class="card mb-8 flex flex-col md:flex-row gap-4 items-start">
            @if (shop()!.logo) {
              <img [src]="'http://localhost:5000' + shop()!.logo" [alt]="shop()!.name" class="w-20 h-20 rounded-lg object-cover border"/>
            } @else {
              <div class="w-20 h-20 rounded-lg bg-amazon-navy flex items-center justify-center text-white text-3xl font-bold">
                {{ shop()!.name[0] }}
              </div>
            }
            <div class="flex-1">
              <h2 class="text-xl font-bold">{{ shop()!.name }}</h2>
              <p class="text-gray-500 text-sm mt-1">{{ shop()!.description || 'No description set.' }}</p>
              <div class="flex gap-4 mt-2 text-sm text-gray-500">
                @if (shop()!.address?.city) { <span>📍 {{ shop()!.address!.city }}</span> }
                @if (shop()!.email) { <span>📧 {{ shop()!.email }}</span> }
                <span [class]="shop()!.isVerified ? 'text-green-600' : 'text-yellow-600'">
                  {{ shop()!.isVerified ? '✓ Verified' : '⏳ Pending verification' }}
                </span>
              </div>
            </div>
            <a routerLink="/shop/settings" class="text-sm text-blue-600 hover:underline">Edit Shop →</a>
          </div>
        }

        <!-- Recent Orders -->
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Recent Orders</h2>
          </div>

          @if (recentOrders().length === 0) {
            <div class="text-center py-10 text-gray-400">
              <p class="text-4xl mb-2">📭</p>
              <p>No orders yet. Share your shop to get started!</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="text-left px-3 py-2 font-medium">Order</th>
                    <th class="text-left px-3 py-2 font-medium">Customer</th>
                    <th class="text-left px-3 py-2 font-medium">Date</th>
                    <th class="text-right px-3 py-2 font-medium">Total</th>
                    <th class="text-left px-3 py-2 font-medium">Status</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of recentOrders(); track order._id) {
                    <tr class="border-t hover:bg-gray-50">
                      <td class="px-3 py-2 font-mono text-xs">{{ order.orderNumber }}</td>
                      <td class="px-3 py-2">{{ getUserName(order) }}</td>
                      <td class="px-3 py-2 text-gray-500">{{ order.createdAt | date:'shortDate' }}</td>
                      <td class="px-3 py-2 text-right font-semibold">\${{ order.total.toFixed(2) }}</td>
                      <td class="px-3 py-2">
                        <span [class]="statusClass(order.status) + ' px-2 py-0.5 rounded-full text-xs font-medium'">
                          {{ order.status | titlecase }}
                        </span>
                      </td>
                      <td class="px-3 py-2">
                        <a [routerLink]="['/orders', order._id]" class="text-blue-600 hover:underline text-xs">View</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ShopDashboardComponent implements OnInit {
  private shopService = inject(ShopService);
  private orderService = inject(OrderService);
  private productService = inject(ProductService);

  shop = signal<Shop | null>(null);
  recentOrders = signal<Order[]>([]);
  loading = signal(true);
  totalProducts = signal(0);
  totalOrders = signal(0);
  totalRevenue = signal(0);

  ngOnInit(): void {
    this.shopService.getMyShop().subscribe({
      next: res => {
        this.shop.set(res.shop);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.productService.getMyShopProducts(1, 1).subscribe({
      next: res => this.totalProducts.set(res.total),
    });

    this.orderService.getShopOrders({ limit: 10 }).subscribe({
      next: res => {
        this.recentOrders.set(res.orders);
        this.totalOrders.set(res.total);
        this.totalRevenue.set(res.orders.reduce((sum, o) => sum + o.total, 0));
      },
    });
  }

  getUserName(order: Order): string {
    return (order.user as any)?.name || 'Unknown';
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
}
