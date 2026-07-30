import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p class="text-sm text-gray-500 mt-1">ShopZone management dashboard</p>
        </div>
        <span class="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Admin</span>
      </div>

      <!-- Stats grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          @for (i of [1,2,3,4,5,6,7]; track i) {
            <div class="bg-white border border-gray-200 rounded-lg p-4 animate-pulse h-24"></div>
          }
        </div>
      } @else if (stats()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-3xl font-bold text-blue-600">{{ stats()!.users }}</p>
            <p class="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-3xl font-bold text-amazon-orange">{{ stats()!.shops }}</p>
            <p class="text-sm text-gray-500 mt-1">Active Shops</p>
          </div>
          <div [class]="stats()!.pendingShops > 0 ? 'bg-yellow-50 border-yellow-300 border rounded-lg p-4' : 'bg-white border border-gray-200 rounded-lg p-4'">
            <div class="flex items-center justify-between">
              <p class="text-3xl font-bold text-yellow-600">{{ stats()!.pendingShops }}</p>
              @if (stats()!.pendingShops > 0) {
                <span class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span>
              }
            </div>
            <p class="text-sm text-gray-500 mt-1">Pending Shops</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-3xl font-bold text-indigo-600">{{ stats()!.products }}</p>
            <p class="text-sm text-gray-500 mt-1">Products</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-3xl font-bold text-purple-600">{{ stats()!.orders }}</p>
            <p class="text-sm text-gray-500 mt-1">Orders</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-3xl font-bold text-teal-600">{{ stats()!.drivers }}</p>
            <p class="text-sm text-gray-500 mt-1">Drivers</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 md:col-span-2">
            <p class="text-3xl font-bold text-green-700">\${{ stats()!.totalRevenue.toFixed(2) }}</p>
            <p class="text-sm text-gray-500 mt-1">Total Revenue (paid orders)</p>
          </div>
        </div>
      }

      <!-- Quick actions -->
      <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a routerLink="/admin/shops"
           class="bg-white border-2 border-yellow-300 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <span class="text-4xl">🏪</span>
          <div>
            <p class="font-bold text-gray-900">Shop Verification</p>
            <p class="text-sm text-gray-500 mt-0.5">
              @if (stats()?.pendingShops) {
                <span class="text-yellow-600 font-medium">{{ stats()!.pendingShops }} pending</span>
              } @else {
                Review & approve shops
              }
            </p>
          </div>
          @if (stats()?.pendingShops && stats()!.pendingShops > 0) {
            <span class="ml-auto bg-yellow-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {{ stats()!.pendingShops }}
            </span>
          }
        </a>

        <a routerLink="/admin/users"
           class="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <span class="text-4xl">👥</span>
          <div>
            <p class="font-bold text-gray-900">User Management</p>
            <p class="text-sm text-gray-500 mt-0.5">View and manage accounts</p>
          </div>
        </a>

        <a routerLink="/admin/orders"
           class="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <span class="text-4xl">📦</span>
          <div>
            <p class="font-bold text-gray-900">All Orders</p>
            <p class="text-sm text-gray-500 mt-0.5">Monitor platform orders</p>
          </div>
        </a>

        <a routerLink="/admin/drivers"
           class="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <span class="text-4xl">🚗</span>
          <div>
            <p class="font-bold text-gray-900">Driver Management</p>
            <p class="text-sm text-gray-500 mt-0.5">
              @if (stats()?.drivers) {
                {{ stats()!.drivers }} driver{{ stats()!.drivers === 1 ? '' : 's' }} registered
              } @else {
                Create &amp; manage drivers
              }
            </p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  stats = signal<AdminStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: res => { this.stats.set(res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
