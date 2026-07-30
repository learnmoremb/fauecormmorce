import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../models';

export interface ProductQuery {
  search?: string;
  category?: string;
  shop?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  getProducts(query?: ProductQuery): Observable<ProductListResponse> {
    return this.api.get<ProductListResponse>('/products', query as any);
  }

  getProductById(id: string): Observable<{ product: Product }> {
    return this.api.get<{ product: Product }>(`/products/${id}`);
  }

  getMyShopProducts(page = 1, limit = 12): Observable<ProductListResponse> {
    return this.api.get<ProductListResponse>('/products/my-products', { page, limit });
  }

  createProduct(formData: FormData): Observable<{ product: Product }> {
    return this.api.postFormData<{ product: Product }>('/products', formData);
  }

  updateProduct(id: string, formData: FormData): Observable<{ product: Product }> {
    return this.api.putFormData<{ product: Product }>(`/products/${id}`, formData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.api.delete(`/products/${id}`);
  }
}
