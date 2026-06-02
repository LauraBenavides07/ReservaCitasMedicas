# Guía de Testing

## Backend (Jest)

### Comandos

```bash
cd backend

# Unit tests (30 suites, 157 tests)
pnpm test

# Con coverage
pnpm test:cov

# En modo watch
pnpm test:watch

# Integration tests (BD real requerida)
pnpm test:e2e

# Archivo específico
pnpm exec jest --forceExit src/application/services/appointment.service.spec.ts
pnpm exec jest --forceExit test/appointment.integration-spec.ts
```

### Estructura

```
backend/
├── src/
│   └── **/*.spec.ts          →  Unit tests (Jest, mocking NestJS TestingModule)
└── test/
    ├── *.integration-spec.ts →  Integration tests (BD real vía e2e.setup.ts)
    ├── e2e.setup.ts           →  Configuración de BD para integración
    ├── helpers.ts             →  Funciones auxiliares
    ├── jest-integration.json  →  Config Jest para integración
    └── jest-e2e.json          →  Config Jest para e2e
```

### Qué cubren los tests

| Archivo | Tests | Qué prueba |
|---------|-------|------------|
| `appointment.service.spec.ts` | 18 | CRUD, validaciones, historial, disponibilidad |
| `auth.service.spec.ts` | 13 | Register, login, keycloak, duplicados |
| `availability.service.spec.ts` | 15 | Slots, excepciones, ventana de tiempo |
| `config.service.spec.ts` | 5 | Get/update config |
| `doctor.service.spec.ts` | 7 | CRUD médicos |
| `doctor-exception.service.spec.ts` | 5 | Excepciones de agenda |
| *entities/*.spec.ts | 13 | Reglas de dominio (cancelación, permisos, horarios) |
| *controllers/*.spec.ts | 24 | HTTP endpoints con mocks |
| *infrastructure/*.spec.ts | 7 | JWT strategy, notificaciones |
| *integration* | 50+ | Flujos completos con BD real |
| `app.e2e-spec.ts` | 19 | E2E: appointment + auth + doctor |

### Patrón de Mocking

```typescript
// Servicio con repositorio mockeado
const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    AppointmentService,
    { provide: IAppointmentRepository, useValue: mockRepo },
  ],
}).compile();

service = module.get(AppointmentService);
```

## Frontend (Vitest)

### Comandos

```bash
cd frontend

# Todos los tests (19 suites, 225 tests)
pnpm test

# Con coverage
pnpm test:coverage

# En modo watch
pnpm exec vitest
```

### Archivos de test

| Archivo | Tests | Qué prueba |
|---------|-------|------------|
| `admin-audit.component.spec.ts` | 18 | Filtros, export CSV, formatos |
| `admin-config.component.spec.ts` | 10 | CRUD configuración |
| `appointment-form.component.spec.ts` | 10 | Creación de citas |
| `appointment-list.component.spec.ts` | 9 | Listado, filtros, reagendar |
| `doctor-dashboard.component.spec.ts` | 9 | Dashboard, completar citas |
| `doctor-history.component.spec.ts` | 9 | Historial de pacientes |
| `doctor-patients.component.spec.ts` | 9 | Lista de pacientes |
| `patient-dashboard.component.spec.ts` | 8 | Mis citas, reagendar |
| `patient-appointment-form.component.spec.ts` | 9 | Autoagendamiento wizard |
| `login.component.spec.ts` | 7 | Login form |
| `register.component.spec.ts` | 7 | Registro |
| `landing-page.spec.ts` | 1 | Página de inicio |
| `auth.service.spec.ts` | 5 | Auth service |
| `appointment.service.spec.ts` | 12 | Appointment service |
| `doctor.service.spec.ts` | 7 | Doctor service |
| `config.service.spec.ts` | 2 | Config service |
| `auth.interceptor.spec.ts` | 4 | HTTP interceptor |
| `app.component.spec.ts` | 4 | App shell |
| `app.spec.ts` | 4 | App root |

### Patrón de Mocking

```typescript
// Mock de servicios con Vitest
const mockService = {
  getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
};

await TestBed.configureTestingModule({
  imports: [ComponentToTest, FormsModule],
  providers: [
    { provide: DoctorService, useValue: mockService },
  ],
}).compileComponents();

// Mock de matchMedia (SweetAlert2 lo necesita)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});

// Mock de Swal para toasts
vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
```
