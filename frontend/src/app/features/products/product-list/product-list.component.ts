import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../core/services/product.service';
import { Product, CATEGORIES } from '../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <!-- Breadcrumb -->
      <nav class="text-sm text-gray-500 mb-4">
        <a routerLink="/" class="hover:text-amazon-orange">Home</a> /
        <span class="text-gray-900 font-medium">Products</span>
        @if (activeCategory()) { / <span class="text-gray-900 capitalize">{{ activeCategory() }}</span> }
      </nav>

      <div class="flex gap-6">
        <!-- Sidebar filters -->
        <aside class="hidden md:block w-56 shrink-0">
          <div class="card">
            <h3 class="font-semibold mb-3">Filter</h3>

            <div class="mb-4">
              <h4 class="text-sm font-medium mb-2">Category</h4>
              <div class="space-y-1">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="cat" [value]="''" [(ngModel)]="selectedCategory" (change)="applyFilters()" class="accent-amazon-orange"/>
                  <span>All</span>
                </label>
                @for (cat of categories; track cat.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="cat" [value]="cat.value" [(ngModel)]="selectedCategory" (change)="applyFilters()" class="accent-amazon-orange"/>
                    <span>{{ cat.icon }} {{ cat.label }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="mb-4">
              <h4 class="text-sm font-medium mb-2">Price Range</h4>
              <div class="flex gap-2">
                <input type="number" [(ngModel)]="minPrice" placeholder="Min" class="input-field w-20 text-xs py-1"/>
                <input type="number" [(ngModel)]="maxPrice" placeholder="Max" class="input-field w-20 text-xs py-1"/>
              </div>
              <button (click)="applyFilters()" class="mt-2 text-xs text-blue-600 hover:underline">Apply</button>
            </div>
          </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1">
          <!-- Top bar -->
          <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
            <div>
              @if (searchQuery()) {
                <p class="text-sm text-gray-600">Results for "<strong>{{ searchQuery() }}</strong>"</p>
              }
              <p class="text-sm text-gray-500">{{ total() }} products found</p>
            </div>
            <div class="flex gap-2 items-center">
              <label class="text-sm text-gray-600">Sort:</label>
              <select [(ngModel)]="sortBy" (change)="applyFilters()" class="input-field text-sm py-1 w-auto">
                <option value="-createdAt">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          @if (loading()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="bg-white rounded-lg border animate-pulse">
                  <div class="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div class="p-3 space-y-2">
                    <div class="h-4 bg-gray-200 rounded"></div>
                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (products().length === 0) {
            <div class="text-center py-20">
              <div class="text-6xl mb-4">🔍</div>
              <h3 class="text-xl font-semibold mb-2">No products found</h3>
              <p class="text-gray-500">Try different filters or search terms.</p>
              <button (click)="resetFilters()" class="btn-primary mt-4">Clear Filters</button>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (product of products(); track product._id) {
                <app-product-card [product]="product"/>
              }
            </div>

            <!-- Pagination -->
            @if (pages() > 1) {
              <div class="flex justify-center gap-2 mt-8">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="px-3 py-1 border rounded disabled:opacity-40">←</button>
                @for (p of pageArray(); track p) {
                  <button (click)="goToPage(p)" [class]="p === currentPage() ? 'px-3 py-1 bg-amazon-orange text-white rounded' : 'px-3 py-1 border rounded hover:bg-gray-100'">{{ p }}</button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === pages()" class="px-3 py-1 border rounded disabled:opacity-40">→</button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  loading = signal(true);
  total = signal(0);
  currentPage = signal(1);
  pages = signal(1);
  pageArray = signal<number[]>([]);

  searchQuery = signal('');
  activeCategory = signal('');
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = '-createdAt';
  categories = CATEGORIES;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.activeCategory.set(params['category'] || '');
      this.selectedCategory = params['category'] || '';
      this.currentPage.set(Number(params['page']) || 1);
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts({
      search: this.searchQuery() || undefined,
      category: this.activeCategory() || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      page: this.currentPage(),
      limit: 12,
      sort: this.sortBy,
    }).subscribe({
      next: res => {
        this.products.set(res.products);
        this.total.set(res.total);
        this.pages.set(res.pages);
        this.pageArray.set(Array.from({ length: res.pages }, (_, i) => i + 1));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.router.navigate(['/products'], {
      queryParams: {
        search: this.searchQuery() || undefined,
        category: this.selectedCategory || undefined,
        page: 1,
      },
    });
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.router.navigate(['/products']);
  }

  goToPage(page: number): void {
    this.router.navigate(['/products'], {
      queryParams: { ...this.route.snapshot.queryParams, page },
    });
  }
}
