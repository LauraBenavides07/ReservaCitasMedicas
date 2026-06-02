# Guía de API REST — Piedrazul Backend

**Base URL:** `http://localhost:3000`

---

## Autenticación

### `POST /auth/register`
Registro de paciente con auto-provisioning en Keycloak.

**Request:**
```json
{
  "document": "12345678",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "3001234567",
  "gender": "M",
  "email": "juan@email.com",
  "birthDate": "1990-05-15",
  "password": "miPassword123"
}
```

**Response `201`:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "id": "uuid",
    "document": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "patient"
  },
  "source": "local"
}
```

**Validaciones:**
| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `document` | string | sí | Único en sistema |
| `firstName` | string | sí | Máx 100 chars |
| `lastName` | string | sí | Máx 100 chars |
| `phone` | string | sí | Máx 20 chars |
| `gender` | string | sí | `M`, `F` o `O` |
| `email` | string | no | Validación regex email |
| `birthDate` | string | no | Formato ISO date |
| `password` | string | sí | Mín 8 caracteres |

**Errores:** `409 Conflict` si el documento ya existe.

---

### `POST /auth/login`
Inicio de sesión. Acepta documento o email como login.

**Request:**
```json
{
  "login": "12345678",
  "password": "miPassword123"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "id": "uuid",
    "document": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "role": "patient"
  },
  "source": "keycloak"
}
```

**Errores:** `401 Unauthorized` si credenciales inválidas.

---

### `GET /auth/patient/:document`
Busca paciente por documento.

**Response `200`:**
```json
{
  "id": "uuid",
  "document": "12345678",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "3001234567",
  "email": "juan@email.com"
}
```

---

## Citas (`/appointments`)

### `GET /appointments`
Lista citas por médico y fecha. **No requiere auth.**

| Query | Tipo | Obligatorio | Default |
|-------|------|-------------|---------|
| `doctorId` | UUID | sí | — |
| `date` | string (ISO) | sí | — |
| `skip` | number | no | `0` |
| `take` | number | no | `100` |

**Response `200`:** `[Appointment[], total: number]`

---

### `GET /appointments/available-slots`
Obtiene slots disponibles para un médico en una fecha. **No requiere auth.**

| Query | Tipo | Obligatorio |
|-------|------|-------------|
| `doctorId` | UUID | sí |
| `date` | string (ISO) | sí |

**Response `200`:** `string[]` — Ej: `["09:00", "09:30", "10:00", ...]`

---

### `GET /appointments/stats`
Estadísticas del dashboard. **No requiere auth.**

**Response `200`:**
```json
{
  "totalAppointments": 150,
  "todayAppointments": 12,
  "pendingCount": 5,
  "confirmedCount": 4,
  "completedCount": 3
}
```

---

### `GET /appointments/all`
Todas las citas (con relaciones). **Requiere auth.**

**Response `200`:** `Appointment[]`

---

### `GET /appointments/my-appointments`
Citas del paciente autenticado. **Requiere auth** (token JWT).

**Response `200`:** `Appointment[]`

---

### `GET /appointments/patient-by-document/:document`
Busca paciente por documento. **No requiere auth.**

**Response `200`:** Patient object

---

### `GET /appointments/:id/history`
Historial de cambios de una cita específica. **Requiere auth.**

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "appointmentId": "uuid",
    "changeType": "CREATED",
    "previousDate": null,
    "previousTime": null,
    "previousStatus": null,
    "newDate": null,
    "newTime": null,
    "newStatus": "PENDING",
    "changedBy": "staff@test.com",
    "changedByRole": "staff",
    "reason": null,
    "changedAt": "2026-05-25T10:00:00.000Z"
  }
]
```

---

### `GET /appointments/history/all`
Historial completo de cambios con filtros. **Requiere auth.**

| Query | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `changeType` | string | no | `CREATED`, `RESCHEDULED`, `CANCELLED`, `CONFIRMED`, `COMPLETED` |
| `doctorId` | UUID | no | Filtrar por médico |
| `date` | string (ISO) | no | Filtrar por fecha (cambios en ese día) |
| `search` | string | no | Búsqueda ILIKE por nombre de paciente o documento |
| `limit` | number | no | Default `50` |
| `appointmentId` | UUID | no | Filtrar por cita específica |

**Response `200`:**
```json
{
  "history": [ AppointmentHistoryEntryDto ],
  "total": 150
}
```

---

### `POST /appointments`
Crear una nueva cita. **Requiere auth.**

**Request:**
```json
{
  "patientDocument": "12345678",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "3001234567",
  "gender": "M",
  "email": "juan@email.com",
  "doctorId": "uuid-del-medico",
  "date": "2026-05-26",
  "time": "10:00"
}
```

**Validaciones:**
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `patientDocument` | string | sí |
| `firstName` | string | sí |
| `lastName` | string | sí |
| `phone` | string | sí |
| `gender` | string | no |
| `email` | string (email) | no |
| `doctorId` | UUID | sí |
| `date` | string (ISO date) | sí |
| `time` | string | sí |

**Errores:**
- `404` — Doctor no encontrado
- `400` — Fuera de ventana de tiempo, slot ocupado, excepción de agenda
- `409` — Conflicto de concurrencia (slot tomado entre validación y persistencia)

