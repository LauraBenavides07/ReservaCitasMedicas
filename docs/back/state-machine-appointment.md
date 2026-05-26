# Diagrama de Estados — Appointment (Cita Médica)

```mermaid
stateDiagram-v2
    [*] --> AGENDADA : create()
    AGENDADA --> CONFIRMADA : confirm()
    AGENDADA --> CANCELADA : cancel()
    AGENDADA --> AGENDADA : reschedule(nueva fecha/hora)
    CONFIRMADA --> COMPLETADA : complete(observations, diagnosis)
    CONFIRMADA --> CANCELADA : cancel()
    CONFIRMADA --> AGENDADA : reschedule(nueva fecha/hora)
    COMPLETADA --> [*]
    CANCELADA --> [*]

    note right of AGENDADA
        isScheduled() = true
        isInFuture() debe ser true
        canBeRescheduled() = true
        canBeCancelled() = true
    end note

    note right of CONFIRMADA
        isCancelled() = false
        canBeRescheduled() = true (solo staff)
        canBeConfirmed() = true
    end note

    note right of COMPLETADA
        isCompleted() = true
        Estado terminal
        Solo lectura
    end note

    note right of CANCELADA
        isCancelled() = true
        Estado terminal
        Solo lectura
    end note
```

## Transiciones y Validaciones

| Desde | Hasta | Método | Validaciones | Actor |
|-------|-------|--------|-------------|-------|
| `[*]` | `AGENDADA` | `create()` | Slot disponible, ventana de tiempo, sin excepción | Staff/Admin/Paciente |
| `AGENDADA` | `CONFIRMADA` | `confirm()` | `canBeConfirmed()` → `!isCancelled()` | Staff/Doctor |
| `AGENDADA` | `CANCELADA` | `cancel()` | `canBeCancelled()` → `!isCancelled() && !isCompleted() && isInFuture()` | Staff/Paciente (dueño) |
| `AGENDADA` | `AGENDADA` | `reschedule()` | `canBeRescheduled()` → `isScheduled()`, nuevo slot válido | Staff/Paciente (dueño) |
| `CONFIRMADA` | `COMPLETADA` | `complete()` | `!isCancelled()`, requiere observaciones/diagnóstico opcional | Doctor |
| `CONFIRMADA` | `CANCELADA` | `cancel()` | `canBeCancelled()` | Staff/Doctor |
| `CONFIRMADA` | `AGENDADA` | `reschedule()` | `canBeRescheduled()` → `isScheduled() \|\| status === CONFIRMED` | Staff |

## Reglas de Dominio

- **`isInFuture()`**: compara `appointmentDate + appointmentTime` con `new Date()`
- **`isOwnedBy(patientId)`**: el paciente es dueño de la cita si `patient.id === patientId`
- **`belongsToDoctor(doctorId)`**: el doctor es el asignado si `doctor.id === doctorId`
- **Auditoría**: cada transición genera un registro en `AppointmentHistory` con `changeType`, valores anteriores y nuevos, `changedBy` y `changedByRole`
- **Notificaciones**: las transiciones `CREATED`, `CANCELLED`, `RESCHEDULED`, `CONFIRMED` publican eventos a RabbitMQ
