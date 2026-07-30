import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin" class="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
        <h1 class="text-2xl font-bold">User Management</h1>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-6">
        <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="load()" placeholder="Search name or email..." class="input-field w-64"/>
        <select [(ngModel)]="roleFilter" (change)="load()" class="input-field w-auto">
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="shop_owner">Shop Owner</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
        <button (click)="load()" class="btn-secondary px-4 py-2 text-sm">Search</button>
      </div>

      @if (loading()) {
        <div class="bg-white border rounded-lg animate-pulse h-64"></div>
      } @else if (users().length === 0) {
        <div class="text-center py-16 text-gray-400">
          <div class="text-5xl mb-3">👥</div>
          <p>No users found.</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th class="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user._id) {
                <tr class="border-b last:border-0 hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ user.name }}</p>
                    <p class="text-xs text-gray-400">{{ user.email }}</p>
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ user.phone || '—' }}</td>
                  <td class="px-4 py-3">
                    <span [class]="roleBadge(user.role) + ' text-xs px-2 py-0.5 rounded-full font-medium capitalize'">
                      {{ user.role.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ user.createdAt | date:'mediumDate' }}</td>
                  <td class="px-4 py-3">
                    <span [class]="user.isActive ? 'text-green-600 font-medium text-xs' : 'text-red-500 font-medium text-xs'">
                      {{ user.isActive ? '● Active' : '● Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (user.role !== 'admin') {
                      <button
                        (click)="toggle(user)"
                        [disabled]="processing() === user._id"
                        [class]="user.isActive
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50'"
                      >
                        {{ processing() === user._id ? '...' : (user.isActive ? 'Deactivate' : 'Activate') }}
                      </button>
                    } @else {
                      <span class="text-xs text-gray-400">—</span>
                    }
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
  `,
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<User[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);
  currentPage = signal(1);
  pages = signal(1);
  searchQuery = '';
  roleFilter = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminService.getUsers({
      search: this.searchQuery || undefined,
      role: this.roleFilter || undefined,
      page: this.currentPage(),
      limit: 15,
    }).subscribe({
      next: res => { this.users.set(res.users); this.pages.set(res.pages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggle(user: User): void {
    this.processing.set(user._id);
    this.adminService.toggleUser(user._id).subscribe({
      next: res => {
        this.users.update(list => list.map(u => u._id === user._id ? res.user : u));
        this.processing.set(null);
      },
      error: () => this.processing.set(null),
    });
  }

  goToPage(page: number): void { this.currentPage.set(page); this.load(); }

  roleBadge(role: string): string {
    const map: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-700',
      shop_owner: 'bg-orange-100 text-orange-700',
      driver: 'bg-teal-100 text-teal-700',
      admin: 'bg-red-100 text-red-700',
    };
    return map[role] || 'bg-gray-100 text-gray-600';
  }
}
