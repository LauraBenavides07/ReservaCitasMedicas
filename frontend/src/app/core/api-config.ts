/**
 * En desarrollo (ng serve :4200) usa el backend directo.
 * En producción (Nginx :80 con proxy /api) usa rutas relativas.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  const { hostname, port } = window.location;
  if (hostname === 'localhost' && port === '4200') {
    return 'http://localhost:3000';
  }
  return '/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
