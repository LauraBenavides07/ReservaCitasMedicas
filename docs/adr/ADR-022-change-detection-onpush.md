# ADR-022: ChangeDetectionStrategy.OnPush por Defecto

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Todos los componentes usan `ChangeDetectionStrategy.OnPush`

## Contexto

Angular tiene dos estrategias de detección de cambios: Default (verifica todo el árbol de componentes en cada ciclo) y OnPush (solo verifica cuando cambian inputs, eventos, o signals).

## Opciones Consideradas

1. **OnPush** — Manual, más eficiente, obliga a usar Signals o inmutabilidad
2. **Default** — Automático, más simple pero menos eficiente en componentes grandes
3. **Híbrido** — OnPush en componentes críticos, Default en simples

## Decisión

OnPush para todos los componentes. Angular 19 con Signals hace que OnPush sea natural: las signals notifican cambios sin necesidad de zone.js. Los componentes que no tienen signals usan `ChangeDetectorRef.detectChanges()` para marcar explícitamente cuándo actualizar.

## Consecuencias

- ✅ Mejor rendimiento (menos ciclos de detección de cambios)
- ✅ Signals + OnPush = actualización reactiva sin zone.js
- ✅ El desarrollador controla cuándo y cómo se actualiza la vista
- ❌ Obliga a usar `ChangeDetectorRef` cuando se modifican propiedades fuera de signals
- ❌ Si se olvida llamar `detectChanges()`, la UI no se actualiza (bugs difíciles de encontrar)
