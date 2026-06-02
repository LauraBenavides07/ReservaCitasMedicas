# ADR-011: Componentes Standalone (sin NgModules)

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Todos los componentes son standalone, sin NgModules

## Contexto

Angular 14 introdujo componentes standalone como alternativa a NgModules. Angular 15+ los hizo la default y Angular 17+ desaconseja NgModules. El proyecto usa Angular 19.

## Opciones Consideradas

1. **Standalone** — Todos los componentes con `standalone: true`, sin NgModules
2. **NgModules** — Módulos por feature (AppModule, SharedModule, etc.)
3. **Híbrido** — Componentes standalone con algunos módulos compartidos

## Decisión

Standalone puro: cada componente declara sus propios imports (`CommonModule`, `FormsModule`, etc.). El `AppComponent` es standalone y la configuración va en `app.config.ts`. `app.routes.ts` carga componentes directamente sin módulos intermedios.

## Consecuencias

- ✅ Elimina la complejidad de NgModules (declarations, exports, imports)
- ✅ Lazy loading más simple (componentes en rutas directamente)
- ✅ El framework completo es standalone desde Angular 17
- ❌ Cada componente repite imports comunes (ej. `CommonModule` en varios)
- ❌ Migración de código legacy requiere cambios
