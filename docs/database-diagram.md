# Diagrama de Base de Datos — Piedrazul

## Esquema ER

```mermaid
erDiagram
    DOCTOR ||--o{ APPOINTMENT : has
    PATIENT ||--o{ APPOINTMENT : has
    APPOINTMENT ||--o{ APPOINTMENT_HISTORY : tracks
    DOCTOR ||--o{ DOCTOR_EXCEPTION : excludes

    DOCTOR {
        uuid id PK
        varchar name "NOT NULL"
        varchar specialty
        time schedule_start "DEFAULT '08:00'"
        time schedule_end "DEFAULT '18:00'"
        int slot_duration "DEFAULT 30"
        time lunch_start
        time lunch_end
        int[] active_days "DEFAULT [1,2,3,4,5]"
        timestamptz created_at
        timestamptz updated_at
    }

    PATIENT {
        uuid id PK
        varchar document UK "NOT NULL"
        uuid keycloak_id UK
        varchar first_name "NOT NULL"
        varchar last_name "NOT NULL"
        varchar phone "NOT NULL"
        varchar gender "CHECK M/F/O"
        date birth_date
        varchar email
        text diagnosis
        text observations
        varchar password
        timestamptz created_at
        timestamptz updated_at
    }

    APPOINTMENT {
        uuid id PK
        uuid doctor_id FK "NOT NULL"
        uuid patient_id FK "NOT NULL"
        date appointment_date "NOT NULL"
        time appointment_time "NOT NULL"
        varchar status "CHECK: agendada/confirmada/completada/cancelada"
        varchar created_by
        text observations
        text diagnosis
        timestamptz created_at
        timestamptz updated_at
    }

    APPOINTMENT_HISTORY {
        uuid id PK
        uuid appointment_id FK "CASCADE"
        varchar change_type "NOT NULL"
        date previous_date
        varchar previous_time
        varchar previous_status
        date new_date
        varchar new_time
        varchar new_status
        varchar changed_by "NOT NULL"
        varchar changed_by_role "NOT NULL"
        text reason
        timestamptz changed_at
    }

    DOCTOR_EXCEPTION {
        uuid id PK
        uuid doctor_id FK "CASCADE"
        date date "NOT NULL"
        text reason
        timestamptz created_at
    }

    CONFIG {
        uuid id PK
        varchar key UK "NOT NULL"
        jsonb value "NOT NULL"
        text description
        timestamptz updated_at
    }

    USER {
        uuid id PK
        varchar email UK "NOT NULL"
        uuid keycloak_id UK
        varchar password "NOT NULL"
        varchar first_name "NOT NULL"
        varchar last_name "NOT NULL"
        varchar role "CHECK: admin/staff/doctor"
        timestamptz created_at
        timestamptz updated_at
    }
```

## Índices

| Tabla | Índice | Tipo | Columnas |
|-------|--------|------|----------|
| `appointments` | `IDX_appointment_doctor_date_time` | UNIQUE B-tree | `doctor_id`, `appointment_date`, `appointment_time` |
| `appointments` | `IDX_appointment_doctor` | B-tree | `doctor_id` |
| `appointments` | `IDX_appointment_patient` | B-tree | `patient_id` |
| `appointments` | `IDX_appointment_date` | B-tree | `appointment_date` |
| `appointment_history` | `IDX_history_appointment` | B-tree | `appointment_id` |
| `doctor_exceptions` | `IDX_exception_doctor` | B-tree | `doctor_id` |
| `doctors` | `IDX_doctor_active_days` | GIN | `active_days` |
| `patients` | `IDX_patient_document` | UNIQUE B-tree | `document` |
| `patients` | `IDX_patient_keycloak` | UNIQUE B-tree | `keycloak_id` |
| `configs` | `IDX_config_key` | UNIQUE B-tree | `key` |
| `configs` | `IDX_config_value` | GIN | `value` |
| `users` | `IDX_user_email` | UNIQUE B-tree | `email` |
| `users` | `IDX_user_keycloak` | UNIQUE B-tree | `keycloak_id` |

## Constraints

- `appointments.status` → `CHECK (status IN ('agendada','confirmada','completada','cancelada'))`
- `patients.gender` → `CHECK (gender IN ('M','F','O'))`
- `patients.email` → `CHECK (email IS NULL OR email ~* '^[^@]+@[^@]+$')`
- `users.role` → `CHECK (role IN ('admin','staff','doctor'))`
- `appointment_history.change_type` → `CHECK (LENGTH(change_type) <= 30)`
- `configs.value` → `CHECK (jsonb_typeof(value) = 'object')`

## Relaciones

- `Appointment.doctor` → `Doctor.id` (OBLIGATORIO, una cita tiene un médico)
- `Appointment.patient` → `Patient.id` (OBLIGATORIO, una cita tiene un paciente)
- `AppointmentHistory.appointment` → `Appointment.id` (CASCADE, historial se elimina con la cita)
- `DoctorException.doctor` → `Doctor.id` (CASCADE, excepción se elimina con el médico)

## Notas

- `User` es para staff/admin/doctor que inician sesión con email+password
- `Patient` es para pacientes que se registran con documento
- `Config` almacena configuración global en JSONB (minAdvanceHours, appointmentWindowDays)
- `Doctor.active_days` es un array de enteros (1=lunes…7=domingo) indexado con GIN
- `DoctorException` permite bloquear días específicos por médico (vacaciones, capacitación)
- `AppointmentHistory` es un log de auditoría inmutable con todos los cambios de estado
