1. Decisiones y Arquitectura
¿Por qué RabbitMQ?
100% gratuito si se ejecuta como contenedor Docker (sin límites de mensajes ni costos sorpresa).

Entrega confiable: colas persistentes, confirmaciones (ack) y reintentos automáticos. Si el servicio de notificaciones se cae, los mensajes no se pierden.

Sencillez para este caso de uso: modelo de colas de trabajo perfecto para tareas asíncronas como envío de recordatorios, sin la complejidad de un log de eventos como Kafka.

¿Por qué WhatsApp Cloud API (Meta)?
Capa gratuita permanente: 1.000 conversaciones iniciadas por el negocio al mes sin costo.

Alta adopción en Colombia: los adultos mayores usan WhatsApp intensamente; un recordatorio directo por esta vía tiene mayor tasa de lectura que un SMS o un correo.

Alternativa sólida a Twilio: Twilio ofrece solo créditos temporales; Meta permite operación real sin tarjeta de crédito ni pagos recurrentes mientras se respete el límite mensual.

¿Por qué un monorepo?
Coherencia temprana: compartir interfaces de eventos (p. ej., AppointmentCreatedEvent) sin preocuparse por versionado.

Despliegue simplificado: todo en el mismo repositorio, mismo pipeline de CI/CD.

Facilidad de refactorización: se puede extraer a un repositorio propio cuando el equipo o la escala lo requieran.

2. Integración – Componentes y pasos
2.1. Infraestructura (Docker)
Añadir RabbitMQ al docker-compose.yml existente (junto a PostgreSQL y Keycloak).

Imagen ligera: rabbitmq:3-management-alpine.

Puertos: 5672 (aplicaciones), 15672 (consola web).

2.2. Contrato de mensajes
Carpeta /shared en la raíz del proyecto con las interfaces TypeScript.

Ejemplo: AppointmentCreatedEvent con campos como patientPhone, doctorName, date, time.

Ambos servicios (backend y notificaciones) importan desde allí.

2.3. Backend principal (publicador)
Usa @nestjs/microservices con transporte RMQ.

Inyecta un ClientProxy (NOTIFICATION_SERVICE) emitiendo eventos appointment.created y appointment.cancelled.

Publicación fire-and-forget: no espera respuesta, solo garantiza la entrega a la cola.

2.4. Microservicio de notificaciones (consumidor)
Aplicación NestJS independiente, sin controladores HTTP.

Se conecta a la misma cola notifications_queue.

Recibe los eventos con decoradores @EventPattern.

Llama al servicio WhatsAppService que usa Axios para invocar la API de Meta.

2.5. Configuración de WhatsApp Cloud API (una sola vez)
Crear app en Meta for Developers, agregar producto WhatsApp.

Obtener un número de teléfono de prueba (sandbox) o verificar un número real.

Generar token de acceso (temporal de 23 h para desarrollo; permanente con verificación de negocio).

Crear y aprobar las plantillas de mensaje (cita_confirmacion, cita_cancelada) con parámetros en español.

Guardar WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en el .env del microservicio.

3. Funcionamiento paso a paso
Un usuario agenda una cita desde el frontend Angular. El backend principal recibe la solicitud HTTP.

El backend guarda la cita en PostgreSQL y luego emite un evento appointment.created al ClientProxy de RabbitMQ.

RabbitMQ encola el mensaje en notifications_queue. Si el microservicio está caído, el mensaje dura hasta que se consuma.

El Notification Service consume el mensaje, extrae los datos y construye la solicitud a la API de WhatsApp.

Envía el mensaje usando una plantilla preaprobada (ej. "Hola María, tu cita con Dr. Juan (Fisioterapia) es el 10/05/2026 a las 15:00").

Confirmación: si WhatsApp responde con éxito, se confirma el ack y el mensaje se elimina de la cola. Si falla, RabbitMQ reintenta (según la configuración de dead letter y TTL).

Límite gratuito: se puede añadir un contador que, al acercarse a las 1.000 conversaciones, envíe por correo electrónico (SendGrid gratuito) o alerte al administrador.

Cancelaciones siguen el mismo flujo con un tipo de evento y plantilla diferente.

Conclusión
Con esta arquitectura se logra un sistema de notificaciones asíncrono, confiable y completamente gratuito en operación. RabbitMQ garantiza que ningún recordatorio se pierda, y la capa gratuita de WhatsApp Cloud API mantiene el costo en cero mientras el volumen mensual se mantenga por debajo de 1.000 conversaciones. El monorepo conserva la agilidad de desarrollo actual y prepara al proyecto para escalar si en el futuro se requiere.