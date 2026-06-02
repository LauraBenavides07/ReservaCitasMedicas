# Guía de Contribución

## Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <descripción>

[tipo](ámbito): mensaje en presente
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio que no agrega feature ni corrige bug |
| `test` | Agregar o modificar tests |
| `docs` | Documentación |
| `chore` | Mantenimiento, dependencias, config |
| `style` | Formato, lint, whitespace |
| `perf` | Mejora de rendimiento |

**Ejemplos:**
```
feat(backend): add doctor exception management
fix(frontend): handle timezone in date format
refactor(core): extract availability validation service
test(backend): add appointment service unit tests
docs(readme): update setup instructions
```

## Workflow de Ramas

```
main          ── Producción (protegida)
  └── develop ── Integración continua
       ├── feat/nombre-corto      ← Nuevas features
       ├── fix/nombre-corto       ← Correcciones
       ├── refactor/nombre-corto  ← Refactors
       └── docs/nombre-corto      ← Documentación
```

**Reglas:**
1. Crear rama desde `develop`: `git checkout develop && git checkout -b feat/mi-feature`
2. Commits frecuentes con mensajes convencionales
3. PR a `develop` con descripción de cambios y tests asociados
4. `develop` se fusiona a `main` en releases

## Code Review Checklist

Antes de solicitar review, verificar:

- [ ] ¿El código sigue los estándares del proyecto (lint, tipos)?
- [ ] ¿Hay tests unitarios para la nueva funcionalidad?
- [ ] ¿Los tests existentes siguen pasando?
- [ ] ¿Se mantuvo el diseño mobile-first y accesibilidad?
- [ ] ¿Los nuevos strings están en español?
- [ ] ¿Se evitó mezclar `<dialog>` nativo con SweetAlert2?
- [ ] ¿Los endpoints tienen validación class-validator?
- [ ] ¿Los signals reemplazan BehaviorSubject para estado local?

## Estándares de Código

### Backend (NestJS)
```
backend/src/
├── application/
│   ├── ports/          ← Interfaces abstractas (I*Repository)
│   ├── services/       ← Lógica de negocio
│   └── abstractions/   ← Interfaces de infraestructura
├── domain/
│   └── entities/       ← Entidades con reglas de dominio
├── infrastructure/
│   ├── persistence/    ← Implementaciones TypeORM
│   ├── auth/           ← JWT, Keycloak, Guards
│   └── messaging/      ← RabbitMQ/Redis
└── presentation/
    ├── controllers/    ← REST endpoints
    └── dto/            ← Validación de datos
```

### Frontend (Angular)
```
frontend/src/app/
├── components/         ← Feature components (standalone)
├── services/           ← Angular Services
├── shared/atoms/       ← Componentes reutilizables (ButtonComponent)
├── interceptors/       ← HTTP interceptors
└── app.routes.ts       ← Routing con guards
```

### Convenciones Específicas

**Angular:**
- Componentes standalone, no NgModules
- Signals para estado síncrono (`signal()`, `computed()`, `effect()`)
- RxJS solo para HTTP y eventos asíncronos
- `ChangeDetection.OnPush` por defecto

**NestJS:**
- Inyección de dependencias vía constructor
- Puertos (interfaces) en `application/ports/`
- Implementaciones en `infrastructure/persistence/`
- DTOs con `class-validator` para validación

**Base de datos:**
- Nombres en `snake_case` para columnas y tablas
- `UUID` como primary key
- `TIMESTAMPTZ` para timestamps
- `TEXT` para strings (con CHECK para límites)

**Testing:**
- Backend: Jest con `TestingModule` y mocks
- Frontend: Vitest con `TestBed` y `vi.fn()`
- Nombrar tests con `debería` + descripción en español

## Configuración del Entorno Local

```bash
# 1. Clonar
git clone <repo>
cd ReservaCitasMedicas

# 2. Variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Base de datos (Docker)
docker compose up -d postgres

# 4. Backend
cd backend
pnpm install
npx ts-node seed.ts
pnpm start:dev

# 5. Frontend
cd ../frontend
pnpm install
pnpm start

# 6. Keycloak + RabbitMQ (opcional, para features completas)
docker compose up -d
```

## CI/CD

El pipeline (`.github/workflows/ci.yml`) ejecuta en cada push/PR a `main`/`develop`:

1. `pnpm install`
2. `pnpm run lint`
3. `pnpm run build`
4. `pnpm run test` (o `test:coverage`)
5. Upload coverage a artifacts

Matrix Node: `[20.x, 22.x]` para backend y frontend.
