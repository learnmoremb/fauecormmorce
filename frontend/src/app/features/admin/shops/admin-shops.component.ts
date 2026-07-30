import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Shop } from '../../../core/models';

@Component({
  selector: 'app-admin-shops',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin" class="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
        <h1 class="text-2xl font-bold">Shop Management</h1>
        @if (pendingCount() > 0) {
          <span class="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {{ pendingCount() }} pending
          </span>
        }
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-1 border-b border-gray-200 mb-6">
        @for (tab of tabs; track tab.key) {
          <button
            (click)="setTab(tab.key)"
            [class]="activeTab() === tab.key
              ? 'px-4 py-2 text-sm font-semibold text-amazon-orange border-b-2 border-amazon-orange -mb-px'
              : 'px-4 py-2 text-sm text-gray-500 hover:text-gray-700'"
          >{{ tab.label }}</button>
        }
      </div>

      <!-- Search -->
      <div class="flex gap-3 mb-5">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (keyup.enter)="load()"
          placeholder="Search by shop name..."
          class="input-field w-72"
        />
        <button (click)="load()" class="btn-secondary px-4 py-2 text-sm">Search</button>
        @if (searchQuery) {
          <button (click)="searchQuery = ''; load()" class="text-sm text-gray-500 hover:underline">Clear</button>
        }
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="bg-white border border-gray-200 rounded-lg animate-pulse h-64"></div>
      } @else if (shops().length === 0) {
        <div class="text-center py-20">
          <div class="text-5xl mb-3">🏪</div>
          <p class="text-gray-500">No shops found.</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Shop</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th class="px-4 py-3 font-semibold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (shop of shops(); track shop._id) {
                <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors" [class.bg-yellow-50]="!shop.isVerified && shop.isActive">
                  <!-- Shop -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (shop.logo) {
                        <img [src]="'http://localhost:5000' + shop.logo" class="w-10 h-10 rounded-lg object-cover border"/>
                      } @else {
                        <div class="w-10 h-10 rounded-lg bg-amazon-navy flex items-center justify-center text-white font-bold">
                          {{ shop.name[0] }}
                        </div>
                      }
                      <div>
                        <p class="font-semibold text-gray-900">{{ shop.name }}</p>
                        @if (shop.address?.city) {
                          <p class="text-xs text-gray-400">📍 {{ shop.address!.city }}</p>
                        }
                      </div>
                    </div>
                  </td>

                  <!-- Owner -->
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ ownerName(shop) }}</p>
                    <p class="text-xs text-gray-400">{{ ownerEmail(shop) }}</p>
                  </td>

                  <!-- Category -->
                  <td class="px-4 py-3">
                    <span class="capitalize text-gray-600">{{ shop.category }}</span>
                  </td>

                  <!-- Date -->
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {{ shop.createdAt | date:'mediumDate' }}
                  </td>

                  <!-- Status badges -->
                  <td class="px-4 py-3">
                    <div class="flex flex-col gap-1">
                      <span [class]="shop.isVerified
                        ? 'inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium w-fit'
                        : 'inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium w-fit'">
                        {{ shop.isVerified ? '✓ Verified' : '⏳ Pending' }}
                      </span>
                      <span [class]="shop.isActive
                        ? 'inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium w-fit'
                        : 'inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium w-fit'">
                        {{ shop.isActive ? '● Active' : '● Inactive' }}
                      </span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    <div class="flex gap-2 justify-center flex-wrap">
                      @if (!shop.isVerified && shop.isActive) {
                        <button
                          (click)="verify(shop)"
                          [disabled]="processing() === shop._id"
                          class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                        >
                          {{ processing() === shop._id ? '...' : '✓ Verify' }}
                        </button>
                        <button
                          (click)="openRejectModal(shop)"
                          [disabled]="processing() === shop._id"
                          class="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                        >
                          ✗ Reject
                        </button>
                      }
                      @if (shop.isVerified) {
                        <button
                          (click)="toggle(shop)"
                          [disabled]="processing() === shop._id"
                          [class]="shop.isActive
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50'
                            : 'bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50'"
                        >
                          {{ shop.isActive ? 'Deactivate' : 'Activate' }}
                        </button>
                      }
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
            <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="px-3 py-1 border rounded disabled:opacity-40 text-sm">←</button>
            <span class="px-3 py-1 text-sm text-gray-600">Page {{ currentPage() }} of {{ pages() }}</span>
            <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === pages()" class="px-3 py-1 border rounded disabled:opacity-40 text-sm">→</button>
          </div>
        }
      }
    </div>

    <!-- Reject modal -->
    @if (rejectTarget()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-bold mb-1">Reject Shop</h2>
          <p class="text-sm text-gray-500 mb-4">
            You are about to reject <strong>{{ rejectTarget()!.name }}</strong>. This will deactivate the shop.
          </p>
          <textarea
            [(ngModel)]="rejectReason"
            rows="3"
            placeholder="Reason for rejection (optional — visible in logs)"
            class="input-field resize-none mb-4"
          ></textarea>
          <div class="flex gap-3 justify-end">
            <button (click)="rejectTarget.set(null); rejectReason = ''" class="btn-secondary px-5 py-2 text-sm">Cancel</button>
            <button (click)="confirmReject()" [disabled]="processing() !== null" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-60">
              {{ processing() ? 'Rejecting...' : 'Confirm Reject' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminShopsComponent implements OnInit {
  private adminService = inject(AdminService);

  shops = signal<Shop[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);
  currentPage = signal(1);
  pages = signal(1);
  total = signal(0);
  pendingCount = signal(0);
  activeTab = signal<'all' | 'pending' | 'verified'>('pending');
  searchQuery = '';
  rejectTarget = signal<Shop | null>(null);
  rejectReason = '';

  tabs = [
    { key: 'pending' as const, label: 'Pending Verification' },
    { key: 'verified' as const, label: 'Verified' },
    { key: 'all' as const, label: 'All Shops' },
  ];

  ngOnInit(): void {
    this.load();
    this.loadPendingCount();
  }

  loadPendingCount(): void {
    this.adminService.getShops({ verified: 'false', limit: 1 }).subscribe({
      next: res => this.pendingCount.set(res.total),
    });
  }

  setTab(tab: 'all' | 'pending' | 'verified'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), limit: 15 };
    if (this.activeTab() === 'pending') params.verified = 'false';
    if (this.activeTab() === 'verified') params.verified = 'true';
    if (this.searchQuery) params.search = this.searchQuery;

    this.adminService.getShops(params).subscribe({
      next: res => {
        this.shops.set(res.shops);
        this.total.set(res.total);
        this.pages.set(res.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  verify(shop: Shop): void {
    this.processing.set(shop._id);
    this.adminService.verifyShop(shop._id).subscribe({
      next: res => {
        this.updateShop(res.shop);
        this.processing.set(null);
        this.loadPendingCount();
        if (this.activeTab() === 'pending') this.load();
      },
      error: () => this.processing.set(null),
    });
  }

  openRejectModal(shop: Shop): void {
    this.rejectTarget.set(shop);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const shop = this.rejectTarget();
    if (!shop) return;
    this.processing.set(shop._id);
    this.adminService.rejectShop(shop._id, this.rejectReason || undefined).subscribe({
      next: res => {
        this.updateShop(res.shop);
        this.rejectTarget.set(null);
        this.rejectReason = '';
        this.processing.set(null);
        this.loadPendingCount();
        if (this.activeTab() === 'pending') this.load();
      },
      error: () => this.processing.set(null),
    });
  }

  toggle(shop: Shop): void {
    this.processing.set(shop._id);
    this.adminService.toggleShop(shop._id).subscribe({
      next: res => { this.updateShop(res.shop); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  private updateShop(updated: Shop): void {
    this.shops.update(list => list.map(s => s._id === updated._id ? updated : s));
  }

  ownerName(shop: Shop): string { return (shop.owner as any)?.name ?? '—'; }
  ownerEmail(shop: Shop): string { return (shop.owner as any)?.email ?? '—'; }
}