---

### `PATCH /appointments/:id/cancel`
Cancelar una cita. **Requiere auth.** Verifica permisos según rol.

**Errores:**
- `404` — Cita no encontrada
- `400` — Cita ya cancelada, completada, o pasada

---

### `PATCH /appointments/:id/confirm`
Confirmar una cita. **Requiere auth** (staff/doctor).

**Errores:** `400` si la cita está cancelada.

---

### `PATCH /appointments/:id/complete`
Completar una cita con diagnóstico. **Requiere auth** (doctor).

**Request:**
```json
{
  "observations": "Paciente presenta mejoría",
  "diagnosis": "J01.0 — Sinusitis aguda"
}
```

**Errores:** `400` si la cita está cancelada.

---

### `PATCH /appointments/:id/reschedule`
Reagendar una cita. **Requiere auth.**

**Request:**
```json
{
  "date": "2026-05-28",
  "time": "14:30"
}
```

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `date` | string (ISO) | sí |
| `time` | string | sí |
| `doctorId` | UUID | no (cambiar de médico) |

---

### `GET /appointments/export`
Exportar citas a CSV. **Requiere auth.**

| Query | Tipo | Obligatorio |
|-------|------|-------------|
| `date` | string (ISO) | sí |
| `doctorId` | UUID | sí |

**Response:** `Content-Type: text/csv` + descarga `citas-{date}.csv`

---

## Médicos (`/doctors`)

### `GET /doctors`
Lista todos los médicos activos.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Dr. Juan López",
    "specialty": "Cardiología",
    "scheduleStart": "08:00",
    "scheduleEnd": "18:00",
    "slotDuration": 30,
    "isActive": true,
    "activeDays": [1, 2, 3, 4, 5]
  }
]
```

---

### `GET /doctors/:id`
Detalle de un médico.

---

### `POST /doctors`
Crear médico. **Requiere auth** (admin).

**Request:**
```json
{
  "name": "Dr. Juan López",
  "specialty": "Cardiología",
  "scheduleStart": "08:00",
  "scheduleEnd": "18:00",
  "slotDuration": 30,
  "lunchStart": "12:00",
  "lunchEnd": "13:00",
  "activeDays": [1, 2, 3, 4, 5]
}
```

---

### `PATCH /doctors/:id`
Actualizar médico. **Requiere auth** (admin). Mismos campos que create pero todos opcionales.

---

### `DELETE /doctors/:id`
Eliminar médico. **Requiere auth** (admin).

---

### `GET /doctors/:id/exceptions`
Lista excepciones de agenda de un médico.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "doctorId": "uuid",
    "date": "2026-06-01",
    "reason": "Vacaciones",
    "createdAt": "2026-05-25T..."
  }
]
```

---

### `POST /doctors/:id/exceptions`
Agregar excepción. **Requiere auth** (admin).

**Request:**
```json
{
  "date": "2026-06-01",
  "reason": "Capacitación"
}
```

---

### `DELETE /doctors/:id/exceptions/:exceptionId`
Eliminar excepción. **Requiere auth** (admin).

---

## Configuración (`/configs`)

### `GET /configs`
Obtiene configuración global.

**Response `200`:**
```json
{
  "minAdvanceHours": 2,
  "appointmentWindowDays": 15
}
```

---

### `PATCH /configs`
Actualiza configuración global. **Requiere auth** (admin).

**Request:**
```json
{
  "minAdvanceHours": 4,
  "appointmentWindowDays": 30
}
```

| Campo | Tipo | Validación |
|-------|------|------------|
| `minAdvanceHours` | number | ≥ 1 |
| `appointmentWindowDays` | number | ≥ 1 |

---

## Notification Service

### `POST /notifications/email`
**Base URL:** `http://localhost:3001`

**Request:**
```json
{
  "to": "paciente@email.com",
  "subject": "Recordatorio de cita médica",
  "template": "appointment-reminder",
  "data": {
    "patientName": "Juan Pérez",
    "doctorName": "Dr. López",
    "date": "2026-05-26",
    "time": "10:00"
  }
}
```

### `POST /notifications/whatsapp`
**Request:**
```json
{
  "to": "+573001234567",
  "template": "appointment-confirmation",
  "data": { ... }
}
```

### `GET /notifications/log`
Lista logs de notificaciones enviadas.

| Query | Tipo | Descripción |
|-------|------|-------------|
| `limit` | number | Default 50 |

**Response `200`:**
```json
[
  {
    "id": 1,
    "evento": "appointment.created",
    "destinatario": "paciente@email.com",
    "fecha_envio": "2026-05-25T10:00:00.000Z",
    "estado": "enviado",
    "mensaje": "Cita creada exitosamente"
  }
]
```

### `GET /notifications/log/:id`
Detalle de un log específico.

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| `400 Bad Request` | Validación fallida, slot ocupado, ventana de tiempo, excepción |
| `401 Unauthorized` | Token inválido o expirado |
| `404 Not Found` | Recurso no encontrado (doctor, cita, paciente) |
| `409 Conflict` | Documento duplicado o concurrencia en slot |
| `500 Internal Server Error` | Error inesperado del servidor |
