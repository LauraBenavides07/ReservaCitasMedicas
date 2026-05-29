# Despliegue en Oracle Cloud (Always Free)

Guía para publicar **Piedrazul** completo (Docker Compose) en una VM gratuita de Oracle Cloud.

## 1. Crear la VM en Oracle Cloud

1. Entra en [Oracle Cloud Console](https://cloud.oracle.com/).
2. **Compute → Instances → Create instance**.
3. Nombre: `piedrazul-prod`.
4. Imagen: **Ubuntu 22.04** o **24.04** (aarch64 recomendado — Ampere Always Free).
5. Shape: **VM.Standard.A1.Flex** (4 OCPU / 24 GB RAM máximo en free tier).
6. Red: asigna IP pública.
7. En **Networking → Security List**, abre reglas de entrada:
   - TCP **22** (SSH)
   - TCP **80** (HTTP)
   - TCP **443** (HTTPS, opcional con Certbot)
8. En **Advanced options → Cloud init**, pega el contenido de `deploy/oracle/cloud-init.yaml` **o** conéctate por SSH y ejecuta el script manualmente (paso 3).

## 2. Conectar por SSH

```bash
ssh ubuntu@TU_IP_PUBLICA
```

(En Oracle el usuario suele ser `ubuntu` o `opc` según la imagen.)

## 3. Instalar la aplicación

### Opción A — Script automático

```bash
curl -fsSL https://raw.githubusercontent.com/LauraBenavides07/ReservaCitasMedicas/develop/deploy/oracle/install.sh -o install.sh
sudo bash install.sh
```

### Opción B — Manual

```bash
sudo git clone -b develop https://github.com/LauraBenavides07/ReservaCitasMedicas.git /opt/piedrazul
cd /opt/piedrazul
sudo cp .env.oracle.example .env
sudo nano .env          # contraseñas + DEPLOY_HOST=TU_IP
sudo cp backend/.env.example backend/.env
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tools run --rm migrator
```

## 4. Enlaces

| Recurso | URL |
|---------|-----|
| **Aplicación** | `http://TU_IP_PUBLICA/` |
| **Login** | `http://TU_IP_PUBLICA/login` |

Sustituye `TU_IP_PUBLICA` por la IP que muestra Oracle en la instancia.

## 5. HTTPS con dominio (opcional)

Si tienes un dominio apuntando a la VM:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d tudominio.com
# Configura Nginx/Caddy delante del puerto 80 o integra certs en el contenedor frontend
```

Actualiza `DEPLOY_HOST=tudominio.com` en `.env` y reinicia:

```bash
cd /opt/piedrazul
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 6. Keycloak y datos iniciales

- Configura el realm según [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md).
- Datos de prueba: [seed-guide.md](./seed-guide.md).

## 7. Actualizar a una nueva versión

```bash
cd /opt/piedrazul
sudo git pull origin develop
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tools run --rm migrator
```

## 8. Comandos útiles

```bash
# Ver logs
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Estado
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Detener
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Requisitos mínimos

- ~6 GB RAM libres (Keycloak + 2× Postgres + RabbitMQ + backend + frontend).
- ~20 GB disco.
- Puertos **80** y **22** abiertos en Security List de Oracle.

## Solución de problemas

| Problema | Acción |
|----------|--------|
| No carga en el navegador | Revisa Security List (puerto 80) y `sudo ufw status` |
| Error al cargar citas | Ejecuta migraciones (`--profile tools run --rm migrator`) |
| Build Docker falla | Verifica RAM; `docker compose build --no-cache backend` |
| Keycloak no responde | Espera 2–3 min; `docker logs piedrazul-keycloak` |
