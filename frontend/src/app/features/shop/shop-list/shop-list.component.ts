import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../core/services/shop.service';
import { Shop, CATEGORIES } from '../../../core/models';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">All Shops</h1>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-6">
        <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Search shops..." class="input-field w-56"/>
        <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="input-field w-auto">
          <option value="">All Categories</option>
          @for (cat of categories; track cat.value) {
            <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="bg-white rounded-lg border animate-pulse h-48"></div>
          }
        </div>
      } @else if (shops().length === 0) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">🏪</div>
          <h3 class="text-xl font-semibold">No shops found</h3>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (shop of shops(); track shop._id) {
            <a [routerLink]="['/shops', shop._id]" class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              @if (shop.logo) {
                <img [src]="'http://localhost:5000' + shop.logo" [alt]="shop.name" class="w-16 h-16 rounded-full object-cover mb-3"/>
              } @else {
                <div class="w-16 h-16 rounded-full bg-amazon-navy flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {{ shop.name[0] }}
                </div>
              }
              <h3 class="font-semibold text-sm">{{ shop.name }}</h3>
              <span class="text-xs text-gray-500 capitalize mt-1">{{ shop.category }}</span>
              <div class="text-amazon-orange text-xs mt-1">{{ getStars(shop.rating) }}</div>
              @if (shop.address?.city) {
                <p class="text-xs text-gray-400 mt-1">📍 {{ shop.address!.city }}</p>
              }
              @if (shop.isVerified) {
                <span class="text-xs text-green-600 mt-1">✓ Verified</span>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ShopListComponent implements OnInit {
  private shopService = inject(ShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  shops = signal<Shop[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedCategory = '';
  categories = CATEGORIES;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.loadShops();
    });
  }

  loadShops(): void {
    this.shopService.getAllShops({
      category: this.selectedCategory || undefined,
      search: this.searchQuery || undefined,
    }).subscribe({
      next: res => { this.shops.set(res.shops); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.loadShops();
  }

  getStars(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
