# Especificación de Requisitos - Microservicio de Notificaciones (Fase 3)

## 1. Visión General
El Microservicio de Notificaciones es el encargado de aislar la lógica de comunicación con los pacientes, enviando mensajes transaccionales (WhatsApp y SMS) sobre el estado de sus citas médicas en Piedrazul. Este enfoque de microservicios permite escalar independientemente y evita bloquear el hilo principal de la API monolítica.

## 2. Arquitectura y Tecnologías
- **Framework:** NestJS
- **Arquitectura:** Hexagonal / Clean Architecture (dentro del microservicio)
- **Comunicación:** Patrón Event-Driven utilizando **RabbitMQ** como message broker.
- **Proveedores de Servicio:** 
  - API Oficial de WhatsApp Cloud 
- **Base de datos:** Ninguna o Redis (solo para tracking rápido de rate-limiting/circuit breaker). El estado de las citas reside en el monolito principal.

## 3. Eventos y Mensajes Soportados

El microservicio escuchará los siguientes eventos emitidos por el backend principal (Productor):

### 3.1. `appointment.created` (Confirmación)
- **Cuándo:** Tras guardar exitosamente una cita en la BD.
- **Payload:**
  - `appointmentId`
  - `patientPhone`
  - `patientName`
  - `doctorName`
  - `datetime`
- **Acción:** Envía mensaje de confirmación "Hola [Nombre], tu cita con [Médico] el [Fecha/Hora] ha sido confirmada."

### 3.2. `appointment.cancelled` (Cancelación)
- **Cuándo:** El paciente o agendador cancelan una cita.
- **Payload:** Mismos datos básicos, más el motivo (opcional).
- **Acción:** Envía mensaje "Tu cita del [Fecha/Hora] ha sido cancelada."

### 3.3. `appointment.reminder` (Recordatorios Automáticos)
- **Cuándo:** Disparado por un CRON Job en el backend principal (ej. cada día a las 8:00 AM) para las citas del día siguiente.
- **Payload:** Datos de la cita.
- **Acción:** Envía mensaje "Recordatorio: Tienes una cita médica programada para mañana a las [Hora] con [Médico]."

## 4. Criterios de Aceptación
- [ ] **Desacoplamiento:** Si el proveedor de WhatsApp/SMS falla o está lento, el usuario no experimentará retrasos al crear o cancelar su cita en la web.
- [ ] **Reintentos:** El microservicio debe contar con una política de reintentos en RabbitMQ (ej. Dead Letter Exchange) si falla el envío al API externa.
- [ ] **Trazabilidad:** Registrar logs (auditoría) de cada mensaje enviado o fallido.
- [ ] **Opt-out (opcional):** Manejo de respuestas donde el paciente pide no recibir más mensajes (fácil integración si se usa webhook bidireccional más adelante para el Bot de WhatsApp).

## 5. Diseño de API Externa (Terceros)
- Se definirán variables de entorno `.env` estrictas para tokens de API:
  - `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## 6. Pruebas y QA
- **Unitarias:** Pruebas de los handlers y servicios que construyen las plantillas de mensajes.
- **Integración:** Pruebas contra un contenedor local de RabbitMQ para verificar el consumo de eventos.
