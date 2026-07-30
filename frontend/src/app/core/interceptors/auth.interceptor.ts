import { HttpInterceptorFn } from '@angular/common/http';
import { BACKEND_ORIGIN } from '../backend-origin';

// Mirrors AuthService.TOKEN_KEY / ApiService.baseUrl — read directly (not via inject())
// because AuthService's constructor fires an HTTP request as part of its own
// construction; injecting AuthService here would re-enter it mid-construction
// and trigger Angular's NG0200 circular-dependency error on every page load.
const TOKEN_KEY = 'sz_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  // Only attach our bearer token to requests aimed at our own backend —
  // never to third-party APIs (e.g. Nominatim/OSM geocoding), which would leak it.
  if (token && req.url.startsWith(BACKEND_ORIGIN)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};
