# Backend Code Review — Análisis SOLID

## Resumen

Se identificaron **23 violaciones** a los principios SOLID en el backend (excluyendo test/spec files, 31 archivos `.ts` analizados).

| Principio | Violaciones | Severidad |
|---|---|---|
| **S** — SRP | 7 | 1 CRITICAL, 3 HIGH, 2 MODERATE, 1 LOW |
| **O** — OCP | 5 | 1 HIGH, 3 MODERATE, 1 LOW |
| **L** — LSP | 0 | — |
| **I** — ISP | 4 | 3 LOW-MODERATE, 1 LOW |
| **D** — DIP | 7 | 2 CRITICAL, 2 HIGH, 2 MODERATE, 1 LOW-MODERATE |

---

## S — Single Responsibility Principle

### CRITICAL: SRP-1 — `AppointmentService` es un God Object (8+ responsabilidades)

**Archivo:** `backend/src/application/services/appointment.service.ts` (631 líneas)

| Responsabilidad | Métodos |
|---|---|
| Appointment CRUD | `create()`, `findAllByDoctorAndDate()`, `findAll()`, `findById()` |
| Patient management | `findPatientByDocument()`, auto-creación en `create()` |
| Availability calculation | `getAvailableSlots()` |
| Dashboard statistics | `getDashboardStats()` |
| CSV Export | `exportAppointmentsByDateAndDoctor()` |
| Scheduled batch jobs | `autoCompletePastAppointments()`, `sendReminders()` |
| Notification/event emitting | `emitEvent()` + invocaciones |
| Business rule validation | time window, dupes, doctor exceptions |

### HIGH: SRP-2 — `AuthService` mezcla autenticación local, Keycloak y sincronización

**Archivo:** `backend/src/application/services/auth.service.ts` (269 líneas)

- Keycloak admin auto-provisioning (axios directo)
- Keycloak Direct Access Grants login (axios directo)
- Local fallback con bcrypt
- JWT decoding
- Lazy identity linking (local DB sync)
- Patient lookup (`getPatientByDocument`) — duplicado de AppointmentService

### HIGH: SRP-3 — `DoctorService` mezcla CRUD de doctores con exceptions management

**Archivo:** `backend/src/application/services/doctor.service.ts`

### HIGH: SRP-4 — Todas las entidades son anémicas (cero lógica de negocio)

**Archivos:** `appointment.entity.ts`, `doctor.entity.ts`, `config.entity.ts`, `patient.entity.ts`, `user.entity.ts`, `doctor-exception.entity.ts`

Las 6 entidades son "bags of getters/setters". La lógica que debería estar en métodos como `Appointment.canBeCancelled()`, `Doctor.isAvailableOn(date)`, etc. está dispersa en los servicios.

### MODERATE: SRP-6 — Endpoint duplicado de búsqueda de paciente

- `GET /appointments/patient-by-document/:document` → `AppointmentService.findPatientByDocument()`
- `GET /auth/patient/:document` → `AuthService.getPatientByDocument()`

### MODERATE: SRP-7 — `CreateAppointmentDto` mezcla datos de paciente y cita

6 campos de paciente + 4 de appointment en el mismo DTO.

---

## O — Open/Closed Principle

### HIGH: OCP-1 — Cadena if-else hardcodeada para conteo de estados

```typescript
// appointment.service.ts:512-514
if (app.status === 'agendada') scheduled++;
else if (app.status === 'completada') completed++;
else if (app.status === 'cancelada') cancelled++;
```

### MODERATE: OCP-2 — Magic strings de status dispersos (12+ ocurrencias)

`'agendada'`, `'cancelada'`, `'completada'`, `'confirmada'` aparecen en:
- `appointment.service.ts` (líneas 166, 331, 358, 362, 435, 513, 592, 616)
- `doctor.service.ts` (línea 53)

### MODERATE: OCP-3 — Defaults mágicos repetidos en 3 archivos

`minAdvanceHours: 2`, `appointmentWindowDays: 15` duplicados en `appointment.service.ts`, `config.service.ts`, `doctor.entity.ts`.

### MODERATE: OCP-4 — Credenciales admin de Keycloak hardcodeadas

`auth.service.ts` líneas 68-73: `'admin-cli'`, `'password'`, `'admin'`.

---

## L — Liskov Substitution Principle

### Sin violaciones

No hay jerarquías de herencia significativas. Las únicas extensiones (`PassportStrategy(Strategy)`, `AuthGuard('jwt')`) son decorators de framework que implementan correctamente el contrato esperado.

---

## I — Interface Segregation Principle

### LOW-MODERATE: ISP-1 — `CreateAppointmentDto` fat interface

Consumidores que solo necesitan datos de la cita están forzados a depender de 6 campos de paciente.

### LOW-MODERATE: ISP-3 — Interfaces de Keycloak con muchos optional fields

`UserData` (4/6 optional) y `DbUser` (6/7 optional) representan múltiples roles en una sola interfaz.

---

## D — Dependency Inversion Principle

### CRITICAL: DIP-1 — `axios` directo en `auth.service.ts`

```typescript
import axios from 'axios';
// Llamadas directas a axios.post() para Keycloak
```

No hay interfaz `IAuthProvider` o `IHttpClient`. Cambiar de Keycloak a Auth0/Firebase requiere modificar el servicio. Testear requiere mock global de axios.

### CRITICAL: DIP-2 — `bcrypt` directo en `auth.service.ts`

```typescript
import * as bcrypt from 'bcrypt';
// bcrypt.hash() y bcrypt.compare() directos
```

