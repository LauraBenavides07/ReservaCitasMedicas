# Análisis de Mejora — Piedrazul

Proyecto: Sistema de Gestión de Citas Médicas
Stack: Angular 21 (frontend) + NestJS + PostgreSQL (backend)

---

## Prioridad: 🔴 Alta

### 1. Seguridad: Sin guards en rutas

**Problema:** Las rutas de Angular no tienen `canActivate` ni guards. Cualquier usuario puede navegar directamente a `/admin/config`, `/doctor/dashboard`, etc. escribiendo la URL. El control de acceso se hace solo con un signal `view()` en el template, lo que no protege contra navegación directa.

**Solución:** Implementar `AuthGuard` + `RoleGuard` en `app.routes.ts`:

```typescript
{ path: 'admin/config', component: AdminConfigComponent, canActivate: [RoleGuard], data: { role: 'admin' } }
{ path: 'doctor/dashboard', component: DoctorDashboardComponent, canActivate: [RoleGuard], data: { role: 'doctor' } }
```

También aplicar `canActivate` en los endpoints del backend que hoy están sin guard (`/appointments/stats`, `/appointments/export`, `/appointments`, `POST /appointments`, `PATCH /appointments/:id/confirm`, `PATCH /appointments/:id/complete`, `/doctors`, `/configs`).

---

### 2. Accesibilidad: Modales con `<div>` en vez de `<dialog>`

**Problema:** Todos los modales del sistema (reagendar, completar cita, formulario médico, excepciones, login, register) usan `<div>` con `position: fixed`. Esto implica:
- Sin foco atrapado (Tab puede salir del modal)
- Sin `aria-modal="true"` ni `role="dialog"` (excepto menú móvil del landing)
- Sin manejo de tecla Escape (excepto landing page)
- Sin `aria-labelledby` para anunciar el propósito del modal

**Solución:** Migrar a `<dialog>` nativo con `showModal()`:

```html
<dialog id="reschedule-modal" aria-labelledby="reschedule-title">
  <h2 id="reschedule-title">Reagendar Cita</h2>
  ...
  <form method="dialog">
    <button value="cancel">Cerrar</button>
  </form>
</dialog>
```

El navegador maneja automáticamente: foco atrapado, `inert` en contenido de fondo, dimming con `::backdrop`, cierre con Escape.

---

### 3. Accesibilidad: Elementos clickables `<div>` sin keyboard

**Problema:** En `appointment-form` y `patient-appointment-form`, las tarjetas de selección de médico y fechas son `<div>` con `(click)` pero sin:
- `role="button"` o `role="radio"`
- `tabindex="0"`
- `(keydown.enter)` / `(keydown.space)`
- `aria-pressed` o `aria-selected`

Esto las hace inaccesibles para usuarios de teclado y screen readers.

**Solución:**

```html
<button type="button" class="doctor-card"
  [class.selected]="isSelected"
  (click)="selectDoctor(doc)"
  [attr.aria-pressed]="isSelected">
  ...
</button>
```

O mantener `<div>` pero agregar los atributos necesarios:

```html
<div role="radio" tabindex="0" [attr.aria-checked]="isSelected"
  (click)="selectDoctor(doc)" (keydown.enter)="selectDoctor(doc)" (keydown.space)="selectDoctor(doc)">
```

---

### 4. Accesibilidad: Labels sin `for` en formularios

**Problema:** En login, register, appointment-form y admin-audit, los `<label>` no tienen atributo `for`, y los `<input>` no tienen `id` correspondiente. Esto rompe la asociación programática para screen readers.

**Solución:** Agregar `for="input-id"` en labels y `id="input-id"` en inputs correspondientes, como ya se hace correctamente en `admin-config`.

---

### 5. Accesibilidad: Sin manejo de foco en modales

**Problema:** Al abrir un modal, el foco no se mueve al primer elemento del modal. Al cerrarlo, el foco no regresa al botón que lo abrió.

**Solución:** Usar `dialog.showModal()` resuelve el foco automáticamente. Si se mantienen modales custom, implementar:

