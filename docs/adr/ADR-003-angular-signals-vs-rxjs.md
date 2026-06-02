# ADR-003: Signals de Angular para Estado Reactivo

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Usar Signals (Angular 16+) para estado de componentes, RxJS solo para flujos asíncronos

## Contexto

Angular tradicionalmente usa RxJS (Subject, BehaviorSubject) para estado reactivo. Con Angular 16+ se introdujeron Signals como primitiva reactiva oficial. El frontend usa Angular 19 (standalone).

## Opciones Consideradas

1. **Signals + RxJS** — Signals para estado síncrono, RxJS para HTTP y eventos
2. **RxJS puro** — BehaviorSubjects en servicios, async pipe en templates
3. **NgRx** — Store global con actions/reducers/effects

## Decisión

Se adoptó Signals para todo el estado síncrono de componentes:
- `signal()`, `computed()`, `effect()` para estado local
- `toSignal()` para convertir Observables a Signals
- RxJS `BehaviorSubject` solo en `AuthService` para el estado del usuario (compartido globalmente)
- `async` + `Observable` para llamado a servicios HTTP

## Consecuencias

- ✅ Mejor rendimiento (ChangeDetection.OnPush por defecto)
- ✅ Código más simple y legible que RxJS para estado síncrono
- ✅ Sin dependencia externa (NgRx)
- ❌ Signals no reemplazan RxJS para flujos asíncronos complejos
- ❌ `effect()` debe usarse con cuidado (evitar cascadas)
- ⚠️ En `PatientAppointmentFormComponent` se usan Signals intensivamente (step, doctors, dates, slots)
