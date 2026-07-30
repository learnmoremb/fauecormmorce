export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'shop_owner' | 'driver' | 'admin';
  avatar?: string;
  address?: Address;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: number[]; // [lng, lat]
}

export interface Shop {
  _id: string;
  owner: Partial<User>;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  category: ProductCategory;
  address?: Address;
  phone?: string;
  email?: string;
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  _id: string;
  color?: string;
  size?: string;
  material?: string;
  price: number;
  stock: number;
  sku?: string;
  images: string[];
}

export interface Product {
  _id: string;
  shop: Partial<Shop>;
  name: string;
  description?: string;
  category: ProductCategory;
  basePrice: number;
  variants: ProductVariant[];
  tags: string[];
  images: string[];
  rating: number;
  totalRatings: number;
  totalSold: number;
  isActive: boolean;
  attributes?: Record<string, string>;
  createdAt: string;
}

export interface CartItem {
  _id: string;
  product: Partial<Product>;
  shop: Partial<Shop>;
  variantId?: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  _id: string;
  product: Partial<Product>;
  shop: Partial<Shop>;
  name: string;
  image?: string;
  variantId?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: Partial<User>;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface ShippingAddress {
  name: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: number[]; // [lng, lat]
}

export type ProductCategory = 'electronics' | 'fashion' | 'home' | 'sports' | 'beauty' | 'food' | 'books' | 'toys' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'shop_owner' | 'driver';
}

export type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'van' | 'truck';
export type DeliveryStatus =
  | 'pending' | 'assigned' | 'accepted' | 'picked_up'
  | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Driver {
  _id: string;
  user: Partial<User>;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  licenseNumber?: string;
  photo?: string;
  location: GeoPoint;
  isAvailable: boolean;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  totalDeliveries: number;
  currentDelivery?: string | null;
  distanceKm?: number;
  createdAt: string;
}

export interface DeliveryAddress {
  name?: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: number[];
}

export interface Delivery {
  _id: string;
  order: Partial<Order>;
  shop: Partial<Shop>;
  customer: Partial<User>;
  driver?: Partial<Driver> | null;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  status: DeliveryStatus;
  currentDriverLocation?: { coordinates: number[]; updatedAt: string };
  driverLocationHistory?: { coordinates: number[]; recordedAt: string }[];
  deliveryFee: number;
  estimatedDistance: number;
  estimatedDuration: number;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  notes?: string;
  customerRating?: number;
  customerReview?: string;
  createdAt: string;
}

export const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'truck', label: 'Truck', icon: '🚛' },
];

export interface AuthResponse {
  user: User;
  token: string;
}

export const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'home', label: 'Home & Living', icon: '🏠' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'beauty', label: 'Beauty', icon: '💄' },
  { value: 'food', label: 'Food & Grocery', icon: '🛒' },
  { value: 'books', label: 'Books', icon: '📚' },
  { value: 'toys', label: 'Toys', icon: '🧸' },
  { value: 'other', label: 'Other', icon: '📦' },
];
