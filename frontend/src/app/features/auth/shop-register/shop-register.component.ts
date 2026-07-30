import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ShopService } from '../../../core/services/shop.service';
import { CartService } from '../../../core/services/cart.service';
import { CATEGORIES } from '../../../core/models';
import { AddressMapPickerComponent, PickedLocation } from '../../../shared/components/address-map-picker/address-map-picker.component';

@Component({
  selector: 'app-shop-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AddressMapPickerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-10">
      <div class="max-w-2xl mx-auto px-4">
        <a routerLink="/" class="text-3xl font-bold mb-6 block text-center">
          <span class="text-amazon-orange">Shop</span><span class="text-amazon-dark">Zone</span>
        </a>

        <div class="bg-white border border-gray-300 rounded-lg p-8">
          <h1 class="text-2xl font-semibold mb-2">Start Selling on ShopZone</h1>
          <p class="text-gray-500 text-sm mb-6">Create your shop and start reaching millions of customers.</p>

          @if (errorMsg()) {
            <div class="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">{{ errorMsg() }}</div>
          }

          <!-- Step indicator -->
          <div class="flex gap-4 mb-8">
            <div [class]="step() >= 1 ? 'flex-1 border-t-4 border-amazon-orange pt-2' : 'flex-1 border-t-4 border-gray-200 pt-2'">
              <span class="text-xs font-semibold text-gray-500">STEP 1</span>
              <p class="text-sm font-medium">Account</p>
            </div>
            <div [class]="step() >= 2 ? 'flex-1 border-t-4 border-amazon-orange pt-2' : 'flex-1 border-t-4 border-gray-200 pt-2'">
              <span class="text-xs font-semibold text-gray-500">STEP 2</span>
              <p class="text-sm font-medium">Shop Info</p>
            </div>
          </div>

          <!-- Step 1: Account -->
          @if (step() === 1) {
            <form [formGroup]="accountForm" (ngSubmit)="nextStep()">
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Full Name *</label>
                  <input type="text" formControlName="name" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" formControlName="phone" class="input-field"/>
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Email *</label>
                <input type="email" formControlName="email" class="input-field"/>
              </div>
              <div class="mb-6">
                <label class="block text-sm font-medium mb-1">Password *</label>
                <input type="password" formControlName="password" class="input-field"/>
              </div>
              <div class="flex justify-between items-center">
                <a routerLink="/auth/login" class="text-sm text-blue-600 hover:underline">Already have an account?</a>
                <button type="submit" class="btn-primary px-8">Next →</button>
              </div>
            </form>
          }

          <!-- Step 2: Shop Info -->
          @if (step() === 2) {
            <form [formGroup]="shopForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Shop Name *</label>
                  <input type="text" formControlName="name" class="input-field"/>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Category *</label>
                  <select formControlName="category" class="input-field">
                    <option value="">Select a category</option>
                    @for (cat of categories; track cat.value) {
                      <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                    }
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Description</label>
                  <textarea formControlName="description" rows="3" class="input-field resize-none" placeholder="Tell customers about your shop..."></textarea>
                </div>
              </div>

              <div class="mb-4">
                <p class="text-sm font-medium mb-2">📍 Pin your shop's pickup location on the map</p>
                <app-address-map-picker (locationPicked)="onLocationPicked($event)"/>
                @if (pickedCoordinates()) {
                  <p class="text-xs text-green-600 mt-1">✓ Pickup location captured — drivers will be routed here.</p>
                } @else {
                  <p class="text-xs text-amber-600 mt-1">⚠ Search or tap the map above so drivers can find your shop.</p>
                }
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium mb-1">Street Address</label>
                  <input type="text" formControlName="street" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">City</label>
                  <input type="text" formControlName="city" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">State / Province</label>
                  <input type="text" formControlName="state" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Country</label>
                  <input type="text" formControlName="country" class="input-field"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">ZIP / Postal Code</label>
                  <input type="text" formControlName="zipCode" class="input-field"/>
                </div>
              </div>

              <div class="flex justify-between">
                <button type="button" (click)="step.set(1)" class="btn-secondary px-6">← Back</button>
                <button type="submit" [disabled]="loading()" class="btn-primary px-8 disabled:opacity-60">
                  {{ loading() ? 'Creating shop...' : 'Launch My Shop 🚀' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class ShopRegisterComponent {
  private auth = inject(AuthService);
  private shopService = inject(ShopService);
  private cart = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  step = signal(1);
  loading = signal(false);
  errorMsg = signal('');
  categories = CATEGORIES;
  pickedCoordinates = signal<[number, number] | null>(null);

  accountForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  shopForm = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
    street: [''],
    city: [''],
    state: [''],
    country: [''],
    zipCode: [''],
  });

  nextStep(): void {
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    this.step.set(2);
  }

  onLocationPicked(loc: PickedLocation): void {
    this.pickedCoordinates.set([loc.lng, loc.lat]);
    this.shopForm.patchValue({
      street: loc.address.street || this.shopForm.value.street,
      city: loc.address.city || this.shopForm.value.city,
      state: loc.address.state ?? this.shopForm.value.state,
      country: loc.address.country || this.shopForm.value.country,
      zipCode: loc.address.zipCode ?? this.shopForm.value.zipCode,
    });
  }

  onSubmit(): void {
    if (this.shopForm.invalid) { this.shopForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    const { name, email, phone, password } = this.accountForm.value as any;
    this.auth.register({ name, email, phone, password, role: 'shop_owner' }).subscribe({
      next: () => {
        const fd = new FormData();
        const shopVal = this.shopForm.value as any;
        fd.append('name', shopVal.name);
        fd.append('category', shopVal.category);
        if (shopVal.description) fd.append('description', shopVal.description);
        const { street, city, state, country, zipCode } = shopVal;
        if (street || city || state || country || zipCode || this.pickedCoordinates()) {
          fd.append('address', JSON.stringify({
            street: street || undefined,
            city: city || undefined,
            state: state || undefined,
            country: country || undefined,
            zipCode: zipCode || undefined,
            coordinates: this.pickedCoordinates() ?? undefined,
          }));
        }
        this.shopService.createShop(fd).subscribe({
          next: () => {
            this.cart.loadCart();
            this.router.navigate(['/shop/dashboard']);
          },
          error: (err) => {
            this.errorMsg.set(err.error?.message || 'Failed to create shop');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
        this.step.set(1);
      },
    });
  }
}
