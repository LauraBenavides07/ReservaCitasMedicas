# Implementación del Microservicio de Notificaciones

## Resumen
Se añadió un nuevo microservicio **notification‑service** basado en NestJS que consume eventos publicados por el backend principal mediante **RabbitMQ** y envía mensajes de confirmación, recordatorio y cancelación a través de la **WhatsApp Cloud API** (Meta).

## Arquitectura
- **Backend principal** (NestJS) → Publica eventos `appointment.created`, `appointment.cancelled` y `appointment.reminder` usando un `ClientProxy` configurado con transport **RMQ**.
- **RabbitMQ** (contenedor Docker) actúa como **message broker** persistente.
- **Microservicio de notificaciones** (NestJS) → Se conecta como consumidor a la cola `notifications_queue` y maneja los eventos mediante `@EventPattern`.
- **WhatsApp Cloud API** → Servicio `WhatsAppService` que envía mensajes usando plantillas pre‑aprobadas.
- **Shared contracts** bajo `shared/events/` permiten a ambos proyectos compartir tipos TS y mantener consistencia.

## Principales cambios
| Área | Archivo / Directorio | Descripción |
|------|-----------------------|------------|
| **Infraestructura** | `docker-compose.yml` | Añadido servicio `rabbitmq:3-management-alpine` (puertos 5672, 15672). |
| **Contratos** | `shared/events/*.ts` | Interfaces para `AppointmentCreatedEvent`, `AppointmentCancelledEvent`, `AppointmentReminderEvent`. |
| **Backend** | `src/infrastructure/messaging/notifications-client.module.ts` | Configura `ClientProxy` con RMQ. |
|  | `src/app.module.ts` | Importa `NotificationsClientModule`. |
|  | `src/application/services/appointment.service.ts` | Inyecta `notificationClient`, emite eventos en create/cancel y añade CRON (8 am) para recordatorios. |
|  | `.env` | Variable `RABBITMQ_URL`. |
| **Microservicio** | `notification-service/` (nuevo proyecto NestJS) | Contiene módulo `NotificationsModule`, controlador y servicios (`WhatsAppService`, `TemplateService`). |
|  | `notification-service/.env.example` | Variables `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `RABBITMQ_URL`. |
|  | Tests | `src/notifications/*.spec.ts` – 12 pruebas unitarias pasan. |

## Flujo de trabajo
1. Usuario agenda/cancela cita → Backend guarda en PostgreSQL. 
2. Backend **emite** evento a RabbitMQ. 
3. `notification-service` recibe el evento, construye mensaje y llama a la API de WhatsApp. 
4. En caso de error, el mensaje se re‑intenta automáticamente gracias a la configuración de colas persistentes.
5. Cada mañana a las 8 am se ejecuta un **cron** que envía recordatorios para citas del día siguiente.

## Cómo ejecutar
```bash
# Levantar infraestructura
docker compose up -d   # PostgreSQL, Keycloak, RabbitMQ

# Backend
cd backend
npm install
npm run start:dev   # API en http://localhost:3000

# Microservicio de notificaciones
cd notification-service
cp .env.example .env   # rellenar credenciales WhatsApp
npm install
npm run start:dev   # escucha en http://localhost:3001
```

## Tests
```bash
# backend tests
npm test
# microservicio tests
cd notification-service && npm test
```

---
*Documentado siguiendo la convención de la carpeta `docs/notification-service`.*
