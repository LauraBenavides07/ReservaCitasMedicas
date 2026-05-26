# ADR-005: Notificaciones Asíncronas vía Message Broker

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Notification Service separado con RabbitMQ para eventos asíncronos

## Contexto

El backend necesita enviar notificaciones (email, WhatsApp) cuando ocurren eventos: cita creada, cancelada, reagendada, recordatorio. Estos envíos no deben bloquear la respuesta HTTP.

## Opciones Consideradas

1. **Notificación síncrona** → El backend llama a nodemailer directamente
2. **Notification Service + RabbitMQ** → Servicio separado que consume eventos
3. **Solo cola en Redis** → Listas/pub-sub en Redis sin servicio separado

## Decisión

Se creó un **Notification Service como microservicio independiente**:
- Backend publica eventos en RabbitMQ (`AppointmentCreated`, `AppointmentCancelled`, `AppointmentReminder`)
- Notification Service consume y envía emails/WhatsApp
- Eventos compartidos definidos en `shared/events/`
- Cada envío se loguea en tabla `notificaciones`

## Consecuencias

- ✅ Desacoplamiento total: si el servicio de notificaciones cae, el backend sigue funcionando
- ✅ Reintentos naturales (RabbitMQ mantiene mensajes no entregados)
- ✅ Escalable: se pueden ejecutar múltiples instancias del notification service
- ❌ Mayor complejidad operativa (RabbitMQ + otro servicio)
- ❌ Latencia en la entrega (el paciente no recibe la notificación instantáneamente)
- ⚠️ En desarrollo se puede mockear el notification service o deshabilitar el envío
