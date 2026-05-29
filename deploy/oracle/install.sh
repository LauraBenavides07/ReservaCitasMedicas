#!/usr/bin/env bash
# Instalación en Ubuntu 22.04/24.04 (Oracle Cloud Always Free VM)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/LauraBenavides07/ReservaCitasMedicas.git}"
BRANCH="${BRANCH:-develop}"
APP_DIR="${APP_DIR:-/opt/piedrazul}"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

log() { echo "[piedrazul] $*"; }

if [[ "${EUID:-0}" -ne 0 ]]; then
  log "Ejecuta con sudo: sudo bash deploy/oracle/install.sh"
  exit 1
fi

log "Instalando Docker si no existe..."
if ! command -v docker &>/dev/null; then
  apt-get update -qq
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

log "Clonando o actualizando código en ${APP_DIR}..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" --depth 1 "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  log "Creando .env desde plantilla..."
  cp .env.oracle.example .env
  PUBLIC_IP=$(curl -fsS --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  sed -i "s/TU_IP_PUBLICA/${PUBLIC_IP}/" .env
  log "IMPORTANTE: edita ${APP_DIR}/.env y cambia todas las contraseñas."
fi

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  sed -i 's/JWT_SECRET=.*/JWT_SECRET='"$(openssl rand -hex 32)"'/' backend/.env
fi

export DEPLOY_HOST="${DEPLOY_HOST:-$(grep '^DEPLOY_HOST=' .env | cut -d= -f2-)}"
log "DEPLOY_HOST=${DEPLOY_HOST}"

log "Construyendo e iniciando contenedores (puede tardar 10-20 min)..."
${COMPOSE} up -d --build

log "Esperando PostgreSQL..."
sleep 15

log "Ejecutando migraciones..."
${COMPOSE} --profile tools run --rm migrator || log "Aviso: migraciones fallaron o ya estaban aplicadas."

log "=========================================="
log "Despliegue listo."
log "App:  http://${DEPLOY_HOST}/"
log "Login: http://${DEPLOY_HOST}/login"
log "Keycloak (interno): configurar según docs/KEYCLOAK_SETUP.md"
log "=========================================="
log "Abre en Oracle Cloud los puertos 80 y 443 en la Security List de la VCN."
