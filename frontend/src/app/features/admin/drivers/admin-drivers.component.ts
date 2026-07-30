import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, CreateDriverRequest } from '../../../core/services/admin.service';
import { Driver, VEHICLE_TYPES, VehicleType } from '../../../core/models';

@Component({
  selector: 'app-admin-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <a routerLink="/admin" class="text-gray-400 hover:text-gray-600 text-sm">← Admin</a>
          <h1 class="text-2xl font-bold text-gray-900">Driver Management</h1>
        </div>
        <button (click)="showForm.set(true)"
                class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Create Driver
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-5">
        <input [(ngModel)]="searchTerm" (input)="onSearch()"
               placeholder="Search by name or email..."
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <select [(ngModel)]="filterVerified" (change)="load()"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      <!-- Create Driver Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div class="flex items-center justify-between px-6 py-4 border-b">
              <h2 class="text-lg font-semibold text-gray-900">Create Driver Profile</h2>
              <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
            </div>

            <form (ngSubmit)="submitCreate()" #createForm="ngForm" class="px-6 py-5 space-y-4">
              @if (formError()) {
                <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{{ formError() }}</div>
              }

              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input [(ngModel)]="form.name" name="name" required
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="John Doe" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input [(ngModel)]="form.email" name="email" type="email" required
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="driver@example.com" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input [(ngModel)]="form.phone" name="phone"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="+1 555 000 0000" />
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                  <input [(ngModel)]="form.password" name="password" type="password" required minlength="6"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="Min 6 characters" />
                </div>
              </div>

              <hr class="border-gray-200" />
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Info</p>

              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                  <div class="grid grid-cols-5 gap-2">
                    @for (v of vehicleTypes; track v.value) {
                      <button type="button"
                              (click)="form.vehicleType = v.value"
                              [class]="form.vehicleType === v.value
                                ? 'border-2 border-teal-500 bg-teal-50 rounded-lg p-2 text-center transition-colors'
                                : 'border-2 border-gray-200 rounded-lg p-2 text-center hover:border-gray-300 transition-colors'">
                        <span class="block text-xl">{{ v.icon }}</span>
                        <span class="text-xs text-gray-600">{{ v.label }}</span>
                      </button>
                    }
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                  <input [(ngModel)]="form.vehiclePlate" name="vehiclePlate"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="ABC-1234" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input [(ngModel)]="form.licenseNumber" name="licenseNumber"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                         placeholder="DL-0000000" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button type="button" (click)="closeForm()"
                        class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" [disabled]="submitting() || !form.vehicleType"
                        class="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                  {{ submitting() ? 'Creating...' : 'Create Driver' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="bg-white border border-gray-200 rounded-lg h-16 animate-pulse"></div>
          }
        </div>
      } @else if (drivers().length === 0) {
        <div class="text-center py-16 text-gray-400">
          <p class="text-4xl mb-3">🚗</p>
          <p class="font-medium">No drivers found</p>
          <p class="text-sm mt-1">Create the first driver profile to get started</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-gray-500 font-medium">Driver</th>
                <th class="text-left px-4 py-3 text-gray-500 font-medium">Vehicle</th>
                <th class="text-left px-4 py-3 text-gray-500 font-medium">Stats</th>
                <th class="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th class="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (driver of drivers(); track driver._id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ driver.user?.['name'] || '—' }}</p>
                    <p class="text-gray-400 text-xs">{{ driver.user?.['email'] }}</p>
                    @if (driver.user?.['phone']) {
                      <p class="text-gray-400 text-xs">{{ driver.user?.['phone'] }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5">
                      <span>{{ vehicleIcon(driver.vehicleType) }}</span>
                      <span class="capitalize text-gray-700">{{ driver.vehicleType }}</span>
                    </span>
                    @if (driver.vehiclePlate) {
                      <p class="text-gray-400 text-xs mt-0.5">{{ driver.vehiclePlate }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-gray-700">{{ driver.totalDeliveries }} deliveries</p>
                    <p class="text-gray-400 text-xs">{{ driver.rating | number:'1.1-1' }} ★ avg</p>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-col gap-1">
                      <span [class]="driver.isVerified
                        ? 'inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit'
                        : 'inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full w-fit'">
                        {{ driver.isVerified ? '✓ Verified' : 'Unverified' }}
                      </span>
                      <span [class]="driver.isAvailable
                        ? 'inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full w-fit'
                        : 'inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full w-fit'">
                        {{ driver.isAvailable ? 'Online' : 'Offline' }}
                      </span>
                      <span [class]="driver.isActive
                        ? 'inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full w-fit'
                        : 'inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit'">
                        {{ driver.isActive ? 'Active' : 'Deactivated' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      @if (!driver.isVerified) {
                        <button (click)="verify(driver)"
                                class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                          Verify
                        </button>
                      }
                      <button (click)="toggleActive(driver)"
                              [class]="driver.isActive
                                ? 'text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors'
                                : 'text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors'">
                        {{ driver.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pages() > 1) {
          <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>Page {{ page() }} of {{ pages() }} ({{ total() }} drivers)</span>
            <div class="flex gap-2">
              <button (click)="changePage(page() - 1)" [disabled]="page() === 1"
                      class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Prev
              </button>
              <button (click)="changePage(page() + 1)" [disabled]="page() === pages()"
                      class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AdminDriversComponent implements OnInit {
  private adminService = inject(AdminService);

  drivers = signal<Driver[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pages = signal(1);

  showForm = signal(false);
  submitting = signal(false);
  formError = signal('');

  searchTerm = '';
  filterVerified = '';
  private searchTimeout: any;

  vehicleTypes = VEHICLE_TYPES;

  form: CreateDriverRequest = {
    name: '', email: '', password: '', phone: '',
    vehicleType: '' as VehicleType, vehiclePlate: '', licenseNumber: '',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getDrivers({
      search: this.searchTerm || undefined,
      verified: this.filterVerified || undefined,
      page: this.page(),
    }).subscribe({
      next: res => {
        this.drivers.set(res.drivers);
        this.total.set(res.total);
        this.pages.set(res.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.load(); }, 350);
  }

  changePage(p: number): void {
    this.page.set(p);
    this.load();
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
    this.form = { name: '', email: '', password: '', phone: '', vehicleType: '' as VehicleType, vehiclePlate: '', licenseNumber: '' };
  }

  submitCreate(): void {
    if (!this.form.name || !this.form.email || !this.form.password || !this.form.vehicleType) {
      this.formError.set('Please fill in all required fields and select a vehicle type.');
      return;
    }
    this.submitting.set(true);
    this.formError.set('');

    const payload: CreateDriverRequest = { ...this.form };
    if (!payload.phone) delete payload.phone;
    if (!payload.vehiclePlate) delete payload.vehiclePlate;
    if (!payload.licenseNumber) delete payload.licenseNumber;

    this.adminService.createDriver(payload).subscribe({
      next: res => {
        this.submitting.set(false);
        this.closeForm();
        this.page.set(1);
        this.load();
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.formError.set(err?.error?.message || 'Failed to create driver. Please try again.');
      },
    });
  }

  verify(driver: Driver): void {
    this.adminService.verifyDriver(driver._id).subscribe({
      next: res => {
        this.drivers.update(list => list.map(d => d._id === driver._id ? res.driver : d));
      },
    });
  }

  toggleActive(driver: Driver): void {
    this.adminService.toggleDriver(driver._id).subscribe({
      next: res => {
        this.drivers.update(list => list.map(d => d._id === driver._id ? res.driver : d));
      },
    });
  }

  vehicleIcon(type: VehicleType): string {
    return VEHICLE_TYPES.find(v => v.value === type)?.icon ?? '🚗';
  }
}
