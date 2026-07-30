import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

type MarkerKey = 'pickup' | 'dropoff' | 'driver';

const MARKER_STYLE: Record<MarkerKey, { emoji: string; color: string }> = {
  pickup: { emoji: '📦', color: '#2563eb' },
  dropoff: { emoji: '🏠', color: '#16a34a' },
  driver: { emoji: '🚚', color: '#ea580c' },
};

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
  selector: 'app-delivery-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <div #mapEl class="w-full rounded-lg border border-gray-200" [style.height]="height"></div>
      @if (!hasAnyPoint()) {
        <div class="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg pointer-events-none">
          <p class="text-sm text-gray-400">📍 Location not available yet</p>
        </div>
      }
    </div>
  `,
})
export class DeliveryMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pickup?: MapPoint | null;
  @Input() dropoff?: MapPoint | null;
  @Input() driver?: MapPoint | null;
  @Input() height = '280px';

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private markers: Partial<Record<MarkerKey, L.Marker>> = {};
  private line?: L.Polyline;
  private viewReady = false;

  ngAfterViewInit(): void {
    patchDefaultIcon();
    this.map = L.map(this.mapEl.nativeElement).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.viewReady = true;
    // Containers revealed via @if often report a zero size on first paint — re-measure shortly after.
    setTimeout(() => this.map?.invalidateSize(), 150);
    this.render();
  }

  ngOnChanges(): void {
    if (!this.viewReady) return;
    this.render();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  hasAnyPoint(): boolean {
    return this.validPoint(this.pickup) || this.validPoint(this.dropoff) || this.validPoint(this.driver);
  }

  private render(): void {
    if (!this.map) return;

    this.upsertMarker('pickup', this.pickup);
    this.upsertMarker('dropoff', this.dropoff);
    this.upsertMarker('driver', this.driver);
    this.updateRoute();
    this.fitToMarkers();
  }

  private upsertMarker(key: MarkerKey, point: MapPoint | null | undefined): void {
    if (!this.map) return;
    const existing = this.markers[key];

    if (!this.validPoint(point)) {
      if (existing) { this.map.removeLayer(existing); delete this.markers[key]; }
      return;
    }

    const latlng: L.LatLngExpression = [point.lat, point.lng];
    let marker = existing;
    if (!marker) {
      const { emoji, color } = MARKER_STYLE[key];
      marker = L.marker(latlng, {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:${color};border:2px solid white;border-radius:9999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.4)">${emoji}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(this.map);
      this.markers[key] = marker;
    } else {
      marker.setLatLng(latlng);
    }

    if (point.label) {
      if (marker.getTooltip()) marker.setTooltipContent(point.label);
      else marker.bindTooltip(point.label, { direction: 'top', offset: [0, -16] });
    }
  }

  private updateRoute(): void {
    if (!this.map) return;
    if (this.validPoint(this.pickup) && this.validPoint(this.dropoff)) {
      const latlngs: L.LatLngExpression[] = [[this.pickup.lat, this.pickup.lng], [this.dropoff.lat, this.dropoff.lng]];
      if (this.line) this.line.setLatLngs(latlngs);
      else this.line = L.polyline(latlngs, { color: '#9ca3af', weight: 2, dashArray: '6 6' }).addTo(this.map);
    } else if (this.line) {
      this.map.removeLayer(this.line);
      this.line = undefined;
    }
  }

  private fitToMarkers(): void {
    if (!this.map) return;
    const pts: L.LatLngExpression[] = [];
    if (this.validPoint(this.pickup)) pts.push([this.pickup.lat, this.pickup.lng]);
    if (this.validPoint(this.dropoff)) pts.push([this.dropoff.lat, this.dropoff.lng]);
    if (this.validPoint(this.driver)) pts.push([this.driver.lat, this.driver.lng]);

    if (pts.length === 1) this.map.setView(pts[0], 15);
    else if (pts.length > 1) this.map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
  }

  private validPoint(p?: MapPoint | null): p is MapPoint {
    return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
  }
}
