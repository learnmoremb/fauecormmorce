import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DriverService } from '../../../core/services/driver.service';
import { CartService } from '../../../core/services/cart.service';
import { VEHICLE_TYPES } from '../../../core/models';

@Component({
  selector: 'app-driver-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-10">
      <div class="max-w-2xl mx-auto px-4">
        <a routerLink="/" class="text-3xl font-bold mb-6 block text-center">
          <span class="text-amazon-orange">Shop</span><span class="text-amazon-dark">Zone</span>
        </a>

        <div class="bg-white border border-gray-300 rounded-lg p-8">
          <div class="text-center mb-8">
            <div class="text-5xl mb-3">🚗</div>
            <h1 class="text-2xl font-bold">Become a Delivery Driver</h1>
            <p class="text-gray-500 text-sm mt-2">Earn money delivering orders to customers in your area.</p>
          </div>

          @if (errorMsg()) {
            <div class="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">{{ errorMsg() }}</div>
          }

          <!-- Step indicator -->
          <div class="flex gap-4 mb-8">
            @for (s of steps; track s.num) {
              <div [class]="step() >= s.num ? 'flex-1 border-t-4 border-amazon-orange pt-2' : 'flex-1 border-t-4 border-gray-200 pt-2'">
                <span class="text-xs font-semibold text-gray-500">STEP {{ s.num }}</span>
                <p class="text-sm font-medium">{{ s.label }}</p>
              </div>
            }
          </div>

          <!-- Step 1: Account -->
          @if (step() === 1) {
            @if (auth.isLoggedIn()) {
              <div class="bg-green-50 border border-green-300 rounded p-4 mb-6 flex items-center gap-3">
                <span class="text-2xl">✓</span>
                <div>
                  <p class="font-semibold text-green-800">Signed in as {{ auth.currentUser()?.name }}</p>
                  <p class="text-sm text-green-600">You'll register as a driver with this account.</p>
                </div>
              </div>
              <button (click)="step.set(2)" class="btn-primary w-full">Continue →</button>
            } @else {
              <form [formGroup]="accountForm" (ngSubmit)="nextStep()">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Full Name *</label>
                    <input type="text" formControlName="name" class="input-field"/>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Phone *</label>
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
          }

          <!-- Step 2: Vehicle Info -->
          @if (step() === 2) {
            <form [formGroup]="vehicleForm" (ngSubmit)="onSubmit()">
              <div class="mb-6">
                <label class="block text-sm font-medium mb-3">Vehicle Type *</label>
                <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  @for (vt of vehicleTypes; track vt.value) {
                    <label
                      [class]="vehicleForm.get('vehicleType')?.value === vt.value
                        ? 'border-2 border-amazon-orange bg-orange-50 rounded-lg p-3 flex flex-col items-center cursor-pointer'
                        : 'border-2 border-gray-200 hover:border-gray-300 rounded-lg p-3 flex flex-col items-center cursor-pointer'">
                      <input type="radio" formControlName="vehicleType" [value]="vt.value" class="sr-only"/>
                      <span class="text-3xl mb-1">{{ vt.icon }}</span>
                      <span class="text-xs font-medium text-center">{{ vt.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Vehicle Plate</label>
                  <input type="text" formControlName="vehiclePlate" class="input-field" placeholder="e.g. ABC-1234"/>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">License Number</label>
                  <input type="text" formControlName="licenseNumber" class="input-field" placeholder="Driver's license"/>
                </div>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium mb-1">Profile Photo</label>
                <input type="file" accept="image/*" (change)="onPhotoSelected($event)" class="text-sm"/>
                @if (photoPreview()) {
                  <img [src]="photoPreview()!" class="w-24 h-24 rounded-full object-cover mt-2"/>
                }
              </div>

              <!-- Benefits -->
              <div class="bg-amazon-dark text-white rounded-lg p-4 mb-6 text-sm">
                <p class="font-semibold mb-2 text-amazon-yellow">Driver Benefits</p>
                <ul class="space-y-1 text-gray-300">
                  <li>✓ Flexible working hours</li>
                  <li>✓ Earn delivery fees on every order</li>
                  <li>✓ Track your earnings in real-time</li>
                  <li>✓ Build your rating and reputation</li>
                </ul>
              </div>

              <div class="flex justify-between">
                <button type="button" (click)="step.set(1)" class="btn-secondary px-6">← Back</button>
                <button type="submit" [disabled]="saving()" class="btn-primary px-8 disabled:opacity-60">
                  {{ saving() ? 'Registering...' : '🚀 Start Delivering' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class DriverRegisterComponent {
  auth = inject(AuthService);
  private driverService = inject(DriverService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  step = signal(1);
  saving = signal(false);
  errorMsg = signal('');
  photoPreview = signal<string | null>(null);
  photoFile: File | null = null;
  vehicleTypes = VEHICLE_TYPES;

  steps = [
    { num: 1, label: 'Account' },
    { num: 2, label: 'Vehicle' },
  ];

  accountForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  vehicleForm = this.fb.group({
    vehicleType: ['car', Validators.required],
    vehiclePlate: [''],
    licenseNumber: [''],
  });

  nextStep(): void {
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    this.step.set(2);
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile = file;
    this.photoPreview.set(URL.createObjectURL(file));
  }

  onSubmit(): void {
    if (this.vehicleForm.invalid) { this.vehicleForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    const doRegister = () => {
      const fd = new FormData();
      const v = this.vehicleForm.value;
      fd.append('vehicleType', v.vehicleType!);
      if (v.vehiclePlate) fd.append('vehiclePlate', v.vehiclePlate);
      if (v.licenseNumber) fd.append('licenseNumber', v.licenseNumber);
      if (this.photoFile) fd.append('photo', this.photoFile);

      this.driverService.registerDriver(fd).subscribe({
        next: () => this.router.navigate(['/driver/dashboard']),
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Registration failed');
          this.saving.set(false);
        },
      });
    };

    if (!this.auth.isLoggedIn()) {
      const a = this.accountForm.value as any;
      this.auth.register({ ...a, role: 'driver' }).subscribe({
        next: () => { this.cartService.loadCart(); doRegister(); },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Account creation failed');
          this.saving.set(false);
          this.step.set(1);
        },
      });
    } else {
      doRegister();
    }
  }
}
