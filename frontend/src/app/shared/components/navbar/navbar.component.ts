import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="bg-amazon-dark text-white">
      <!-- Top bar -->
      <div class="flex items-center gap-2 px-4 py-2 max-w-screen-xl mx-auto">
        <!-- Logo -->
        <a routerLink="/" class="text-white text-2xl font-bold mr-4 shrink-0">
          <span class="text-amazon-orange">Shop</span>Zone
        </a>

        <!-- Deliver to -->
        @if (auth.isLoggedIn()) {
          <div class="hidden md:flex flex-col text-xs shrink-0">
            <span class="text-gray-400">Deliver to</span>
            <span class="font-bold text-sm">Your Location</span>
          </div>
        }

        <!-- Search bar -->
        <div class="flex flex-1 mx-2">
          <select class="bg-gray-200 text-gray-700 text-sm px-2 rounded-l border-r border-gray-300 hidden md:block" [(ngModel)]="searchCategory">
            <option value="">All</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home</option>
            <option value="sports">Sports</option>
            <option value="beauty">Beauty</option>
            <option value="books">Books</option>
          </select>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="onSearch()"
            placeholder="Search products..."
            class="flex-1 px-3 py-2 text-gray-900 text-sm focus:outline-none min-w-0"
          />
          <button (click)="onSearch()" class="bg-amazon-orange hover:bg-amazon-yellow px-4 rounded-r transition-colors">
            <svg class="w-5 h-5 text-amazon-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
        </div>

        <!-- Account -->
        <div class="relative shrink-0">
          <button (click)="toggleMenu()" class="flex flex-col text-xs hover:border hover:border-white px-2 py-1 rounded">
            <span class="text-gray-400">{{ auth.isLoggedIn() ? 'Hello, ' + getFirstName() : 'Hello, Sign in' }}</span>
            <span class="font-bold text-sm">Account ▾</span>
          </button>
          @if (menuOpen()) {
            <div class="absolute right-0 top-full mt-1 w-48 bg-white text-gray-800 rounded shadow-lg z-50 py-1">
              @if (!auth.isLoggedIn()) {
                <a routerLink="/auth/login" (click)="closeMenu()" class="block px-4 py-2 hover:bg-gray-100">Sign In</a>
                <a routerLink="/auth/register" (click)="closeMenu()" class="block px-4 py-2 hover:bg-gray-100">Create Account</a>
              } @else {
                @if (auth.isAdmin()) {
                  <a routerLink="/admin" (click)="closeMenu()" class="block px-4 py-2 hover:bg-red-50 font-semibold text-red-700">🛡️ Admin Panel</a>
                  <hr class="my-1"/>
                }
                @if (auth.isShopOwner()) {
                  <a routerLink="/shop/dashboard" (click)="closeMenu()" class="block px-4 py-2 hover:bg-gray-100 font-semibold">My Shop</a>
                }
                <a routerLink="/orders" (click)="closeMenu()" class="block px-4 py-2 hover:bg-gray-100">My Orders</a>
                <hr class="my-1"/>
                <button (click)="logout()" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Sign Out</button>
              }
            </div>
          }
        </div>

        <!-- Orders link -->
        <a routerLink="/orders" class="hidden md:flex flex-col text-xs hover:border hover:border-white px-2 py-1 rounded shrink-0">
          <span class="text-gray-400">Returns &</span>
          <span class="font-bold text-sm">Orders</span>
        </a>

        <!-- Cart -->
        <a routerLink="/cart" class="flex items-end gap-1 hover:border hover:border-white px-2 py-1 rounded relative shrink-0">
          <div class="relative">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            @if (cart.itemCount() > 0) {
              <span class="absolute -top-2 -right-2 bg-amazon-orange text-amazon-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{ cart.itemCount() }}
              </span>
            }
          </div>
          <span class="font-bold text-sm">Cart</span>
        </a>
      </div>

      <!-- Nav bar -->
      <nav class="bg-amazon-navy text-sm px-4 py-1">
        <div class="flex gap-4 max-w-screen-xl mx-auto overflow-x-auto">
          <a routerLink="/" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap">Home</a>
          <a routerLink="/products" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap">All Products</a>
          <a routerLink="/shops" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap">All Shops</a>
          @for (cat of categories; track cat.value) {
            <a [routerLink]="['/products']" [queryParams]="{category: cat.value}" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap">
              {{ cat.label }}
            </a>
          }
          @if (auth.isShopOwner()) {
            <a routerLink="/shop/dashboard" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap text-amazon-yellow font-semibold">
              Seller Hub
            </a>
            <a routerLink="/shop/deliveries" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap text-amazon-yellow font-semibold">
              🚚 Deliveries
            </a>
          }
          @if (isDriver()) {
            <a routerLink="/driver/dashboard" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap text-green-400 font-semibold">
              🚗 Driver Hub
            </a>
          }
          @if (!auth.isLoggedIn()) {
            <a routerLink="/driver/register" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap">
              Become a Driver
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" class="hover:border hover:border-white px-2 py-1 rounded whitespace-nowrap text-red-400 font-semibold">
              🛡️ Admin Panel
            </a>
          }
        </div>
      </nav>
    </header>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  router = inject(Router);

  searchQuery = '';
  searchCategory = '';
  menuOpen = signal(false);

  categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home', label: 'Home' },
    { value: 'sports', label: 'Sports' },
    { value: 'beauty', label: 'Beauty' },
  ];

  get isDriver(): () => boolean {
    return () => this.auth.currentUser()?.role === 'driver';
  }

  getFirstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] ?? '';
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onSearch(): void {
    this.router.navigate(['/products'], {
      queryParams: {
        search: this.searchQuery || undefined,
        category: this.searchCategory || undefined,
      },
    });
    this.searchQuery = '';
  }

  logout(): void {
    this.auth.logout();
    this.cart.clearLocal();
    this.closeMenu();
  }
}
