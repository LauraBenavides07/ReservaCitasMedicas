# Reporte de Cobertura - Frontend (Angular)

**Fecha:** 2026-05-16  
**Estado Global:** 🟡 **~50% Cobertura**

## 💻 Estado de los Módulos

### 1. Servicios de Comunicación - 🟢 ~90%
*   **Cubierto**: `AppointmentService`, `AuthService`, `ConfigService`, `DoctorService`.
*   **Garantía**: Las peticiones HTTP, el manejo de tokens y la transformación de datos entre el backend y la UI están totalmente validados.

### 2. Componentes de Interfaz (UI) - 🔴 ~35%
*   **Lo que ESTÁ cubierto**:
    *   **Patient Dashboard**: Blindado contra errores de flujo de citas.
    *   **Login**: Validado el acceso y redirecciones.
*   **Lo que NO está cubierto (Zonas Críticas)**:
    *   **Doctor Dashboard**: **0%**. Es el módulo más complejo y no tiene pruebas automáticas.
    *   **Admin Panel (Configuración)**: **0%**.
    *   **Registro de Pacientes**: Cobertura parcial en las validaciones de formularios.

---
## 🚀 Roadmap de Calidad Sugerido
1.  **Prioridad 1**: Iniciar tests unitarios para `DoctorDashboardComponent`.
2.  **Prioridad 2**: Implementar tests de integración con Cypress o Playwright para cubrir el flujo completo de agendamiento desde la perspectiva del usuario.
