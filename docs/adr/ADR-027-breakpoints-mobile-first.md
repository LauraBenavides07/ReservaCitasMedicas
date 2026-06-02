# ADR-027: Breakpoints Mobile-First

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Breakpoints mobile-first con 480px, 768px y 1024px

## Contexto

El diseño mobile-first necesita puntos de quiebre definidos para adaptar el layout a diferentes tamaños de pantalla.

## Opciones Consideradas

1. **480px / 768px / 1024px** — Breakpoints específicos del proyecto
2. **Breakpoints de Bootstrap** — 576px, 768px, 992px, 1200px
3. **Breakpoints de Tailwind** — 640px, 768px, 1024px, 1280px
4. **Container queries** — Basado en el contenedor, no en el viewport

## Decisión

Tres breakpoints mobile-first (min-width):

```css
/* Mobile first: base styles son para < 480px */
@media (min-width: 480px) { /* tablets pequeñas */ }
@media (min-width: 768px) { /* tablets grandes / desktop */ }
@media (min-width: 1024px) { /* desktop grande */ }
```

El diseño base (sin media query) está optimizado para pantallas de celulares (< 480px). Cada breakpoint agrega mejoras progresivas: layout en columnas, tablas con más columnas, navegación horizontal.

## Consecuencias

- ✅ Base optimizada para celulares (el caso de uso más común para pacientes)
- ✅ Sin dependencias externas de grid systems
- ✅ 3 breakpoints cubren todos los dispositivos relevantes
- ❌ No usa container queries (tecnología más moderna pero con menos soporte)
- ❌ Tablets en orientación vertical (< 768px) a veces muestran la versión mobile
