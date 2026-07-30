import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models';
import { BACKEND_ORIGIN } from '../../core/backend-origin';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">Shopping Cart</h1>

      @if (!auth.isLoggedIn()) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">🔒</div>
          <h3 class="text-xl font-semibold mb-2">Please sign in to view your cart</h3>
          <a routerLink="/auth/login" class="btn-primary inline-block mt-4">Sign In</a>
        </div>
      } @else if (!cart.cart() || cart.cart()!.items.length === 0) {
        <div class="text-center py-20">
          <div class="text-6xl mb-4">🛒</div>
          <h3 class="text-xl font-semibold mb-2">Your cart is empty</h3>
          <p class="text-gray-500 mb-4">Add some items to get started!</p>
          <a routerLink="/products" class="btn-primary inline-block">Continue Shopping</a>
        </div>
      } @else {
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Items -->
          <div class="flex-1">
            <!-- Group by shop -->
            @for (group of groupedItems(); track group.shopId) {
              <div class="card mb-4">
                <div class="flex items-center gap-2 mb-4 pb-2 border-b">
                  <span class="text-sm font-semibold text-gray-700">Sold by:</span>
                  <a [routerLink]="['/shops', group.shopId]" class="text-blue-600 hover:underline text-sm font-semibold">{{ group.shopName }}</a>
                </div>

                @for (item of group.items; track item._id) {
                  <div class="flex gap-4 py-3 border-b last:border-0">
                    <!-- Image -->
                    <a [routerLink]="['/products', item.product._id]" class="shrink-0">
                      <img
                        [src]="getItemImage(item)"
                        [alt]="item.product.name"
                        class="w-24 h-24 object-cover rounded"
                        (error)="onImgError($event)"
                      />
                    </a>

                    <!-- Details -->
                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/products', item.product._id]" class="font-medium text-sm hover:text-amazon-orange line-clamp-2">
                        {{ item.product.name }}
                      </a>
                      @if (item.color) { <p class="text-xs text-gray-500 mt-1">Color: {{ item.color }}</p> }
                      @if (item.size) { <p class="text-xs text-gray-500">Size: {{ item.size }}</p> }

                      <div class="flex items-center gap-4 mt-2">
                        <!-- Quantity -->
                        <div class="flex items-center border border-gray-300 rounded text-sm">
                          <button (click)="updateQty(item, item.quantity - 1)" class="px-2 py-0.5 hover:bg-gray-100">−</button>
                          <span class="px-3 py-0.5 border-x">{{ item.quantity }}</span>
                          <button (click)="updateQty(item, item.quantity + 1)" class="px-2 py-0.5 hover:bg-gray-100">+</button>
                        </div>

                        <button (click)="removeItem(item._id)" class="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>

                    <!-- Price -->
                    <div class="shrink-0 font-bold text-right">
                      \${{ (item.price * item.quantity).toFixed(2) }}
                      <p class="text-xs text-gray-400 font-normal">\${{ item.price.toFixed(2) }} each</p>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="flex gap-3">
              <button (click)="clearCart()" class="text-sm text-red-500 hover:underline">Clear cart</button>
              <a routerLink="/products" class="text-sm text-blue-600 hover:underline">Continue shopping</a>
            </div>
          </div>

          <!-- Summary -->
          <div class="lg:w-80 shrink-0">
            <div class="card sticky top-4">
              <h2 class="text-lg font-semibold mb-4">Order Summary</h2>

              <div class="space-y-2 text-sm mb-4">
                <div class="flex justify-between">
                  <span class="text-gray-600">Subtotal ({{ cart.itemCount() }} items)</span>
                  <span>\${{ cart.total().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Shipping</span>
                  <span class="text-green-600">{{ cart.total() > 50 ? 'FREE' : '\$5.99' }}</span>
                </div>
                @if (cart.total() <= 50) {
                  <p class="text-xs text-blue-600">Add \${{ (50 - cart.total()).toFixed(2) }} more for free shipping!</p>
                }
              </div>

              <hr class="mb-4"/>

              <div class="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>\${{ (cart.total() + (cart.total() > 50 ? 0 : 5.99)).toFixed(2) }}</span>
              </div>

              <a routerLink="/checkout" class="btn-primary block text-center py-3 text-base">
                Proceed to Checkout ({{ cart.itemCount() }} items)
              </a>

              <div class="mt-4 text-xs text-gray-500 text-center space-y-1">
                <p>🔒 Secure checkout</p>
                <p>📦 Free returns on eligible items</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent implements OnInit {
  cart = inject(CartService);
  auth = inject(AuthService);

  ngOnInit(): void {
    this.cart.loadCart();
  }

  get groupedItems(): () => { shopId: string; shopName: string; items: CartItem[] }[] {
    return () => {
      const items = this.cart.cart()?.items || [];
      const map = new Map<string, { shopId: string; shopName: string; items: CartItem[] }>();
      items.forEach(item => {
        const sid = item.shop._id as string;
        if (!map.has(sid)) map.set(sid, { shopId: sid, shopName: item.shop.name || '', items: [] });
        map.get(sid)!.items.push(item);
      });
      return [...map.values()];
    };
  }

  getItemImage(item: CartItem): string {
    const imgs = (item.product as any).images;
    if (imgs && imgs.length > 0) {
      const img = imgs[0];
      return img.startsWith('/') ? `${BACKEND_ORIGIN}${img}` : img;
    }
    return 'https://placehold.co/100x100?text=Item';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Item';
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty <= 0) this.removeItem(item._id);
    else this.cart.updateItem(item._id, qty).subscribe();
  }

  removeItem(id: string): void {
    this.cart.removeItem(id).subscribe();
  }

  clearCart(): void {
    this.cart.clearCart().subscribe();
  }
}
