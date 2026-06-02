# ADR-012: Vitest en lugar de Karma + Jasmine

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Vitest como test runner del frontend

## Contexto

Angular tradicionalmente usa Karma + Jasmine para tests unitarios. Con Angular 15+ y el ecosistema moderno, Vitest emerge como alternativa más rápida y con mejor DX.

## Opciones Consideradas

1. **Vitest** — Test runner rápido, compatible con Jest API, integración con Vite
2. **Karma + Jasmine** — Stack tradicional de Angular
3. **Jest + ts-jest** — Sin Karma, pero con configuración compleja en Angular

## Decisión

Vitest con `@analogjs/vite-plugin-angular` y `@analogjs/vitest-angular`. Usa la API de Jest (`vi.fn()`, `vi.spyOn()`, `describe`/`it`/`expect`) pero corre sobre Vite, lo que lo hace significativamente más rápido que Karma.

## Consecuencias

- ✅ Velocidad: Vitest es 5-10x más rápido que Karma
- ✅ API compatible con Jest (mocks, spies, timers)
- ✅ Integración nativa con Angular vía Analog plugins
- ✅ `vi.fn().mockReturnValue()` más limpio que `jasmine.createSpy()`
- ❌ No usa TestBed de Angular de la misma forma que Karma
- ❌ Requiere `@analogjs/vite-plugin-angular` que es menos maduro que @angular-devkit
- ❌ `matchMedia` no existe en jsdom (hay que mockearlo para SweetAlert2)
