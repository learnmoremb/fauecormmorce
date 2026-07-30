import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { ShopService } from '../../core/services/shop.service';
import { Product, Shop, CATEGORIES } from '../../core/models';
import { BACKEND_ORIGIN } from '../../core/backend-origin';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  template: `
    <!-- Hero -->
    <section class="relative bg-gradient-to-r from-amazon-navy to-amazon-dark text-white overflow-hidden">
      <div class="max-w-screen-xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          Everything You Need,<br/>
          <span class="text-amazon-yellow">All in One Place</span>
        </h1>
        <p class="text-lg text-gray-300 mb-8 max-w-xl">
          Shop from thousands of sellers, compare prices, and get fast delivery.
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <a routerLink="/products" class="btn-primary text-lg px-8 py-3">Shop Now</a>
          <a routerLink="/auth/register-shop" class="btn-secondary text-lg px-8 py-3">Start Selling</a>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="max-w-screen-xl mx-auto px-4 py-10">
      <h2 class="text-2xl font-bold mb-6">Shop by Category</h2>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
        @for (cat of categories; track cat.value) {
          <a [routerLink]="['/products']" [queryParams]="{category: cat.value}"
             class="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-lg p-3 hover:border-amazon-orange hover:shadow-sm transition-all text-center">
            <span class="text-3xl">{{ cat.icon }}</span>
            <span class="text-xs font-medium text-gray-700">{{ cat.label }}</span>
          </a>
        }
      </div>
    </section>

    <!-- Featured Products -->
    <section class="max-w-screen-xl mx-auto px-4 pb-10">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">New Arrivals</h2>
        <a routerLink="/products" class="text-blue-600 hover:underline text-sm">See all →</a>
      </div>

      @if (loadingProducts()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white rounded-lg border border-gray-200 animate-pulse">
              <div class="h-48 bg-gray-200 rounded-t-lg"></div>
              <div class="p-3 space-y-2">
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                <div class="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (product of products(); track product._id) {
            <app-product-card [product]="product"/>
          }
        </div>
      }
    </section>

    <!-- Featured Shops -->
    <section class="bg-gray-100 py-10">
      <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Featured Shops</h2>
          <a routerLink="/shops" class="text-blue-600 hover:underline text-sm">See all →</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (shop of shops(); track shop._id) {
            <a [routerLink]="['/shops', shop._id]"
               class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              @if (shop.logo) {
                <img [src]="backendOrigin + shop.logo" [alt]="shop.name" class="w-16 h-16 rounded-full object-cover mb-3"/>
              } @else {
                <div class="w-16 h-16 rounded-full bg-amazon-navy flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {{ shop.name[0] }}
                </div>
              }
              <h3 class="font-semibold text-sm">{{ shop.name }}</h3>
              <span class="text-xs text-gray-500 capitalize mt-1">{{ shop.category }}</span>
              <div class="text-amazon-orange text-xs mt-1">
                {{ getStars(shop.rating) }}
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Banner CTA -->
    <section class="bg-amazon-dark text-white py-16 text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to Sell?</h2>
      <p class="text-gray-300 mb-6">Join thousands of sellers and reach millions of customers.</p>
      <a routerLink="/auth/register-shop" class="btn-primary text-lg px-10 py-3">Open Your Shop Today</a>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private shopService = inject(ShopService);
  readonly backendOrigin = BACKEND_ORIGIN;

  products = signal<Product[]>([]);
  shops = signal<Shop[]>([]);
  loadingProducts = signal(true);
  categories = CATEGORIES;

  ngOnInit(): void {
    this.productService.getProducts({ limit: 12, sort: '-createdAt' }).subscribe({
      next: res => { this.products.set(res.products); this.loadingProducts.set(false); },
      error: () => this.loadingProducts.set(false),
    });
    this.shopService.getAllShops({ limit: 8 }).subscribe({
      next: res => this.shops.set(res.shops),
    });
  }

  getStars(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
