# Diagrama de Despliegue — C4 L4

```mermaid
C4Deployment
  title Diagrama de Despliegue — Piedrazul (Docker Compose)

  Person(user, "Usuario", "Navegador web")
  System_Ext(dns, "DNS", "piedrazul.local")

  Deployment_Node(host, "Servidor Docker", "Ubuntu 22.04 / Windows Docker Desktop") {
    Deployment_Node(compose, "Docker Compose", "Orquestación") {

      Deployment_Node(net_frontend, "Red: frontend", "bridge") {
        Deployment_Node(fe_container, "piedrazul-frontend", "Nginx + Angular") {
          Container(fe, "Frontend SPA", "Angular 19", "Servido por Nginx en puerto 80")
        }
      }

      Deployment_Node(net_backend, "Red: backend (internal)", "bridge — aislada") {
        Deployment_Node(be_container, "piedrazul-backend", "Node.js 20/22") {
          Container(be, "Backend API", "NestJS", "Puerto 3000, conecta a frontend vía red frontend")
        }

        Deployment_Node(pg_container, "piedrazul-postgres", "PostgreSQL 15 Alpine") {
          ContainerDb(pg, "PostgreSQL Principal", "postgres:15-alpine", "BD: piedrazul — citas, pacientes, médicos, usuarios, config")
        }

        Deployment_Node(pg_notif_container, "piedrazul-postgres-notifications", "PostgreSQL 15 Alpine") {
          ContainerDb(pg_notif, "PostgreSQL Notificaciones", "postgres:15-alpine", "BD: notifications_db — logs de envío")
        }

        Deployment_Node(rb_container, "piedrazul-rabbitmq", "RabbitMQ 3-management Alpine") {
          ContainerQueue(rb, "RabbitMQ", "rabbitmq:3-management", "Eventos asíncronos: appointments.*, reminders")
        }

        Deployment_Node(kc_container, "piedrazul-keycloak", "Keycloak 22.0.5 + PostgreSQL") {
          Container(kc, "Keycloak", "keycloak/keycloak:22.0.5", "Autenticación OIDC, realm Piedrazul, puerto 8080")
        }
      }
    }
  }

  Rel(user, dns, "Resuelve piedrazul.local", "DNS")
  Rel(user, fe, "HTTP", "Puerto 80")
  Rel(fe, be, "API REST", "HTTPS/JSON — red frontend")

  Rel(be, pg, "Persistencia principal", "SQL/TCP — red backend")
  Rel(be, pg_notif, "Logs de notificación", "SQL/TCP — red backend")
  Rel(be, rb, "Publica eventos", "AMQP — red backend")
  Rel(be, kc, "Autenticación y auto-provisioning", "OIDC/REST — red backend")
  Rel(kc, pg, "Persistencia de Keycloak", "JDBC — red backend (misma BD)")
```

## Puertos Expuestos

| Servicio | Puerto Host | Puerto Contenedor | Protocolo | Propósito |
|----------|-------------|-------------------|-----------|-----------|
| frontend | `80` | `80` | HTTP | SPA Angular servido por Nginx |
| backend | `3000` | `3000` | HTTP | API REST NestJS |
| keycloak | — | `8080` | HTTP | OIDC (solo interno, sin exponer) |

## Redes

| Red | Driver | Acceso | Servicios |
|-----|--------|--------|-----------|
| `frontend` | bridge | Público | frontend, backend |
| `backend` | bridge (internal) | Privado (solo Docker) | backend, postgres, postgres-notifications, rabbitmq, keycloak |

## Volúmenes Persistente

| Volumen | Montaje | Servicio |
|---------|---------|----------|
| `postgres_data` | `/var/lib/postgresql/data` | postgres |
| `postgres_notifications_data` | `/var/lib/postgresql/data` | postgres-notifications |
| `rabbitmq_data` | `/var/lib/rabbitmq` | rabbitmq |
| `keycloak_data` | `/opt/keycloak/data` | keycloak |

## Recursos Asignados

| Servicio | CPU Límite | Memoria Límite | CPU Reservada | Memoria Reservada |
|----------|-----------|---------------|--------------|------------------|
| backend | 1.0 | 512 MB | 0.25 | 256 MB |
| frontend | 0.5 | 256 MB | 0.1 | 128 MB |
| postgres | 0.5 | 512 MB | 0.1 | 256 MB |
| postgres-notifications | 0.5 | 256 MB | 0.1 | 128 MB |
| rabbitmq | 0.5 | 256 MB | 0.1 | 128 MB |
| keycloak | 1.0 | 1 GB | 0.25 | 512 MB |

## Notas de Despliegue

- **Notification Service** no está incluido en docker-compose.yml actual. Debe agregarse como servicio independiente conectado a la red `backend` y a `postgres-notifications`.
- Keycloak usa la misma instancia PostgreSQL que la aplicación (BD `keycloak`), separada por esquemas/bases de datos lógicas.
- La red `backend` es `internal: true` → no tiene acceso externo, solo entre contenedores Docker.
- Todos los servicios tienen `restart: unless-stopped` para auto-recuperación ante fallos.
- Los healthchecks evitan arrancar servicios dependientes antes de tiempo (ej: backend espera a postgres + rabbitmq + keycloak).
