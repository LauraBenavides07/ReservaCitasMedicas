# Reporte de Cobertura - Frontend (Angular)

**Fecha:** 2026-05-16  
**Estado Global:** 🟢 **82.05% Cobertura** (186 tests, 17 test suites)

---

## 📊 Resumen General

| Métrica           | Porcentaje |
|-------------------|:----------:|
| Statements        |   82.05%   |
| Branches          |   66.47%   |
| Functions         |   75.62%   |
| Lines             |   81.96%   |

---

## 💻 Estado por Módulo

### 1. Servicios - 🟢 100%
| Archivo         | Stmts  | Branch | Funcs  | Lines  |
|-----------------|:------:|:------:|:------:|:------:|
| AppointmentSvc  |  100%  |  100%  |  100%  |  100%  |
| AuthService     |  100%  | 83.33% |  100%  |  100%  |
| ConfigService   |  100%  |  100%  |  100%  |  100%  |
| DoctorService   |  100%  |  100%  |  100%  |  100%  |

### 2. Interceptores - 🟢 100%
| Archivo          | Stmts | Branch | Funcs | Lines |
|------------------|:-----:|:------:|:-----:|:-----:|
| authInterceptor  | 100%  |  100%  | 100%  | 100%  |

### 3. Componentes Doctor - 🟢 ~99%
| Componente        | Stmts  | Branch | Funcs  | Lines  |
|-------------------|:------:|:------:|:------:|:------:|
| Doctor Dashboard  | 97.12% | 88.67% | 89.74% | 96.99% |
| Doctor History    |  100%  | 80.32% |  100%  |  100%  |
| Doctor Patients   |  100%  |   80%  |  100%  |  100%  |

### 4. Autenticación - 🟢 ~99%
| Componente | Stmts  | Branch | Funcs  | Lines  |
|------------|:------:|:------:|:------:|:------:|
| Login      | 97.22% |  87.5% |  100%  | 97.05% |
| Register   |  100%  |   90%  |  100%  |  100%  |

### 5. Pacientes - 🟡 86-100%
| Componente            | Stmts  | Branch | Funcs  | Lines  |
|-----------------------|:------:|:------:|:------:|:------:|
| Patient Dashboard     | 86.44% | 81.25% | 78.26% | 85.96% |
| Patient Appt Form     |  100%  |   75%  |  100%  |  100%  |
| Appointment List      | 91.02% | 82.14% | 79.16% | 90.27% |

### 6. Zonas con baja cobertura 🔴
| Componente          | Stmts  | Branch | Funcs  | Lines  |
|---------------------|:------:|:------:|:------:|:------:|
| Appointment Form    | 33.70% | 22.22% |  37.5% | 34.93% |
| Admin Config        | 38.46% |    5%  | 26.66% | 38.57% |
| App Component       | 45.83% | 31.25% |   40%  | 43.47% |
| Landing Page        | 32.55% |    0%  | 22.22% |   30%  |

---

## 🚀 Roadmap de Calidad Sugerido

1. **Prioridad 1**: Completar tests para `AdminConfigComponent` y `AppointmentFormComponent` (flujo administrativo).
2. **Prioridad 2**: Tests para `LandingPage` y `AppComponent` (navegación general).
3. **Prioridad 3**: Mejorar cobertura de branches en componentes Doctor (actualmente ~80-88%).
4. **Prioridad 4**: Tests de integración E2E con Cypress/Playwright para flujo completo de agendamiento.

---

*Generado con `vitest run --coverage` (v8 provider)*