```typescript
openModal(): void {
  this.isOpen = true;
  setTimeout(() => this.modalElement.querySelector('button, input, a')?.focus());
}

closeModal(): void {
  this.isOpen = false;
  this.triggerButton.focus(); // Regresa foco al trigger
}
```

---

### 6. Accesibilidad: `lang="en"` y `<title>` genérico

**Problema:** `index.html` tiene `<html lang="en">` (la app es 100% español) y `<title>Frontend</title>`.

**Solución:**
```html
<html lang="es">
<title>Piedrazul - Centro Médico</title>
```

---

## Prioridad: 🟡 Media

### 7. Performance: Sin lazy loading en rutas

**Problema:** Todos los componentes se importan eager (al inicio). Con 13 componentes standalone, muchos no se usan hasta que el usuario navega a una vista específica (admin audit, doctor history, etc.).

**Solución:** Usar `loadComponent` en las rutas:

```typescript
{
  path: 'admin/audit',
  loadComponent: () => import('./components/admin-audit/admin-audit.component').then(m => m.AdminAuditComponent)
}
```

Esto reduce el bundle inicial significativamente.

---

### 8. Performance: Sin `loading="lazy"` en imágenes

**Problema:** Las imágenes PNG en `src/app/img/` no usan `loading="lazy"` ni `width`/`height`, lo que puede causar Cumulative Layout Shift (CLS).

**Solución:**
```html
<img src="img/logo.png" alt="Piedrazul" width="200" height="60" loading="lazy">
```

Considerar convertir PNG a WebP para reducir peso.

---

### 9. Performance: Sin `trackBy` en `*ngFor`

**Problema:** Los `*ngFor` en listas de citas, médicos y pacientes no usan `trackBy`, lo que fuerza a Angular a re-renderizar toda la lista en cada cambio.

**Solución:**
```typescript
trackById(index: number, item: { id: string }): string {
  return item.id;
}
```
```html
<tr *ngFor="let app of appointments; trackBy: trackById">
```

---

### 10. Arquitectura: Navegación mixta (Router + signals)

**Problema:** `app.component.html` usa un signal `view()` para cambiar entre componentes internamente (`view.set('appointments')`) mientras que `LoginComponent` y `RegisterComponent` usan `router.navigate()`. Esto causa inconsistencia — las rutas del Router existen pero la navegación principal las ignora.

**Solución:** Estandarizar usando el Router como fuente única de navegación. Reemplazar el signal `view()` con `<router-outlet>` y guards. El sidebar y header deben leer `router.url` o usar `Router.isActive()` para resaltar la vista activa.

---

### 11. Backend: Endpoints públicos sin autenticación

**Problema:** La mayoría de endpoints (`/doctors`, `/appointments`, `/appointments/stats`, `/configs`, `POST /appointments`, `PATCH /appointments/:id/confirm`, etc.) no tienen guards. Solo 4 endpoints usan `@UseGuards(JwtAuthGuard)`.

**Solución:** Agregar guards por defecto a nivel de controlador y abrir solo los endpoints que deben ser públicos (login, register, health check). Usar `@Public()` decorator para excepciones.

---

### 12. Datos de pacientes mockeados en localStorage

**Problema:** `DoctorPatientsComponent` guarda diagnósticos y observaciones solo en `localStorage`, no se envían al backend. Esto significa que los datos se pierden al cambiar de navegador/dispositivo.

**Solución:** Crear endpoint `PATCH /patients/:id` y persistir en la tabla `patients` (ya existe) o crear una tabla `medical_records`.

---

## Prioridad: 🟢 Baja

### 13. CSS: Sin `prefers-reduced-motion` global

**Problema:** Solo el landing page respeta `prefers-reduced-motion: reduce`. Los skeletons, transiciones y animaciones globales no tienen fallback.

**Solución en `styles.css`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 14. CSS: Sin `color-scheme` ni modo oscuro

