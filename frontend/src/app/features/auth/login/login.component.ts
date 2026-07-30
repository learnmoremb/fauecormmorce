import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
      <a routerLink="/" class="text-3xl font-bold mb-6">
        <span class="text-amazon-orange">Shop</span><span class="text-amazon-dark">Zone</span>
      </a>

      <div class="bg-white border border-gray-300 rounded-lg p-8 w-full max-w-sm">
        <h1 class="text-2xl font-semibold mb-6">Sign In</h1>

        @if (errorMsg()) {
          <div class="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">
            {{ errorMsg() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Email</label>
            <input type="email" formControlName="email" class="input-field"
              [class.border-red-500]="form.get('email')?.invalid && form.get('email')?.touched"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-red-500 text-xs mt-1">Valid email required</p>
            }
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Password</label>
            <input type="password" formControlName="password" class="input-field"
              [class.border-red-500]="form.get('password')?.invalid && form.get('password')?.touched"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-red-500 text-xs mt-1">Password required</p>
            }
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary w-full justify-center disabled:opacity-60">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="relative my-4">
          <hr class="border-gray-300"/>
          <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">New to ShopZone?</span>
        </div>

        <a routerLink="/auth/register" class="block w-full text-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded py-2 text-sm font-medium transition-colors">
          Create your account
        </a>

        <p class="text-center text-xs text-gray-500 mt-4">
          Want to sell? <a routerLink="/auth/register-shop" class="text-blue-600 hover:underline">Register as a Shop Owner</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.cart.loadCart();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Login failed');
        this.loading.set(false);
      },
    });
  }
}
