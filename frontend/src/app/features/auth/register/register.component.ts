import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
      <a routerLink="/" class="text-3xl font-bold mb-6">
        <span class="text-amazon-orange">Shop</span><span class="text-amazon-dark">Zone</span>
      </a>

      <div class="bg-white border border-gray-300 rounded-lg p-8 w-full max-w-sm">
        <h1 class="text-2xl font-semibold mb-6">Create Account</h1>

        @if (errorMsg()) {
          <div class="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">{{ errorMsg() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" formControlName="name" class="input-field"/>
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <p class="text-red-500 text-xs mt-1">Name is required</p>
            }
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Email</label>
            <input type="email" formControlName="email" class="input-field"/>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-red-500 text-xs mt-1">Valid email required</p>
            }
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Phone (optional)</label>
            <input type="tel" formControlName="phone" class="input-field"/>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Password</label>
            <input type="password" formControlName="password" class="input-field"/>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-red-500 text-xs mt-1">Minimum 6 characters</p>
            }
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary w-full disabled:opacity-60">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="text-xs text-gray-500 text-center mt-4">
          Already have an account? <a routerLink="/auth/login" class="text-blue-600 hover:underline">Sign in</a>
        </p>
        <p class="text-xs text-gray-500 text-center mt-2">
          Want to sell? <a routerLink="/auth/register-shop" class="text-blue-600 hover:underline">Register as Shop Owner</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.register({ ...this.form.value as any, role: 'customer' }).subscribe({
      next: () => {
        this.cart.loadCart();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
