# ADR-013: ESLint Flat Config

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** ESLint flat config (`eslint.config.mjs`) en lugar de `.eslintrc`

## Contexto

ESLint 9+ deprecó el formato `.eslintrc` legacy en favor de flat config (eslint.config.*). El proyecto empezó con flat config.

## Opciones Consideradas

1. **Flat config** — `eslint.config.mjs` con array de configs, sin jerarquía de extends
2. **Legacy `.eslintrc`** — Formato JSON/YAML/JS tradicional

## Decisión

Flat config con `eslint.config.mjs`. Las reglas se organizan en un array donde cada objeto es una configuración con `files`, `rules`, `plugins`. Esto permite:
- Desactivar `@typescript-eslint/no-unsafe-*` para `*.spec.ts` y `test/**`
- Configurar parser options por archivo
- No depender de `extends` ni jerarquías de configuración

## Consecuencias

- ✅ Configuración explícita y predecible (sin herencia sorpresa)
- ✅ Reglas por patrón de archivo (spec files relajados, source estrictos)
- ✅ ESLint 9+ requiere flat config (preparado para futuro)
- ❌ Sintaxis menos familiar para quien viene de `.eslintrc`
- ❌ Muchos plugins aún no migran completamente a flat config
