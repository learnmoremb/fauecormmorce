import { Component, ElementRef, EventEmitter, Input, OnDestroy, AfterViewInit, Output, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';

export interface PickedAddressParts {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface PickedLocation {
  lat: number;
  lng: number;
  address: PickedAddressParts;
  displayName: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

// Leaflet's default marker images are referenced via relative paths that break once
// bundled — point them at the matching CDN copies instead of shipping/aliasing assets.
const ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
let iconsPatched = false;
function patchDefaultIcon(): void {
  if (iconsPatched) return;
  iconsPatched = true;
  // Leaflet's IconDefault._getIconUrl always prefixes the configured *Url options
  // with an auto-detected imagePath (read from leaflet.css's href) — setting it to
  // '' stops it from mangling our absolute CDN URLs into "<origin>/media/https://...".
  (L.Icon.Default as any).imagePath = '';
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: ICON_BASE + 'marker-icon-2x.png',
    iconUrl: ICON_BASE + 'marker-icon.png',
    shadowUrl: ICON_BASE + 'marker-shadow.png',
  });
}

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-2">
      <div class="relative">
        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            (focus)="showResults.set(true)"
            placeholder="🔍 Search for an address..."
            class="input-field flex-1"
          />
          <button type="button" (click)="useMyLocation()" [disabled]="locating()"
            class="btn-secondary px-3 text-sm whitespace-nowrap disabled:opacity-60">
            {{ locating() ? '📍 Locating…' : '📍 My Location' }}
          </button>
        </div>

        @if (showResults() && (results().length > 0 || searching())) {
          <div class="absolute z-[1000] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            @if (searching()) {
              <p class="px-3 py-2 text-sm text-gray-400">Searching…</p>
            } @else {
              @for (r of results(); track r.display_name) {
                <button type="button" (click)="selectResult(r)"
                  class="block w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b border-gray-100 last:border-0">
                  {{ r.display_name }}
                </button>
              }
            }
          </div>
        }
      </div>

      <div #mapEl class="w-full h-72 rounded-lg border border-gray-200"></div>

      <p class="text-xs text-gray-500">
        🖱️ Search above, or click anywhere on the map (or drag the pin) to set the exact delivery point.
        @if (selectedLabel()) {
          <span class="block text-gray-700 font-medium mt-0.5">📍 {{ selectedLabel() }}</span>
        }
      </p>
    </div>
  `,
})
export class AddressMapPickerComponent implements AfterViewInit, OnDestroy {
  @Input() initial?: { lat: number; lng: number } | null;
  @Output() locationPicked = new EventEmitter<PickedLocation>();

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);

  searchQuery = '';
  results = signal<NominatimResult[]>([]);
  searching = signal(false);
  showResults = signal(false);
  locating = signal(false);
  selectedLabel = signal('');

  private map?: L.Map;
  private marker?: L.Marker;
  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  ngAfterViewInit(): void {
    patchDefaultIcon();
    this.initMap();
    this.listenForSearch();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.map?.remove();
  }

  private initMap(): void {
    const start = this.initial ?? { lat: 20, lng: 0 };
    this.map = L.map(this.mapEl.nativeElement).setView([start.lat, start.lng], this.initial ? 15 : 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.initial) {
      this.placeMarker(this.initial.lat, this.initial.lng);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  private listenForSearch(): void {
    this.searchSub = this.search$.pipe(
      debounceTime(450),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        if (q.length < 3) {
          this.searching.set(false);
          return of<NominatimResult[]>([]);
        }
        this.searching.set(true);
        return this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
          params: { format: 'json', addressdetails: '1', limit: '5', q },
        }).pipe(catchError(() => of<NominatimResult[]>([])));
      }),
    ).subscribe(res => {
      this.results.set(res);
      this.searching.set(false);
      this.showResults.set(true);
    });
  }

  onSearchChange(query: string): void {
    this.showResults.set(true);
    this.search$.next(query);
  }

  selectResult(r: NominatimResult): void {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    this.searchQuery = r.display_name;
    this.showResults.set(false);
    this.results.set([]);

    this.map?.setView([lat, lng], 16);
    this.placeMarker(lat, lng);
    this.emitLocation(lat, lng, r.display_name, r.address);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.locating.set(false);
        const { latitude, longitude } = pos.coords;
        this.map?.setView([latitude, longitude], 16);
        this.placeMarker(latitude, longitude);
        this.reverseGeocode(latitude, longitude);
      },
      () => this.locating.set(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  private placeMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.reverseGeocode(pos.lat, pos.lng);
      });
    }
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.http.get<NominatimResult>('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', addressdetails: '1', lat: String(lat), lon: String(lng) },
    }).pipe(catchError(() => of(null))).subscribe(res => {
      if (res) this.emitLocation(lat, lng, res.display_name, res.address);
      else this.emitLocation(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    });
  }

  private emitLocation(lat: number, lng: number, displayName: string, raw?: Record<string, string>): void {
    this.selectedLabel.set(displayName);
    this.locationPicked.emit({ lat, lng, address: this.parseAddress(raw), displayName });
  }

  private parseAddress(raw?: Record<string, string>): PickedAddressParts {
    if (!raw) return {};
    const street = [raw['house_number'], raw['road']].filter(Boolean).join(' ')
      || raw['road'] || raw['pedestrian'] || raw['neighbourhood'];
    const city = raw['city'] || raw['town'] || raw['village'] || raw['county'] || raw['suburb'];
    return {
      street: street || undefined,
      city: city || undefined,
      state: raw['state'] || undefined,
      country: raw['country'] || undefined,
      zipCode: raw['postcode'] || undefined,
    };
  }
}
