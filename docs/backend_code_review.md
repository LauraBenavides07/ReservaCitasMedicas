# Backend Code Review — Hallazgos y Mejoras

> Estado: 10/10 fixes completados (5 críticos + 5 altos).
> Tests: 117 unitarias + 44 integración + 25 E2E — todos pasan.

---

## 🔴 Críticos (bugs / seguridad) — ✅ Completados

### 1. `whitelist: true` rompe `PATCH /configs`
- **Archivo**: `src/presentation/dto/update-config.dto.ts` (nuevo)
- **Problema**: `GlobalConfig` sin decoradores class-validator; `whitelist: true` eliminaba propiedades.
- **Solución**: Nuevo DTO `UpdateConfigDto` con `@IsNumber() @Min(1)`. Controller usa `UpdateConfigDto`. Service usa `Partial<GlobalConfig>` con merge.

### 2. JWT secret hardcodeado
- **Archivo**: `src/auth.module.ts`
- **Problema**: `secret: 'PIEDRAZUL_SECRET_KEY'` fijo en código.
- **Solución**: `JwtModule.registerAsync` con `config.get('JWT_SECRET', 'PIEDRAZUL_SECRET_KEY')`. Agregado `JWT_SECRET` a `.env` y `.env.example`.

### 3. Credenciales de DB loggeadas en consola
- **Archivo**: `src/app.module.ts`
- **Problema**: `console.log` con host, puerto, usuario, password y database.
- **Solución**: Eliminado el bloque `console.log`.

### 4. Emisiones RabbitMQ sin manejo de errores
- **Archivo**: `src/application/services/appointment.service.ts`
- **Problema**: `notificationClient.emit()` fire-and-forget sin error handling.
- **Solución**: Método privado `emitEvent(pattern, data)` con try-catch y `console.error`. Reemplazadas todas las llamadas directas. Incluye `appointment.created`, `cancelled`, `rescheduled`, `reminder`.

### 5. `findAllByPatient` con where array y valores `undefined`
- **Archivo**: `src/application/services/appointment.service.ts`
- **Problema**: `document` opcional en array where causaba matches impredecibles.
- **Solución**: Array de condiciones filtrado: solo se agrega `{ patient: { document } }` si `document` tiene valor.

---

## 🟡 Altos (mantenibilidad) — ✅ Completados

### 6. Endpoints de doctores sin DTOs
- **Archivos**: `src/presentation/dto/create-doctor.dto.ts`, `update-doctor.dto.ts`, `create-exception.dto.ts`
- **Problema**: `Partial<Doctor>` y `Partial<DoctorException>` exponían schema completo.
- **Solución**: DTOs con decoradores `class-validator` (name obligatorio, scheduleStart/End con formato `HH:mm`, slotDuration >= 5).

### 7. Mensajes de error mixtos español/inglés
- **Archivos**: `doctor.service.ts`, `appointment.service.ts`, `auth.service.ts`
- **Problema**: `'Doctor with ID not found'` (inglés) mezclado con español.
- **Solución**: Todos los mensajes user-facing unificados a español.

### 8. `console.log` de depuración en producción
- **Archivo**: `src/presentation/controllers/appointment.controller.ts`
- **Problema**: Logs de debug revelando datos del paciente autenticado.
- **Solución**: Eliminados 3 `console.log` del controller. Se conservan logs de error/warning en `auth.service.ts` (son operacionales).

### 9. Imports no utilizados de `@nestjs/schedule`
- **Archivo**: `src/application/services/appointment.service.ts`
- **Problema**: `CronExpression` importado pero solo usado en código comentado.
- **Solución**: `import { Cron } from '@nestjs/schedule'` (solo lo necesario). Código comentado limpiado.

### 10. `ConfigService.updateConfig` usa `as any`
- **Archivo**: `src/application/services/config.service.ts`
- **Problema**: `{ value: data as any }` desactivaba TypeScript.
- **Solución**: `{ value: { ...existing.value, ...data } }` — merge con type safety.

---

## 🔵 Medios (calidad de código) — ✅ Completados

### 11. `timeToMinutes` / `minutesToTime` duplicados
- **Archivo**: `src/application/utils/time.utils.ts` (nuevo)
- **Problema**: Lógica de conversión de tiempo duplicada en el servicio.
- **Solución**: Funciones `timeToMinutes` y `minutesToTime` extraídas a utilidad compartida. Service las importa directamente.

### 12. Ruta `DELETE /doctors/exceptions/:exceptionId` inconsistente
- **Archivo**: `src/presentation/controllers/doctor.controller.ts`
- **Problema**: Delete usaba `/exceptions/:exceptionId` mientras las demás rutas eran `/:id/exceptions`.
- **Solución**: Cambiado a `DELETE :id/exceptions/:exceptionId`. Actualizado test E2E y spec unitario.

### 13. Paginación en listados
- **Archivo**: `src/application/services/appointment.service.ts`, `src/presentation/controllers/appointment.controller.ts`
- **Problema**: `findAll` y `findAllByDoctorAndDate` sin paginación.
- **Solución**: Parámetros `skip` (default 0) y `take` (default 100) agregados al service y controller.

### 14. Race condition en `AppointmentService.create`
- **Archivo**: `src/application/services/appointment.service.ts`
- **Problema**: Entre verificar paciente y guardar cita, otra request concurrente podía crear duplicados.
- **Solución**: Try-catch con manejo de código PostgreSQL `23505` (unique violation). Si el paciente ya se creó entre medio, se recupera con un segundo `findOneBy`. Si el slot ya se ocupó, se lanza `ConflictException`.

### 15. Status inconsistente: `'agendada'` vs `'scheduled'`
- **Archivo**: `src/domain/entities/appointment.entity.ts`
- **Problema**: `default: 'scheduled'` en la entidad pero el servicio siempre usaba `'agendada'`.
- **Solución**: Default cambiado a `'agendada'`.

---

## Resumen de Implementación

| # | Área | Estado | Archivos modificados |
|---|------|--------|---------------------|
| 1 | ValidationPipe whitelist | ✅ | `update-config.dto.ts` (nuevo), `config.controller.ts`, `config.service.ts` |
| 2 | JWT secret hardcodeado | ✅ | `auth.module.ts`, `.env`, `.env.example` (nuevo) |
| 3 | Credenciales en consola | ✅ | `app.module.ts` |
| 4 | RabbitMQ sin error handling | ✅ | `appointment.service.ts` |
| 5 | findAllByPatient where array | ✅ | `appointment.service.ts` |
| 6 | DTOs para doctores | ✅ | `create-doctor.dto.ts`, `update-doctor.dto.ts`, `create-exception.dto.ts` (nuevos), `doctor.controller.ts` |
| 7 | Mensajes mixtos | ✅ | `doctor.service.ts`, `appointment.service.ts`, `auth.service.ts` |
| 8 | console.log debug | ✅ | `appointment.controller.ts` |
| 9 | Imports muertos | ✅ | `appointment.service.ts` |
| 10 | as any en ConfigService | ✅ | `config.service.ts` |
| 11 | timeToMinutes duplicado | ✅ | `time.utils.ts` (nuevo), `appointment.service.ts` |
| 12 | Ruta DELETE inconsistente | ✅ | `doctor.controller.ts`, `app.e2e-spec.ts`, `doctor.controller.spec.ts` |
| 13 | Paginación | ✅ | `appointment.service.ts`, `appointment.controller.ts`, `appointment.controller.spec.ts` |
| 14 | Race condition | ✅ | `appointment.service.ts` |
| 15 | Status 'scheduled' | ✅ | `appointment.entity.ts` |
