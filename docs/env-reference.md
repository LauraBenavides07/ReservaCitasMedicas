# Referencia de Variables de Entorno

## Backend (`backend/.env`)

| Variable | Obligatorio | Default | Descripción |
|----------|-------------|---------|-------------|
| `DB_HOST` | sí | `localhost` | Host de PostgreSQL |
| `DB_PORT` | sí | `5432` | Puerto de PostgreSQL |
| `DB_USERNAME` | sí | `postgres` | Usuario de BD |
| `DB_PASSWORD` | sí | `postgres` | Contraseña de BD |
| `DB_DATABASE` | sí | `piedrazul` | Nombre de la base de datos |
| `KEYCLOAK_URL` | sí | `http://localhost:8080` | URL base de Keycloak |
| `KEYCLOAK_REALM` | sí | `piedrazul` | Realm de Keycloak |
| `KEYCLOAK_CLIENT_ID` | sí | `piedrazul-app` | Client ID de Keycloak |
| `JWT_SECRET` | sí | `PIEDRAZUL_SECRET_KEY` | Secreto para firmar JWT local |
| `RABBITMQ_URL` | no | `amqp://piedrazul:piedrazul_pass@localhost:5672` | URL de conexión RabbitMQ |

## Docker Compose (raíz `.env`)

| Variable | Obligatorio | Default | Descripción |
|----------|-------------|---------|-------------|
| `POSTGRES_USER` | sí | `postgres` | Usuario PostgreSQL para Docker |
| `POSTGRES_PASSWORD` | sí | — | Contraseña PostgreSQL |
| `RABBITMQ_USER` | sí | `piedrazul` | Usuario RabbitMQ |
| `RABBITMQ_PASS` | sí | — | Contraseña RabbitMQ |
| `KEYCLOAK_ADMIN` | sí | `admin` | Admin user de Keycloak |
| `KEYCLOAK_ADMIN_PASSWORD` | sí | — | Contraseña admin de Keycloak |
| `KC_DB_PASSWORD` | sí | — | Contraseña de Keycloak para PostgreSQL |

## Notification Service (`notification-service/.env`)

| Variable | Obligatorio | Default | Descripción |
|----------|-------------|---------|-------------|
| `DB_HOST` | sí | `localhost` | Host de PostgreSQL (notificaciones) |
| `DB_PORT` | sí | `5432` | Puerto |
| `DB_USERNAME` | sí | `postgres` | Usuario |
| `DB_PASSWORD` | sí | `postgres` | Contraseña |
| `DB_DATABASE` | sí | `notifications_db` | BD de logs de notificaciones |
| `RABBITMQ_URL` | sí | — | URL RabbitMQ para consumir eventos |
| `SMTP_HOST` | sí | — | Servidor SMTP |
| `SMTP_PORT` | sí | `587` | Puerto SMTP |
| `SMTP_USER` | sí | — | Usuario SMTP |
| `SMTP_PASS` | sí | — | Contraseña SMTP |
| `SMTP_FROM` | sí | — | Dirección remitente |

## Configuración por Defecto (Backend)

Valores iniciales de la tabla `configs`:

```json
{
  "minAdvanceHours": 2,
  "appointmentWindowDays": 15
}
```

- **`minAdvanceHours`**: mínimo de horas de anticipación para agendar
- **`appointmentWindowDays`**: días hacia adelante permitidos para agendar
