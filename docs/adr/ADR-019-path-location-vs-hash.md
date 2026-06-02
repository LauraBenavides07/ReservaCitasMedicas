# ADR-019: PathLocationStrategy en lugar de HashLocationStrategy

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Usar PathLocationStrategy (HTML5 history) para el enrutamiento Angular

## Contexto

El frontend Angular necesita un strategy de enrutamiento. Las opciones son PathLocationStrategy (URLs limpias: `/citas`, `/medico/dashboard`) o HashLocationStrategy (URLs con `#`: `/#/citas`).

## Opciones Consideradas

1. **PathLocationStrategy** — URLs sin `#`, requiere configurar el servidor (Nginx) para redirigir todas las rutas a `index.html`
2. **HashLocationStrategy** — URLs con `#`, no requiere configuración de servidor, funciona con archivos estáticos

## Decisión

PathLocationStrategy (default de Angular) porque el frontend se sirve con Nginx en Docker, donde es trivial configurar `try_files $uri $uri/ /index.html`. Las URLs son más limpias y profesionales.

## Consecuencias

- ✅ URLs legibles y compartibles (`/medico/dashboard` vs `/#/medico/dashboard`)
- ✅ Mejor para SEO (aunque no es crítico en una SPA médica)
- ❌ Requiere configuración del servidor web (Nginx `try_files`)
- ❌ Si se sirve como archivo estático sin servidor web, las rutas directas fallan (404)