No hay interfaz `IPasswordHasher`. Cambiar algoritmo requiere modificar el servicio.

### HIGH: DIP-3 — `json2csv Parser` directo en `appointment.service.ts`

```typescript
import { Parser } from 'json2csv';
```

No hay interfaz `ICsvExporter`/`IReportGenerator`. Cambiar formato requiere modificar el servicio.

### HIGH: DIP-4 — Sin abstracciones de repositorio (11 inyecciones de `Repository<T>`)

| Archivo | Inyecciones concretas |
|---|---|
| `appointment.service.ts` | `Repository<Appointment>`, `Repository<Patient>`, `Repository<Doctor>`, `Repository<DoctorException>` |
| `auth.service.ts` | `Repository<User>`, `Repository<Patient>` |
| `config.service.ts` | `Repository<Config>` |
| `doctor.service.ts` | `Repository<Doctor>`, `Repository<Appointment>`, `Repository<DoctorException>` |
| `jwt.strategy.ts` | `Repository<Patient>`, `Repository<User>` |

La capa de aplicación depende de `typeorm.Repository` (clase concreta del framework ORM). Cambiar de TypeORM a Prisma/MikroORM requiere modificar todos los servicios.

### MODERATE: DIP-5 — `@Cron` decorator directo en método de servicio

`appointment.service.ts:606`: `@Cron('0 8 * * *')` acopla el servicio a `@nestjs/schedule`.

### MODERATE: DIP-6 — Env vars leídas directamente en 2 archivos con defaults duplicados

`auth.service.ts` (líneas 26-28) y `jwt.strategy.ts` (líneas 20-21) leen `KEYCLOAK_URL` y `KEYCLOAK_REALM` con los mismos defaults duplicados.

---

## Prioridad de remediación

1. **DIP-1 y DIP-2** (CRITICAL) — Abstraer `axios` → `IHttpClient` y `bcrypt` → `IPasswordHasher`
2. **SRP-1** (CRITICAL) — Descomponer `AppointmentService` en servicios separados (citas, disponibilidad, stats, export, notificaciones, jobs)
3. **DIP-4** (HIGH) — Introducir interfaces de repositorio (`IAppointmentRepository`, `IDoctorRepository`, etc.)
4. **SRP-4** (HIGH) — Agregar lógica de negocio a entidades (métodos de dominio)
5. **OCP-1/OCP-2** (HIGH) — Introducir `AppointmentStatus` enum y strategy pattern para transiciones
6. **DIP-3** (HIGH) — Abstraer exportación de reportes

---

## Estado de la remediación (Mayo 2026)

### Corregido ✅

| Violación | Fix | Archivos creados/modificados |
|-----------|-----|------------------------------|
| **SRP-1** (God Object) | `AppointmentService` descompuesto en 6 servicios | `availability.service.ts`, `stats.service.ts`, `export.service.ts`, `appointment-job.service.ts`, `notification.service.ts`, `patient.service.ts` |
| **SRP-4** (Entidades anémicas) | Métodos de dominio agregados | `appointment.entity.ts`, `doctor.entity.ts`, `doctor-exception.entity.ts` |
| **SRP-5** (GlobalConfig en service file) | `GlobalConfig` movido a `domain/types/` | `global-config.type.ts` |
| **SRP-6** (Endpoint duplicado) | Endpoint `patient-by-document` removido de `AppointmentController` | `appointment.controller.ts` |
| **OCP-1/OCP-2** (Magic status strings) | `AppointmentStatus` enum creado y usado en toda la app | `appointment-status.enum.ts`, `appointment.entity.ts`, `stats.service.ts`, `appointment-job.service.ts`, `doctor.service.ts` |
| **DIP-1** (axios directo) | Abstraído via `IHttpClient` + `AxiosHttpClient` | `ihttp-client.interface.ts`, `axios-http-client.ts`, `auth.service.ts` |
| **DIP-2** (bcrypt directo) | Abstraído via `IPasswordHasher` + `BcryptPasswordHasher` | `ipassword-hasher.interface.ts`, `bcrypt-password-hasher.ts`, `auth.service.ts` |
| **DIP-3** (json2csv directo) | Abstraído via `ICsvExporter` + `Json2CsvExporter` | `icsv-exporter.interface.ts`, `json2csv-exporter.ts`, `export.service.ts` |
| **DIP-5** (@Cron en servicio) | Movido a `AppointmentJobService` dedicado | `appointment-job.service.ts` |

### No corregido (Pendiente) ⏳

| Violación | Razón | Esfuerzo estimado |
|-----------|-------|-------------------|
| **SRP-2** (AuthService multifunción) | Refactor mayor que afecta flujo de autenticación completo | Alta |
| **SRP-3** (DoctorService con exceptions) | Separar `DoctorExceptionService` | Baja |
| **SRP-7** (Fat DTO) | Separar `PatientDto` de `CreateAppointmentDto` | Baja |
| **OCP-3/OCP-4** (Defaults hardcodeados) | Centralizar en archivo de configuración | Media |
| **ISP-1/ISP-3** (Fat interfaces) | Interfaces más específicas | Media |
| **DIP-4** (Repositorios TypeORM directos) | Migración completa a repository pattern | Alta |
| **DIP-6** (Env vars duplicadas) | Centralizar keycloak config | Baja |

### Resumen de cobertura de tests

- **97 tests, 17 suites** — todos pasan ✅
- TypeScript compila sin errores ✅
- Las pruebas mockean las nuevas abstracciones (`IPasswordHasher`, `IHttpClient`) en lugar de `bcrypt`/`axios` globales
