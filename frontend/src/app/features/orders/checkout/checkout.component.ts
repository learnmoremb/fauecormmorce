import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddressMapPickerComponent, PickedLocation } from '../../../shared/components/address-map-picker/address-map-picker.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, AddressMapPickerComponent],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">Checkout</h1>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left: Form -->
        <div class="flex-1">
          <!-- Step 1: Shipping -->
          <div class="card mb-4">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-amazon-orange text-white text-sm flex items-center justify-center">1</span>
              Shipping Address
            </h2>

            <div class="mb-4">
              <p class="text-sm font-medium mb-2">📍 Pin your delivery location on the map</p>
              <app-address-map-picker (locationPicked)="onLocationPicked($event)"/>
              @if (pickedCoordinates()) {
                <p class="text-xs text-green-600 mt-1">✓ Exact location captured — your driver will see this pin.</p>
              } @else {
                <p class="text-xs text-amber-600 mt-1">⚠ Search or tap the map above so your driver knows exactly where to go.</p>
              }
            </div>

            <form [formGroup]="shippingForm">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Full Name *</label>
                  <input type="text" formControlName="name" class="input-field"
                    [class.border-red-500]="shippingForm.get('name')?.invalid && shippingForm.get('name')?.touched"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" formControlName="phone" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Country *</label>
                  <input type="text" formControlName="country" class="input-field"
                    [class.border-red-500]="shippingForm.get('country')?.invalid && shippingForm.get('country')?.touched"/>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Street Address *</label>
                  <input type="text" formControlName="street" class="input-field"
                    [class.border-red-500]="shippingForm.get('street')?.invalid && shippingForm.get('street')?.touched"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">City *</label>
                  <input type="text" formControlName="city" class="input-field"
                    [class.border-red-500]="shippingForm.get('city')?.invalid && shippingForm.get('city')?.touched"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">State / Province</label>
                  <input type="text" formControlName="state" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">ZIP / Postal Code</label>
                  <input type="text" formControlName="zipCode" class="input-field"/>
                </div>
              </div>
            </form>
          </div>

          <!-- Step 2: Payment (Mock) -->
          <div class="card mb-4">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-amazon-orange text-white text-sm flex items-center justify-center">2</span>
              Payment Method
            </h2>
            <div class="border-2 border-amazon-orange rounded-lg p-4 bg-orange-50 flex items-center gap-3">
              <span class="text-2xl">💳</span>
              <div>
                <p class="font-medium">Demo Payment</p>
                <p class="text-sm text-gray-500">No real payment required — this is a mock checkout.</p>
              </div>
              <span class="ml-auto text-green-600 font-medium text-sm">✓ Selected</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="card">
            <h2 class="text-lg font-semibold mb-3">Order Notes (optional)</h2>
            <textarea [(ngModel)]="orderNotes" rows="3" class="input-field resize-none" placeholder="Special instructions for delivery..."></textarea>
          </div>
        </div>

        <!-- Right: Summary -->
        <div class="lg:w-80 shrink-0">
          <div class="card sticky top-4">
            <h2 class="text-lg font-semibold mb-4">Order Summary</h2>

            <!-- Items -->
            <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              @for (item of cart.cart()?.items; track item._id) {
                <div class="flex gap-2 text-sm">
                  <img [src]="getItemImage(item)" class="w-12 h-12 object-cover rounded" (error)="onImgError($event)"/>
                  <div class="flex-1 min-w-0">
                    <p class="line-clamp-1 font-medium">{{ item.product.name }}</p>
                    @if (item.color) { <p class="text-xs text-gray-500">{{ item.color }}{{ item.size ? ' / ' + item.size : '' }}</p> }
                    <p class="text-xs text-gray-500">x{{ item.quantity }}</p>
                  </div>
                  <span class="font-medium shrink-0">\${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              }
            </div>

            <hr class="mb-3"/>

            <div class="space-y-1.5 text-sm mb-4">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span>\${{ cart.total().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Shipping</span>
                <span class="text-green-600">{{ cart.total() > 50 ? 'FREE' : '\$5.99' }}</span>
              </div>
            </div>

            <hr class="mb-4"/>

            <div class="flex justify-between font-bold text-xl mb-6">
              <span>Total</span>
              <span>\${{ orderTotal().toFixed(2) }}</span>
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-300 text-red-700 text-sm rounded px-3 py-2 mb-4">{{ errorMsg() }}</div>
            }

            <button (click)="placeOrder()" [disabled]="placing()" class="btn-primary w-full py-3 text-base disabled:opacity-60">
              {{ placing() ? 'Placing Order...' : '🛍️ Place Order' }}
            </button>

            <p class="text-xs text-gray-500 text-center mt-3">
              By placing your order, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  cart = inject(CartService);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  placing = signal(false);
  errorMsg = signal('');
  orderNotes = '';
  pickedCoordinates = signal<[number, number] | null>(null);

  shippingForm = this.fb.group({
    name: [this.auth.currentUser()?.name || '', Validators.required],
    phone: [this.auth.currentUser()?.phone || ''],
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: [''],
    country: ['', Validators.required],
    zipCode: [''],
  });

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    if (!this.cart.cart() || this.cart.cart()!.items.length === 0) {
      this.cart.loadCart();
    }
  }

  get orderTotal(): () => number {
    return () => this.cart.total() + (this.cart.total() > 50 ? 0 : 5.99);
  }

  getItemImage(item: any): string {
    const imgs = item.product?.images;
    if (imgs && imgs.length > 0) {
      const img = imgs[0];
      return img;
    }
    return 'https://placehold.co/50x50?text=Item';
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/50x50?text=Item';
  }

  onLocationPicked(loc: PickedLocation): void {
    this.pickedCoordinates.set([loc.lng, loc.lat]);
    this.shippingForm.patchValue({
      street: loc.address.street || this.shippingForm.value.street,
      city: loc.address.city || this.shippingForm.value.city,
      state: loc.address.state ?? this.shippingForm.value.state,
      country: loc.address.country || this.shippingForm.value.country,
      zipCode: loc.address.zipCode ?? this.shippingForm.value.zipCode,
    });
  }

  placeOrder(): void {
    if (this.shippingForm.invalid) { this.shippingForm.markAllAsTouched(); return; }
    if (!this.cart.cart() || this.cart.cart()!.items.length === 0) {
      this.errorMsg.set('Your cart is empty');
      return;
    }

    this.placing.set(true);
    this.errorMsg.set('');

    const shippingAddress = { ...this.shippingForm.value, coordinates: this.pickedCoordinates() ?? undefined };

    this.orderService.createOrder(shippingAddress as any, this.orderNotes || undefined).subscribe({
      next: (res) => {
        this.cart.clearLocal();
        this.router.navigate(['/orders', res.order._id], { queryParams: { success: '1' } });
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to place order');
        this.placing.set(false);
      },
    });
  }
}
