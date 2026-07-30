import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductVariant } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      @if (loading()) {
        <div class="grid md:grid-cols-2 gap-8 animate-pulse">
          <div class="h-96 bg-gray-200 rounded-lg"></div>
          <div class="space-y-4">
            <div class="h-8 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      } @else if (product()) {
        <!-- Breadcrumb -->
        <nav class="text-sm text-gray-500 mb-6">
          <a routerLink="/" class="hover:text-amazon-orange">Home</a> /
          <a routerLink="/products" class="hover:text-amazon-orange">Products</a> /
          <span class="text-gray-900">{{ product()!.name }}</span>
        </nav>

        <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
          <!-- Images -->
          <div>
            <div class="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden mb-3">
              <img
                [src]="selectedImage()"
                [alt]="product()!.name"
                class="w-full h-full object-contain"
                (error)="onImgError($event)"
              />
            </div>
            @if (allImages().length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-1">
                @for (img of allImages(); track $index) {
                  <img
                    [src]="img"
                    (click)="selectedImage.set(img)"
                    class="w-16 h-16 object-cover border-2 rounded cursor-pointer shrink-0"
                    [class.border-amazon-orange]="selectedImage() === img"
                    [class.border-gray-200]="selectedImage() !== img"
                  />
                }
              </div>
            }
          </div>

          <!-- Info -->
          <div>
            <h1 class="text-2xl font-bold mb-2">{{ product()!.name }}</h1>

            <!-- Rating -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-amazon-orange">{{ getStars(product()!.rating) }}</span>
              <span class="text-sm text-blue-600">{{ product()!.totalRatings }} ratings</span>
              <span class="text-gray-300">|</span>
              <span class="text-sm text-gray-500">{{ product()!.totalSold }} sold</span>
            </div>

            <hr class="mb-4"/>

            <!-- Price -->
            <div class="mb-4">
              <span class="text-3xl font-bold text-red-600">
                \${{ (selectedVariant()?.price ?? product()!.basePrice).toFixed(2) }}
              </span>
              @if (selectedVariant() && selectedVariant()!.price !== product()!.basePrice) {
                <span class="text-gray-400 text-sm line-through ml-2">\${{ product()!.basePrice.toFixed(2) }}</span>
              }
            </div>

            <!-- Shop -->
            <div class="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded">
              <span class="text-sm text-gray-500">Sold by:</span>
              <a [routerLink]="['/shops', product()!.shop._id]" class="text-blue-600 hover:underline font-medium text-sm">
                {{ product()!.shop.name }}
              </a>
              @if (product()!.shop['isVerified']) {
                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>
              }
            </div>

            <!-- Variants -->
            @if (product()!.variants.length > 0) {
              <!-- Colors -->
              @if (uniqueColors().length > 0) {
                <div class="mb-4">
                  <span class="text-sm font-semibold">Color: </span>
                  <span class="text-sm text-gray-600">{{ selectedColor() || 'Select' }}</span>
                  <div class="flex gap-2 mt-2 flex-wrap">
                    @for (color of uniqueColors(); track color) {
                      <button
                        (click)="selectColor(color)"
                        [style.background-color]="isKnownColor(color) ? color : ''"
                        [class]="selectedColor() === color ? 'border-2 border-amazon-orange ring-2 ring-amazon-orange ring-offset-1 px-3 py-1 rounded text-sm' : 'border-2 border-gray-300 px-3 py-1 rounded text-sm hover:border-gray-500'"
                        [class.text-white]="isKnownColor(color)"
                      >
                        {{ color }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Sizes -->
              @if (uniqueSizes().length > 0) {
                <div class="mb-4">
                  <span class="text-sm font-semibold">Size: </span>
                  <span class="text-sm text-gray-600">{{ selectedSize() || 'Select' }}</span>
                  <div class="flex gap-2 mt-2 flex-wrap">
                    @for (size of uniqueSizes(); track size) {
                      <button
                        (click)="selectSize(size)"
                        [class]="selectedSize() === size ? 'border-2 border-amazon-orange px-3 py-1 rounded text-sm font-semibold' : 'border-2 border-gray-300 px-3 py-1 rounded text-sm hover:border-gray-500'"
                      >{{ size }}</button>
                    }
                  </div>
                </div>
              }
            }

            <!-- Stock -->
            @if (selectedVariant()) {
              <div class="mb-4 text-sm">
                @if (selectedVariant()!.stock > 0) {
                  <span class="text-green-600 font-medium">✓ In Stock ({{ selectedVariant()!.stock }} available)</span>
                } @else {
                  <span class="text-red-600 font-medium">✗ Out of Stock</span>
                }
              </div>
            }

            <!-- Quantity -->
            <div class="flex items-center gap-3 mb-4">
              <label class="text-sm font-semibold">Qty:</label>
              <div class="flex items-center border border-gray-300 rounded">
                <button (click)="quantity.set(Math.max(1, quantity() - 1))" class="px-3 py-1 hover:bg-gray-100 text-lg">−</button>
                <span class="px-4 py-1 border-x border-gray-300">{{ quantity() }}</span>
                <button (click)="quantity.set(quantity() + 1)" class="px-3 py-1 hover:bg-gray-100 text-lg">+</button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-3 max-w-sm">
              <button (click)="addToCart()" [disabled]="adding()" class="btn-primary text-center py-3 disabled:opacity-60 text-base">
                🛒 {{ adding() ? 'Adding...' : 'Add to Cart' }}
              </button>
            </div>

            <!-- Description -->
            @if (product()!.description) {
              <div class="mt-6 border-t pt-4">
                <h3 class="font-semibold mb-2">About this item</h3>
                <p class="text-sm text-gray-600 leading-relaxed">{{ product()!.description }}</p>
              </div>
            }

            <!-- Attributes -->
            @if (product()!.attributes && objectKeys(product()!.attributes!).length > 0) {
              <div class="mt-4 border-t pt-4">
                <h3 class="font-semibold mb-2">Specifications</h3>
                <table class="text-sm w-full">
                  @for (key of objectKeys(product()!.attributes!); track key) {
                    <tr class="border-b last:border-0">
                      <td class="py-1.5 pr-4 text-gray-500 font-medium w-1/3">{{ key }}</td>
                      <td class="py-1.5 text-gray-800">{{ getAttrValue(key) }}</td>
                    </tr>
                  }
                </table>
              </div>
            }

            <!-- Tags -->
            @if (product()!.tags.length > 0) {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (tag of product()!.tags; track tag) {
                  <a [routerLink]="['/products']" [queryParams]="{search: tag}"
                     class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-600">
                    #{{ tag }}
                  </a>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">😕</div>
          <h3 class="text-xl font-semibold">Product not found</h3>
          <a routerLink="/products" class="btn-primary mt-4 inline-block">Browse Products</a>
        </div>
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private auth = inject(AuthService);

  product = signal<Product | null>(null);
  loading = signal(true);
  adding = signal(false);
  selectedImage = signal('');
  selectedVariant = signal<ProductVariant | null>(null);
  selectedColor = signal('');
  selectedSize = signal('');
  quantity = signal(1);
  Math = Math;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productService.getProductById(id).subscribe({
      next: res => {
        this.product.set(res.product);
        this.loading.set(false);
        const imgs = this.allImages();
        if (imgs.length > 0) this.selectedImage.set(imgs[0]);
      },
      error: () => this.loading.set(false),
    });
  }

  get allImages(): () => string[] {
    return () => {
      const p = this.product();
      if (!p) return [];
      const imgs = [...p.images];
      p.variants.forEach(v => v.images.forEach(i => { if (!imgs.includes(i)) imgs.push(i); }));
      return imgs;
    };
  }

  get uniqueColors(): () => string[] {
    return () => [...new Set(this.product()?.variants.map(v => v.color).filter(Boolean) as string[])];
  }

  get uniqueSizes(): () => string[] {
    return () => [...new Set(this.product()?.variants.map(v => v.size).filter(Boolean) as string[])];
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
    this.matchVariant();
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
    this.matchVariant();
  }

  matchVariant(): void {
    const p = this.product();
    if (!p) return;
    const match = p.variants.find(v =>
      (!this.selectedColor() || v.color === this.selectedColor()) &&
      (!this.selectedSize() || v.size === this.selectedSize())
    );
    this.selectedVariant.set(match || null);
    if (match?.images.length) {
      this.selectedImage.set(match.images[0]);
    }
  }

  isKnownColor(color: string): boolean {
    const css = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    return css.includes(color.toLowerCase());
  }

  getStars(rating: number): string {
    const r = Math.round(rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj || {});
  }

  getAttrValue(key: string): string {
    return (this.product()?.attributes as any)?.[key] ?? '';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
  }

  addToCart(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.adding.set(true);
    this.cartService.addToCart(
      this.product()!._id,
      this.selectedVariant()?._id,
      this.quantity()
    ).subscribe({
      next: () => this.adding.set(false),
      error: () => this.adding.set(false),
    });
  }
}
