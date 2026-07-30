import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <!-- Image -->
      <a [routerLink]="['/products', product._id]" class="block overflow-hidden">
        <img
          [src]="getImage()"
          [alt]="product.name"
          class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          (error)="onImgError($event)"
        />
      </a>

      <!-- Content -->
      <div class="p-3 flex flex-col flex-1">
        <a [routerLink]="['/products', product._id]">
          <h3 class="text-sm font-medium text-gray-900 line-clamp-2 hover:text-amazon-orange transition-colors">
            {{ product.name }}
          </h3>
        </a>

        <!-- Shop -->
        <a [routerLink]="['/shops', product.shop._id]" class="text-xs text-blue-600 hover:underline mt-1">
          {{ product.shop.name }}
        </a>

        <!-- Rating -->
        <div class="flex items-center gap-1 mt-1">
          <span class="text-amazon-orange text-sm">{{ stars }}</span>
          <span class="text-xs text-gray-500">({{ product.totalRatings }})</span>
        </div>

        <div class="mt-auto pt-2">
          <!-- Price -->
          <div class="text-lg font-bold text-gray-900">\${{ product.basePrice.toFixed(2) }}</div>

          <!-- Variants info -->
          @if (product.variants.length > 0) {
            <div class="flex flex-wrap gap-1 mt-1">
              @for (v of visibleVariants; track $index) {
                @if (v.color) {
                  <span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{{ v.color }}</span>
                }
              }
              @if (product.variants.length > 3) {
                <span class="text-xs text-gray-500">+{{ product.variants.length - 3 }} more</span>
              }
            </div>
          }

          <!-- Add to cart -->
          <button
            (click)="addToCart()"
            [disabled]="adding()"
            class="mt-2 w-full btn-primary text-sm py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ adding() ? 'Adding...' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  cartService = inject(CartService);
  auth = inject(AuthService);
  router = inject(Router);
  adding = signal(false);

  get stars(): string {
    const r = Math.round(this.product.rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  get visibleVariants() {
    return this.product.variants.slice(0, 3);
  }

  getImage(): string {
    if (this.product.images && this.product.images.length > 0) {
      const img = this.product.images[0];
      return img.startsWith('/') ? `http://localhost:5000${img}` : img;
    }
    return 'https://placehold.co/400x300?text=No+Image';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image';
  }

  addToCart(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.adding.set(true);
    this.cartService.addToCart(this.product._id).subscribe({
      next: () => this.adding.set(false),
      error: () => this.adding.set(false),
    });
  }
}
