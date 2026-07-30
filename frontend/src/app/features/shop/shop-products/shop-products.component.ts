import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">My Products</h1>
        <a routerLink="/shop/products/new" class="btn-primary text-sm px-4 py-2">+ Add Product</a>
      </div>

      @if (loading()) {
        <div class="card animate-pulse h-40"></div>
      } @else if (products().length === 0) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">📦</div>
          <h3 class="text-xl font-semibold mb-2">No products yet</h3>
          <a routerLink="/shop/products/new" class="btn-primary inline-block mt-4">Add Your First Product</a>
        </div>
      } @else {
        <div class="card overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left px-3 py-2 font-medium">Product</th>
                <th class="text-left px-3 py-2 font-medium">Category</th>
                <th class="text-right px-3 py-2 font-medium">Price</th>
                <th class="text-right px-3 py-2 font-medium">Sold</th>
                <th class="text-left px-3 py-2 font-medium">Status</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              @for (p of products(); track p._id) {
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-3">
                      <img [src]="getImg(p)" class="w-10 h-10 object-cover rounded" (error)="onImgError($event)"/>
                      <span class="font-medium line-clamp-1">{{ p.name }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 capitalize text-gray-500">{{ p.category }}</td>
                  <td class="px-3 py-2 text-right font-semibold">\${{ p.basePrice.toFixed(2) }}</td>
                  <td class="px-3 py-2 text-right text-gray-500">{{ p.totalSold }}</td>
                  <td class="px-3 py-2">
                    <span [class]="p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ p.isActive ? 'Active' : 'Hidden' }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex gap-2">
                      <a [routerLink]="['/shop/products', p._id, 'edit']" class="text-blue-600 hover:underline text-xs">Edit</a>
                      <button (click)="toggleActive(p)" class="text-gray-500 hover:text-gray-700 text-xs">
                        {{ p.isActive ? 'Hide' : 'Show' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pages() > 1) {
          <div class="flex justify-center gap-2 mt-6">
            <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() === 1" class="px-3 py-1 border rounded disabled:opacity-40">←</button>
            <span class="px-3 py-1 text-sm text-gray-600">Page {{ currentPage() }} of {{ pages() }}</span>
            <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() === pages()" class="px-3 py-1 border rounded disabled:opacity-40">→</button>
          </div>
        }
      }
    </div>
  `,
})
export class ShopProductsComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pages = signal(1);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getMyShopProducts(this.currentPage(), 15).subscribe({
      next: res => {
        this.products.set(res.products);
        this.pages.set(res.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  getImg(p: Product): string {
    if (p.images && p.images.length > 0) {
      const img = p.images[0];
      return img;
    }
    return 'https://placehold.co/40x40?text=P';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=P';
  }

  toggleActive(product: Product): void {
    const fd = new FormData();
    fd.append('isActive', String(!product.isActive));
    this.productService.updateProduct(product._id, fd).subscribe({
      next: res => {
        const updated = this.products().map(p => p._id === product._id ? res.product : p);
        this.products.set(updated);
      },
    });
  }
}
