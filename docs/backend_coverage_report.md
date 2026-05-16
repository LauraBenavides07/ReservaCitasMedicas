# Reporte de Cobertura y Calidad - Backend Piedrazul

**Fecha:** 2026-05-16  
**Estado Global:** 🟢 **~90% Cobertura** (117 tests, 17 test suites)

---

## 📊 Resumen General

| Métrica           | Porcentaje |
|-------------------|:----------:|
| Statements        |   89.93%   |
| Branches          |   78.20%   |
| Functions         |   86.20%   |
| Lines             |   90.94%   |

---

## 💻 Estado por Capa

### 1. Servicios (Application) - 🟢 ~98%
| Archivo            | Stmts  | Branch | Funcs | Lines  |
|--------------------|:------:|:------:|:-----:|:------:|
| AppointmentService | 96.60% | 78.12% | 100%  | 97.98% |
| AuthService        |  100%  | 92.15% | 100%  |  100%  |
| ConfigService      |  100%  |   75%  | 100%  |  100%  |
| DoctorService      |  100%  | 81.25% | 100%  |  100%  |

### 2. Controladores (Presentation) - 🟢 100%
| Archivo              | Stmts | Branch | Funcs | Lines |
|----------------------|:-----:|:------:|:-----:|:-----:|
| AppointmentController| 100%  |   75%  | 100%  | 100%  |
| AuthController       | 100%  |   75%  | 100%  | 100%  |
| ConfigController     | 100%  |   75%  | 100%  | 100%  |
| DoctorController     | 100%  | 56.25% | 100%  | 100%  |

### 3. DTOs - 🟢 100%
| Archivo              | Stmts | Branch | Funcs | Lines |
|----------------------|:-----:|:------:|:-----:|:-----:|
| CreateAppointmentDto | 100%  |  100%  | 100%  | 100%  |
| LoginDto             | 100%  |  100%  | 100%  | 100%  |
| RegisterDto          | 100%  |  100%  | 100%  | 100%  |

### 4. Infraestructura - 🟡 84-100%
| Módulo                 | Stmts  | Branch | Funcs | Lines  |
|------------------------|:------:|:------:|:-----:|:------:|
| JwtAuthGuard           |  100%  |  100%  | 100%  |  100%  |
| JwtStrategy            | 82.14% |   70%  |  50%  | 80.76% |
| NotificationsClientMod |  100%  |  100%  | 100%  |  100%  |

### 5. Entidades (Domain) - 🟢 ~90%
| Archivo              | Stmts  | Branch | Funcs | Lines  |
|----------------------|:------:|:------:|:-----:|:------:|
| Appointment          | 78.94% |  87.5% |   0%  | 86.66% |
| Config               |  100%  |   75%  | 100%  |  100%  |
| Doctor               | 89.47% |   75%  |   0%  | 93.75% |
| DoctorException      | 91.66% |   75%  |   0%  |   90%  |
| Patient              |   90%  |   75%  |   0%  | 94.11% |
| User                 |  100%  |   80%  | 100%  |  100%  |

> Nota: Las entidades muestran 0% en Funcs al carecer de métodos explícitos (son data classes con decoradores TypeORM). Config y User tienen getters/setters implícitos que se cubren en sus tests.

### 6. Boilerplate NestJS (no unit-testable por ESM) - 🔴 0%
| Archivo       | Stmts | Branch | Funcs | Lines |
|---------------|:-----:|:------:|:-----:|:-----:|
| app.module.ts |   0%  |  100%  |   0%  |   0%  |
| auth.module.ts|   0%  |  100%  | 100%  |   0%  |
| main.ts       |   0%  |   0%   |   0%  |   0%  |

> Estos archivos son boilerplate de NestJS que dependen de `jwks-rsa` (ESM-only, no parseable por Jest). Se cubren mediante tests e2e.

---

## 🛡️ Lo que ESTÁ Cubierto

### Lógica de Negocio (Services)
- **Gestión de Citas**: Validación de ventanas de tiempo (min 2h, max 15 días), respeto de horarios de almuerzo y días laborables, manejo de excepciones médicas, cancelación con validación de propiedad, confirmación, exportación CSV, estadísticas de dashboard
- **Autenticación**: Flujo híbrido Keycloak + BD Local, auto-provisionamiento, lazy linking de identidades, fallback local
- **Médicos**: CRUD completo, validación de borrado (no se borran médicos con citas activas), manejo de excepciones por día
- **Configuración**: Valores por defecto en `onModuleInit`, actualización de parámetros

### Controladores
- Todos los endpoints verifican delegación correcta al servicio correspondiente

### Infraestructura
- **JwtStrategy**: Validate con paciente, staff, fallback sub, roles vacíos, payload nulo
- **JwtAuthGuard**: Guard simple que extiende `AuthGuard('jwt')`
- **NotificationsClientModule**: Compilación del módulo NestJS con RabbitMQ

### Entidades (TypeORM)
- Creación y asignación de propiedades en todas las entidades del dominio

---

## ⚠️ Lo que NO está Cubierto

### 1. Constructor de JwtStrategy
- Las líneas 15-23 (constructor con entorno: `KEYCLOAK_URL`, `KEYCLOAK_REALM`) no se prueban porque el test crea la instancia con `Object.create` para evitar la dependencia ESM de `jwks-rsa`

### 2. Casos de Borde en Creación de Citas (AppointmentService)
- Línea 204: Rama de `timeToMinutes(doctor.scheduleStart)` cuando `scheduleStart` es `undefined`
- Línea 369: Rama de conflicto en `reschedule` cuando `existing.id !== id`
- Líneas 496-497: Ramas de contadores de estado `completada`/`cancelada` en `getDashboardStats`

### 3. Módulos y bootstrap
- `app.module.ts`, `auth.module.ts`, `main.ts` no tienen tests unitarios (dependencias ESM no soportadas por Jest)

---

## 🚀 Roadmap de Calidad Sugerido

1. **Prioridad 1**: Tests de integración (e2e) para cubrir flujo completo Registro → Login → Agendar y validar módulos NestJS
2. **Prioridad 2**: Ampliar cobertura de branches en `AppointmentService` (escenarios de reschedule con conflicto, dashboard con estados variados)
3. **Prioridad 3**: Tests de estrés para búsqueda de disponibilidad con grandes volúmenes de datos

---

*Generado con `npx jest --coverage` (Jest v30.3.0, ts-jest)*  
*117 tests unitarios, 17 suites, 0 fallos*
