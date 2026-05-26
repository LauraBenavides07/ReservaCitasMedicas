# ADR-008: Modales Nativo `<dialog>` + SweetAlert2

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Usar `<dialog>` HTML nativo para modales operativos y SweetAlert2 solo para toasts/alertas fuera del diálogo

## Contexto

El sistema usa modales para: reagendar citas, completar citas, confirmar acciones. También necesita alertas de error/éxito. SweetAlert2 es popular pero tiene problemas con el top layer de `<dialog>` nativo.

## Opciones Consideradas

1. **`<dialog>` nativo + Swal fuera** — Modales con `<dialog>`, alertas con Swal cerrando el diálogo primero
2. **Solo `<dialog>` nativo** — Todo con `<dialog>` nativo, incluyendo confirmaciones
3. **Solo SweetAlert2** — Modales y alertas todo con Swal
4. **Angular Material Dialog** — Dependencia externa pesada

## Decisión

Se adoptó el patrón híbrido:
- **`<dialog>` nativo** para modales operativos (reagendar, completar cita, formularios)
- **SweetAlert2** solo para toasts/alertas que se muestran **fuera** del diálogo
- Regla crítica: siempre cerrar el `<dialog>` antes de mostrar Swal, guardando datos necesarios en variables locales
- Errores de validación dentro del modal se muestran con mensajes inline, no con Swal

## Consecuencias

- ✅ `<dialog>` nativo es liviano, accesible, y maneja el foco correctamente
- ✅ Sin conflictos de z-index (top layer del navegador)
- ✅ SweetAlert2 para toast notifications (feedback no bloqueante)
- ❌ Complejidad adicional: el código debe orquestar cierre/re-apertura de diálogos
- ❌ Dos sistemas de modales en el proyecto
- ⚠️ Regla documentada en AGENTS.md para evitar errores
