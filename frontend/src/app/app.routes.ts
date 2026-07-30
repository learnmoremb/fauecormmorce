import { Routes } from '@angular/router';
import { authGuard, shopOwnerGuard, driverGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'auth',
    children: [
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'register-shop', loadComponent: () => import('./features/auth/shop-register/shop-register.component').then(m => m.ShopRegisterComponent) },
    ],
  },
  {
    path: 'products',
    children: [
      { path: '', loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: ':id', loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
    ],
  },
  {
    path: 'shops',
    children: [
      { path: '', loadComponent: () => import('./features/shop/shop-list/shop-list.component').then(m => m.ShopListComponent) },
    ],
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent) },
      { path: ':id', loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
    ],
  },
  {
    path: 'shop',
    canActivate: [authGuard, shopOwnerGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/shop/shop-dashboard/shop-dashboard.component').then(m => m.ShopDashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/shop/shop-products/shop-products.component').then(m => m.ShopProductsComponent) },
      { path: 'products/new', loadComponent: () => import('./features/shop/product-form/product-form.component').then(m => m.ProductFormComponent) },
      { path: 'products/:id/edit', loadComponent: () => import('./features/shop/product-form/product-form.component').then(m => m.ProductFormComponent) },
      { path: 'deliveries', loadComponent: () => import('./features/delivery/shop-delivery/shop-delivery.component').then(m => m.ShopDeliveryComponent) },
    ],
  },
  {
    path: 'driver',
    children: [
      { path: 'register', loadComponent: () => import('./features/delivery/driver-register/driver-register.component').then(m => m.DriverRegisterComponent) },
      { path: 'dashboard', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/delivery/driver-dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent) },
    ],
  },
  {
    path: 'track/:orderId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/delivery/delivery-tracking/delivery-tracking.component').then(m => m.DeliveryTrackingComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'shops', loadComponent: () => import('./features/admin/shops/admin-shops.component').then(m => m.AdminShopsComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'drivers', loadComponent: () => import('./features/admin/drivers/admin-drivers.component').then(m => m.AdminDriversComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
