# Reporte de Cobertura y Calidad - Backend Piedrazul

**Fecha:** 2026-05-16  
**Estado Global:** 🟢 **82% Cobertura Promedio (Core Logic)**

---

## 🛡️ Lo que ESTÁ Cubierto (Blindado)

### 1. Lógica de Negocio (Services) - ~81%
*   **Gestión de Citas**: 
    *   Validación de ventanas de tiempo (min 2h, max 15 días).
    *   Respeto estricto de horarios de almuerzo y días laborables del médico.
    *   Manejo de excepciones médicas (días libres).
    *   Cancelación y validación de propiedad (un paciente no puede cancelar citas ajenas).
*   **Autenticación**:
    *   Flujo híbrido Keycloak + Base de Datos Local.
    *   Auto-provisionamiento de usuarios (si Keycloak falla o el usuario es nuevo).
    *   Vinculación perezosa (Lazy Linking) de identidades.
*   **Médicos**:
    *   CRUD completo y validación de borrado (no se borran médicos con citas activas).

### 2. Capa de Entrada (Controllers) - 96%
*   Todos los endpoints de Citas, Médicos, Configuración y Autenticación tienen tests que verifican la delegación correcta al servicio y el manejo de parámetros.

### 3. Integridad de Datos (DTOs) - 100%
*   Validación de formatos de entrada (documentos, correos, géneros) mediante `class-validator`.

---

## ⚠️ Lo que NO está Cubierto (Sincinceridad Técnica)

### 1. Infraestructura de Seguridad (Estrategias JWT) - 0%
*   **Riesgo**: Aunque los `Guards` funcionan, la lógica interna de la `JwtStrategy` (cómo se extrae el ID de Keycloak y se inyecta en el objeto `Request`) no tiene pruebas unitarias. Si Keycloak cambia el formato de su token, los tests actuales no lo detectarían.

### 2. Procesos Automáticos (Cron Jobs) - Parcial
*   **Estado**: Probamos que el método se ejecute, pero no hemos probado casos de borde complejos (ej: ¿qué pasa si el servidor se apaga justo cuando el Cron está marcando citas como completadas?).

### 3. Casos de Borde en Reprogramación - Parcial
*   **Gaps**: Falta cubrir el escenario donde un paciente intenta reprogramar una cita que ya ha sido marcada como "completada" por el sistema.

### 4. Boilerplate de NestJS - 0%
*   `main.ts`, `app.module.ts`, `auth.module.ts`. No tienen tests (estándar en NestJS para tests unitarios, pero deja una brecha en tests de humo/arranque).

---

## 🚀 Próximos Pasos Recomendados (Roadmap)

1.  **Implementar Tests de Integración (e2e)**: Para cubrir el flujo completo "Registro -> Login -> Agendar" y llenar los huecos del `AppModule`.
2.  **Blindar `JwtStrategy`**: Crear mocks para los payloads de Keycloak y asegurar que la extracción de roles y documentos sea infalible.
3.  **Tests de Stress (Opcional)**: Verificar que la búsqueda de disponibilidad no se degrade con miles de citas en la base de datos.

---
*Este reporte refleja el estado actual del repositorio y debe ser actualizado tras cada sprint de calidad.*
