# ADR-001: Monolito en Capas vs Microservicios

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Monolito en capas (NestJS) con preparación para microservicios

## Contexto

El sistema Piedrazul debe gestionar citas médicas, pacientes, médicos, notificaciones y configuración. Se requiere una primera entrega funcional (SPA) en plazo corto. Existe incertidumbre sobre la escala futura.

## Opciones Consideradas

1. **Monolito en capas** — Single NestJS app con capas presentation/application/domain/infrastructure
2. **Microservicios desde el inicio** — Cada módulo como servicio independiente con su BD
3. **Monolito modular** — Mismo proceso pero con módulos NestJS bien delimitados

## Decisión

Se optó por **monolito en capas** pero con:
- Notification Service ya separado como microservicio independiente (por su naturaleza asíncrona y stack de colas)
- Interfaces de puertos (`I*Repository`) que permiten cambiar implementaciones sin afectar dominio
- Eventos compartidos (`shared/events/`) que definen el contrato entre servicios

## Consecuencias

- ✅ Desarrollo más rápido para la primera entrega
- ✅ Arquitectura preparada para extraer microservicios (puertos + eventos)
- ✅ Notification Service ya separado validando el patrón
- ❌ Escalamiento vertical forzado (un solo proceso backend)
- ❌ Acoplamiento temporario entre módulos (AppointmentService usa AvailabilityService directamente)
- ⚠️ Si se requiere escalar, extraer AvailabilityService y PatientService como servicios independientes siguiendo los mismos puertos
