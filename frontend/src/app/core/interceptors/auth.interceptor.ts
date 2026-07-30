import { HttpInterceptorFn } from '@angular/common/http';

// Mirrors AuthService.TOKEN_KEY / ApiService.baseUrl — read directly (not via inject())
// because AuthService's constructor fires an HTTP request as part of its own
// construction; injecting AuthService here would re-enter it mid-construction
// and trigger Angular's NG0200 circular-dependency error on every page load.
const TOKEN_KEY = 'sz_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  // Our own backend is always called with a relative /api path (same-origin,
  // proxied by nginx) — never attach the bearer token to absolute URLs
  // (e.g. Nominatim/OSM geocoding), which would leak it to third parties.
  if (token && req.url.startsWith('/api')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};
