## Code Context — Piedrazul (Reserva de Citas Médicas)

**Query:** Mapeo completo del repositorio Piedrazul

---

## Backend (`backend/`)

**Stack:** NestJS + TypeORM + PostgreSQL + JWT/Keycloak + pnpm

### Módulos

| Módulo | Archivo | Propósito |
|--------|---------|-----------|
| `AppModule` | `src/app.module.ts` | Módulo raíz. Importa `TypeOrmModule`, `AuthModule`, controladores y servicios globales. |
| `AuthModule` | `src/auth.module.ts` | Autenticación JWT + Keycloak + registro de pacientes. |

### Capa de Presentación (`src/presentation/`)

#### Controllers (`controllers/`)
| Controlador | Archivo | Rutas principales |
|-------------|---------|-------------------|
| `AppointmentController` | `appointment.controller.ts` | `GET /appointments?doctorId&date`, `POST /appointments`, `PATCH /:id/cancel`, `PATCH /:id/reschedule`, `PATCH /:id/confirm`, `PATCH /:id/complete`, `GET /history`, `GET /patient/:patientId` |
| `AuthController` | `auth.controller.ts` | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` |
| `ConfigController` | `config.controller.ts` | `GET /config`, `PUT /config` |
| `DoctorController` | `doctor.controller.ts` | `GET /doctors`, `POST /doctors`, `PUT /doctors/:id`, `GET /doctors/:id/slots?date`, `GET /doctors/:id/exceptions`, `POST /doctors/:id/exceptions`, `DELETE /doctors/:id/exceptions/:exceptionId` |

#### DTOs (`dto/`)
- `create-appointment.dto.ts` — Validación de creación de citas
- `appointment-history.dto.ts` — Filtros de historial (changeType, doctorId, date, search, limit)
- `complete-appointment.dto.ts` — Observaciones y diagnóstico
- `create-doctor.dto.ts`, `update-doctor.dto.ts` — CRUD de médicos
- `create-exception.dto.ts` — Excepciones de agenda
- `login.dto.ts`, `register.dto.ts` — Autenticación
- `update-config.dto.ts` — Configuración global

### Capa de Aplicación (`src/application/`)

#### Servicios (`services/`)
| Servicio | Archivo | Responsabilidad |
|----------|---------|----------------|
| `AppointmentService` | `appointment.service.ts` | CRUD citas, reagendar, cancelar, confirmar, completar, historial con filtros |
| `AuthService` | `auth.service.ts` | Register (auto-provisioning Keycloak), Login (local + Keycloak), Logout |
| `AvailabilityService` | `availability.service.ts` | Validar ventana de tiempo, slots disponibles, excepciones de doctor |
| `ConfigService` | `config.service.ts` | Obtener/actualizar configuración global (minAdvanceHours, appointmentWindowDays) |
| `DoctorService` | `doctor.service.ts` | CRUD médicos, slots, excepciones |
| `DoctorExceptionService` | `doctor-exception.service.ts` | Gestión de excepciones de agenda por médico |
| `PatientService` | `patient.service.ts` | Buscar o crear paciente por documento |
| `NotificationService` | `notification.service.ts` | Emitir eventos de notificación vía Redis/RabbitMQ |
| `ExportService` | `export.service.ts` | Exportación de datos (CSV vía Json2Csv) |
| `StatsService` | `stats.service.ts` | Estadísticas para dashboard |
| `AppointmentJobService` | `appointment-job.service.ts` | Tareas programadas (recordatorios, limpieza) |

#### Puertos (`ports/`) — Interfaces abstractas para repositories
| Puerto | Archivo |
|--------|---------|
| `IAppointmentRepository` | `appointment.repository.ts` |
| `IAppointmentHistoryRepository` | `appointment-history.repository.ts` |
| `IDoctorRepository` | `doctor.repository.ts` |
| `IDoctorExceptionRepository` | `doctor-exception.repository.ts` |
| `IPatientRepository` | `patient.repository.ts` |

#### Abstracciones (`abstractions/`)
- `icsv-exporter.interface.ts` — Interfaz para exportadores CSV
- `ihttp-client.interface.ts` — Interfaz HTTP client (usado en Keycloak)
- `ipassword-hasher.interface.ts` — Interfaz para hashear contraseñas

#### Utils
- `time.utils.ts` — Funciones auxiliares de tiempo

### Capa de Dominio (`src/domain/`)

#### Entidades (`entities/`)
| Entidad | Archivo | Columnas clave |
|---------|---------|----------------|
| `Appointment` | `appointment.entity.ts` | id, appointmentDate, appointmentTime, status, doctor (FK), patient (FK), observations, diagnosis, createdBy |
| `AppointmentHistory` | `appointment-history.entity.ts` | id, appointmentId, changeType, previousDate, previousTime, previousStatus, newDate, newTime, newStatus, changedBy, changedByRole, reason, doctorName, patientName |
| `Doctor` | `doctor.entity.ts` | id, name, specialty, scheduleStart, scheduleEnd, slotDuration, isActive |
| `DoctorException` | `doctor-exception.entity.ts` | id, doctor (FK), date, startTime, endTime, reason |
| `Patient` | `patient.entity.ts` | id, document, firstName, lastName, phone, email, gender, password |
| `User` | `user.entity.ts` | id, email, password, firstName, lastName, role (admin/doctor/staff) |
| `Config` | `config.entity.ts` | id, key, value (jsonb) |

#### Tipos (`types/`)
- `appointment-status.enum.ts` — SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
- `global-config.type.ts` — minAdvanceHours, appointmentWindowDays
- `keycloak.types.ts` — KeycloakUser, KeycloakTokenResponse

### Capa de Infraestructura (`src/infrastructure/`)

#### Persistencia (`persistence/`) — Implementaciones TypeORM de los puertos
| Repositorio | Archivo |
|-------------|---------|
| `TypeormAppointmentRepository` | `typeorm-appointment.repository.ts` |
| `TypeormAppointmentHistoryRepository` | `typeorm-appointment-history.repository.ts` |
| `TypeormDoctorRepository` | `typeorm-doctor.repository.ts` |
| `TypeormDoctorExceptionRepository` | `typeorm-doctor-exception.repository.ts` |
| `TypeormPatientRepository` | `typeorm-patient.repository.ts` |

#### Auth (`auth/`)
- `jwt.strategy.ts` — Estrategia Passport JWT (extrae usuario de la BD + Keycloak)
- `jwt-auth.guard.ts` — Guard para rutas protegidas
- `keycloak-config.ts` — Configuración de Keycloak (URL, realm, client)
- `keycloak.service.ts` — Integración con Keycloak (createUser, login, logout, refresh)
- `bcrypt-password-hasher.ts` — Implementación de IPasswordHasher con bcrypt
- `axios-http-client.ts` — Implementación de IHttpClient con Axios

#### Export (`export/`)
- `json2csv-exporter.ts` — Exportación CSV con Json2Csv

#### Messaging (`messaging/`)
- `notifications-client.module.ts` — Módulo cliente para RabbitMQ/Redis (conexión al notification-service)

### Tests
| Archivo | Tipo |
|---------|------|
| `src/**/*.spec.ts` | Unit tests (Jest, 30 suites, 157 tests) |
| `test/*.integration-spec.ts` | Integration tests (app, appointment, config, doctor) |
| `test/e2e.setup.ts` | Setup para tests e2e |
| `test/helpers.ts` | Helpers de testing |

### Configuración
- `eslint.config.mjs` — ESLint flat config
- `pnpm-workspace.yaml` — Workspace pnpm
- `seed.ts` — Seed de datos iniciales (admin, doctores, pacientes)

---

## Frontend (`frontend/`)

**Stack:** Angular 19 standalone + Signals + Vitest + SweetAlert2

### Routing (`src/app/app.routes.ts`)
| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | LandingPageComponent | — |
| `/login` | LoginComponent | — |
| `/register` | RegisterComponent | — |
| `/citas` | AppointmentListComponent | JwtAuthGuard (staff/admin) |
| `/agendar` | AppointmentFormComponent | JwtAuthGuard (staff/admin) |
| `/paciente/agendar` | PatientAppointmentFormComponent | JwtAuthGuard (patient) |
| `/paciente/miscitas` | PatientDashboardComponent | JwtAuthGuard (patient) |
| `/medico/dashboard` | DoctorDashboardComponent | JwtAuthGuard (doctor) |
| `/medico/pacientes` | DoctorPatientsComponent | JwtAuthGuard (doctor) |
| `/medico/historial` | DoctorHistoryComponent | JwtAuthGuard (doctor) |
| `/admin/configuracion` | AdminConfigComponent | JwtAuthGuard (admin) |
| `/admin/auditoria` | AdminAuditComponent | JwtAuthGuard (admin) |

### Componentes (`components/`)
| Componente | Archivo | Funcionalidad |
|-----------|---------|---------------|
| `AdminAuditComponent` | `admin-audit/` | Historial de cambios con filtros (tipo, médico, fecha, búsqueda), export CSV |
| `AdminConfigComponent` | `admin-config/` | Configuración global (ventana de tiempo, horas mínimas) |
| `AppointmentFormComponent` | `appointment-form/` | Creación de citas (staff/admin) con búsqueda de paciente |
| `AppointmentListComponent` | `appointment-list/` | Listado de citas por médico/fecha, reagendar, cancelar |
| `AppointmentHistoryTimelineComponent` | `appointment-history-timeline/` | Línea de tiempo del historial de una cita |
| `DoctorDashboardComponent` | `doctor-dashboard/` | Dashboard del médico (citas del día, confirmar, completar) |
| `DoctorHistoryComponent` | `doctor-history/` | Historial de pacientes del médico |
| `DoctorPatientsComponent` | `doctor-patients/` | Lista de pacientes del médico |
| `LandingPageComponent` | `landing-page/` | Página de inicio |
| `LoginComponent` | `login/` | Inicio de sesión |
| `PatientAppointmentFormComponent` | `patient-appointment-form/` | Autoagendamiento del paciente (wizard: doctor → fecha → slot → confirmación) |
| `PatientDashboardComponent` | `patient-dashboard/` | Dashboard del paciente (mis citas, reagendar) |
| `RegisterComponent` | `register/` | Registro de paciente |

### Servicios (`services/`)
| Servicio | Archivo | Métodos principales |
|----------|---------|---------------------|
| `AppointmentService` | `appointment.service.ts` | CRUD citas, getAllHistory con filtros, reschedule, cancel, confirm, complete |
| `AuthService` | `auth.service.ts` | login, register, logout, user signal, token management |
| `ConfigService` | `config.service.ts` | getConfig, updateConfig |
| `DoctorService` | `doctor.service.ts` | CRUD doctores, excepciones, slots disponibles |

### Otros
- `auth.interceptor.ts` — Interceptor HTTP que agrega token JWT y maneja 401
- `app.config.ts` — Configuración de Angular (providers, HTTP interceptors)
- `app.component.ts` — Componente raíz con navbar responsive y lógica de roles

### Tests
- 19 test files, 225 tests (Vitest + jsdom)
- Cobertura: todos los componentes y servicios tienen spec

---

## Notification Service (`notification-service/`)

**Stack:** NestJS standalone + nodemailer + RabbitMQ/Redis

### Estructura

| Archivo | Propósito |
|---------|-----------|
| `src/notifications/notifications.module.ts` | Módulo de notificaciones |
| `src/notifications/notifications.controller.ts` | Endpoints: `POST /notifications/email`, `POST /notifications/whatsapp`, `GET /notifications/log`, `GET /notifications/log/:id` |
| `src/notifications/email.service.ts` | Envío de emails vía nodemailer |
| `src/notifications/whatsapp.service.ts` | Envío de WhatsApp (mock/placeholder) |
| `src/notifications/template.service.ts` | Renderizado de plantillas de notificación |
| `src/notifications/notification-log.entity.ts` | Entidad NotificationLog (id, type, recipient, subject, status, error, createdAt) |
| `src/notifications/notification-log.service.ts` | Persistencia de logs de notificación |
| `src/app.module.ts` | Módulo raíz |
| `src/main.ts` | Bootstrap, conexión a RabbitMQ para consumir eventos |

### Tests
- 6 spec files (email, whatsapp, template, notification-log, controller, app)

---

## Shared (`shared/`)

### Eventos (`shared/events/`)
| Evento | Descripción |
|--------|-------------|
| `appointment-created.event.ts` | Disparado al crear cita |
| `appointment-cancelled.event.ts` | Disparado al cancelar cita |
| `appointment-reminder.event.ts` | Disparado para recordatorio |
| `index.ts` | Re-exporta todos los eventos |

---

## Infraestructura General

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Servicios: PostgreSQL, Redis, RabbitMQ, Keycloak |
| `.github/workflows/ci.yml` | CI/CD: matrix Node 20.x y 22.x, lint, build, test, coverage |
| `pnpm-workspace.yaml` | Workspace raíz (backend, frontend, notification-service) |

---

## Estado del Proyecto

| Métrica | Backend | Frontend | Notification Service |
|---------|---------|----------|---------------------|
| Tests | 157 (30 suites) | 225 (19 suites) | — |
| Lint | 0 errors, 0 warnings | — | — |
| Build | OK | OK | — |
| Coverage | Subido en CI | Subido en CI | — |