**Problema:** No se declara `color-scheme` ni hay soporte para `prefers-color-scheme: dark`. Los form controls nativos y scrollbars usarán esquema claro aunque el SO esté en modo oscuro.

**Solución:**
```css
:root {
  color-scheme: light;
}
```

---

### 15. Sin `aria-live` para mensajes dinámicos

**Problema:** Los mensajes de éxito/error (Swal toasts, notificaciones) no tienen `aria-live="polite"`, por lo que screen readers no los anuncian automáticamente.

**Solución:** Envolver mensajes dinámicos en un contenedor `aria-live="polite"` o usar `role="status"` (que implícitamente es `aria-live="polite"`).

---

### 16. Sin validación reactiva en `CreateAppointmentDto` para `gender`

**Problema:** El campo `gender` en `CreateAppointmentDto` no tiene validación explícita aparte de ser string. El frontend usa un `<select>` con M/F/O, pero el backend no valida.

**Solución:**
```typescript
@IsString()
@IsIn(['M', 'F', 'O'])
gender: string;
```

---

### 17. Sin `ExceptionFilter` personalizado

**Problema:** El backend usa las excepciones HTTP de NestJS pero no hay un filtro global que capture errores no esperados y devuelva respuestas consistentes.

**Solución:** Implementar `AllExceptionsFilter`:
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Loggear error y devolver { statusCode, message, timestamp }
  }
}
```

---

### 18. Sin `ServiceWorker` / PWA

**Problema:** La app no tiene service worker, por lo que no funciona offline ni puede cachear recursos para carga más rápida en conexiones lentas.

**Solución:** Agregar `@angular/pwa` con `ng add @angular/pwa` para generar service worker, manifest y splash screen.

---

### 19. Sin `Content Security Policy` headers

**Problema:** No hay headers CSP configurados en el backend, lo que expone a posibles ataques XSS.

**Solución en `main.ts`:**
```typescript
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});
```

---

### 20. Pruebas: Cobertura faltante

**Problema:** No hay tests para:
- `AvailabilityService` (test unitarios)
- `AppointmentJobService` (cron jobs)
- `PatientService`
- `BcryptPasswordHasher`
- `NotificationService`

**Solución:** Agregar tests unitarios para estos servicios, siguiendo el patrón de los tests existentes (jest, mocks de repositorios).

---

## Resumen Priorizado

| # | Área | Impacto | Esfuerzo |
|---|------|---------|----------|
| 1 | Route guards | 🔴 Seguridad | Bajo |
| 2 | Modales `<dialog>` | 🔴 Accesibilidad | Medio |
| 3 | Clickables keyboard | 🔴 Accesibilidad | Bajo |
| 4 | Labels con `for` | 🔴 Accesibilidad | Bajo |
| 5 | Focus management | 🔴 Accesibilidad | Bajo |
| 6 | `lang="es"` + title | 🔴 Accesibilidad | Mínimo |
| 7 | Lazy loading routes | 🟡 Performance | Bajo |
| 8 | Lazy loading images | 🟡 Performance | Mínimo |
| 9 | `trackBy` en ngFor | 🟡 Performance | Mínimo |
| 10 | Navegación Router | 🟡 Arquitectura | Alto |
| 11 | Endpoints auth | 🟡 Seguridad | Medio |
| 12 | localStorage médico | 🟡 Datos | Alto |
| 13 | Reduced motion | 🟢 UX | Mínimo |
| 14 | Color scheme | 🟢 UX | Mínimo |
| 15 | `aria-live` | 🟢 Accesibilidad | Bajo |
| 16 | Validación gender | 🟢 Backend | Mínimo |
| 17 | Exception filter | 🟢 Backend | Bajo |
| 18 | PWA | 🟢 Performance | Medio |
| 19 | CSP headers | 🟢 Seguridad | Mínimo |
| 20 | Test coverage | 🟢 Calidad | Medio |

---

**Prioridad recomendada:** Empezar por #1 a #6 (alta accesibilidad + seguridad), luego #7-#9 (performance rápida), y los demás según disponibilidad.
