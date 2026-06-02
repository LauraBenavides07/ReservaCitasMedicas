# ADR-017: Eventos Compartidos como Paquete Local

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Eventos definidos en `shared/events/` referenciados como `workspace:*` en pnpm

## Contexto

El backend publica eventos y el notification service los consume. Ambos necesitan conocer la misma estructura de eventos. Debe haber un contrato compartido entre servicios.

## Opciones Consideradas

1. **Paquete local workspace** — `shared/events/` referenciado vía `"@piedrazul/events": "workspace:*"`
2. **Código duplicado** — Cada servicio define sus propios eventos
3. **Paquete npm publicado** — Publicar `@piedrazul/events` en npm registry
4. **Esquemas compartidos** — Contract testing con schemas JSON

## Decisión

Paquete local en el workspace pnpm (`shared/events/`) con un `index.ts` que re-exporta todos los eventos. Cada servicio lo referencia en `package.json` como `"@piedrazul/events": "workspace:*"`. Esto permite que TypeScript valide los tipos entre servicios sin publicar nada.

## Consecuencias

- ✅ Tipado compartido entre servicios (TypeScript valida en tiempo de compilación)
- ✅ Sin necesidad de publicar a npm registry
- ✅ pnpm resuelve el workspace automáticamente
- ❌ Todos los servicios deben estar en el mismo repositorio (monorepo)
- ❌ Si un servicio se extrae del monorepo, hay que migrar a paquete publicado
