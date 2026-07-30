import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CATEGORIES } from '../../../core/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/shop/products" class="text-gray-500 hover:text-gray-700">← Back</a>
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h1>
      </div>

      @if (errorMsg()) {
        <div class="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">{{ errorMsg() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Basic Info -->
        <div class="card mb-4">
          <h2 class="font-semibold mb-4">Basic Information</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Product Name *</label>
              <input type="text" formControlName="name" class="input-field" placeholder="e.g. Wireless Bluetooth Headphones"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Category *</label>
                <select formControlName="category" class="input-field">
                  <option value="">Select category</option>
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Base Price ($) *</label>
                <input type="number" formControlName="basePrice" min="0" step="0.01" class="input-field" placeholder="0.00"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <textarea formControlName="description" rows="4" class="input-field resize-none" placeholder="Describe your product..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <input type="text" formControlName="tags" class="input-field" placeholder="wireless, bluetooth, audio"/>
            </div>
          </div>
        </div>

        <!-- Images -->
        <div class="card mb-4">
          <h2 class="font-semibold mb-4">Product Images</h2>
          <input type="file" accept="image/*" multiple (change)="onImagesSelected($event)" class="text-sm"/>
          @if (previewImages().length > 0) {
            <div class="flex gap-2 mt-3 flex-wrap">
              @for (img of previewImages(); track $index) {
                <div class="relative">
                  <img [src]="img" class="w-20 h-20 object-cover rounded border"/>
                  <button type="button" (click)="removeImage($index)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Variants -->
        <div class="card mb-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold">Variants (Colors, Sizes)</h2>
            <button type="button" (click)="addVariant()" class="text-sm text-blue-600 hover:underline">+ Add Variant</button>
          </div>

          @if (variants.length === 0) {
            <p class="text-sm text-gray-400 text-center py-4">No variants. Add variants if your product comes in different colors or sizes.</p>
          }

          <div formArrayName="variants" class="space-y-4">
            @for (variant of variants.controls; track $index) {
              <div [formGroupName]="$index" class="border border-gray-200 rounded-lg p-4 relative">
                <button type="button" (click)="removeVariant($index)" class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xl">×</button>
                <p class="text-sm font-medium mb-3 text-gray-600">Variant {{ $index + 1 }}</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="text-xs text-gray-500">Color</label>
                    <input type="text" formControlName="color" class="input-field text-sm" placeholder="e.g. Red"/>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">Size</label>
                    <input type="text" formControlName="size" class="input-field text-sm" placeholder="e.g. XL"/>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">Material</label>
                    <input type="text" formControlName="material" class="input-field text-sm" placeholder="e.g. Cotton"/>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">Price ($) *</label>
                    <input type="number" formControlName="price" min="0" step="0.01" class="input-field text-sm"/>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">Stock *</label>
                    <input type="number" formControlName="stock" min="0" class="input-field text-sm"/>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">SKU</label>
                    <input type="text" formControlName="sku" class="input-field text-sm" placeholder="e.g. RED-XL-001"/>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Attributes -->
        <div class="card mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold">Additional Attributes</h2>
            <button type="button" (click)="addAttribute()" class="text-sm text-blue-600 hover:underline">+ Add</button>
          </div>
          <div formArrayName="attributes" class="space-y-2">
            @for (attr of attributeControls.controls; track $index) {
              <div [formGroupName]="$index" class="flex gap-2 items-center">
                <input type="text" formControlName="key" class="input-field text-sm" placeholder="e.g. Brand"/>
                <input type="text" formControlName="value" class="input-field text-sm" placeholder="e.g. Samsung"/>
                <button type="button" (click)="removeAttribute($index)" class="text-red-400 hover:text-red-600 shrink-0">×</button>
              </div>
            }
          </div>
        </div>

        <div class="flex gap-3 justify-end">
          <a routerLink="/shop/products" class="btn-secondary px-6">Cancel</a>
          <button type="submit" [disabled]="saving()" class="btn-primary px-8 disabled:opacity-60">
            {{ saving() ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  isEdit = false;
  productId = '';
  saving = signal(false);
  errorMsg = signal('');
  previewImages = signal<string[]>([]);
  selectedFiles: File[] = [];
  categories = CATEGORIES;

  form = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    tags: [''],
    variants: this.fb.array([]),
    attributes: this.fb.array([]),
  });

  get variants(): FormArray { return this.form.get('variants') as FormArray; }
  get attributeControls(): FormArray { return this.form.get('attributes') as FormArray; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.productId = id;
      this.productService.getProductById(id).subscribe({
        next: res => {
          const p = res.product;
          this.form.patchValue({
            name: p.name,
            category: p.category,
            basePrice: p.basePrice,
            description: p.description,
            tags: p.tags.join(', '),
          });
          p.variants.forEach(v => this.addVariant(v));
          if (p.attributes) {
            Object.entries(p.attributes).forEach(([key, value]) => this.addAttribute({ key, value }));
          }
        },
      });
    }
  }

  addVariant(data?: any): void {
    this.variants.push(this.fb.group({
      color: [data?.color || ''],
      size: [data?.size || ''],
      material: [data?.material || ''],
      price: [data?.price ?? 0, [Validators.required, Validators.min(0)]],
      stock: [data?.stock ?? 0, [Validators.required, Validators.min(0)]],
      sku: [data?.sku || ''],
    }));
  }

  removeVariant(index: number): void { this.variants.removeAt(index); }

  addAttribute(data?: any): void {
    this.attributeControls.push(this.fb.group({ key: [data?.key || ''], value: [data?.value || ''] }));
  }

  removeAttribute(index: number): void { this.attributeControls.removeAt(index); }

  onImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    this.selectedFiles = Array.from(files);
    this.previewImages.set(this.selectedFiles.map(f => URL.createObjectURL(f)));
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    const val = this.form.value;
    const fd = new FormData();
    fd.append('name', val.name!);
    fd.append('category', val.category!);
    fd.append('basePrice', String(val.basePrice));
    if (val.description) fd.append('description', val.description);
    if (val.tags) fd.append('tags', JSON.stringify(val.tags.split(',').map((t: string) => t.trim()).filter(Boolean)));

    const variants = (val.variants as any[]).filter(v => v.price !== null);
    if (variants.length) fd.append('variants', JSON.stringify(variants));

    const attrsArray = val.attributes as any[];
    if (attrsArray && attrsArray.length > 0) {
      const attrsObj: Record<string, string> = {};
      attrsArray.forEach(a => { if (a.key) attrsObj[a.key] = a.value; });
      fd.append('attributes', JSON.stringify(attrsObj));
    }

    this.selectedFiles.forEach(f => fd.append('images', f));

    const request = this.isEdit
      ? this.productService.updateProduct(this.productId, fd)
      : this.productService.createProduct(fd);

    request.subscribe({
      next: () => this.router.navigate(['/shop/products']),
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to save product');
        this.saving.set(false);
      },
    });
  }
}
