# Prioridad de Requisitos No Funcionales — Usabilidad y Accesibilidad

## Decisión

La **usabilidad con enfoque en accesibilidad para adultos mayores** es el requisito no funcional prioritario del proyecto Piedrazul, por encima de rendimiento, seguridad o mantenibilidad.

## Contexto

- Usuarios target incluyen personas mayores con posible deterioro visual, motor o cognitivo
- El sistema se usa en entornos clínicos con luz variable y pantallas pequeñas (celulares)
- Adultos mayores en Latinoamérica tienen baja familiaridad con interfaces digitales

## Consecuencias

| Aspecto | Decisión |
|---------|----------|
| Tipografía | `font-size: 18px` base (vs 16px estándar) |
| Contraste | WCAG AAA (relación ≥7:1) |
| Touch targets | `min-height: 48px; min-width: 48px` |
| Estrategia | Mobile-First (no desktop-first) |
| Breakpoints | 480px / 768px / 1024px (ADR-027) |
| Diálogos | `<dialog>` nativo con errores inline (ADR-026) |
| Errores | Mensajes inline visibles, no alertas externas |
| Navegación | Roles con guards, rutas nombradas claras |
| Feedback visual | Signals reactivos, cambio de estado inmediato |

## Relación con otros NFRs

- **Rendimiento**: se sacrificó algo de velocidad de carga (texto más grande = más scroll) a favor de legibilidad
- **Seguridad**: CORS abierto en dev, CSP headers, JWT en localStorage — tradeoffs aceptados por usabilidad
- **Mantenibilidad**: la deuda técnica se documenta en ADRs; la prioridad es que el usuario final entienda y complete su tarea

## Evidencia en el código

- `AGENTS.md` línea 9: "Prioridad máxima para adultos mayores"
- `ADR-027` breakpoints mobile-first
- `ADR-026` errores inline sin Swal
- Componentes: `min-height: 48px` en todos los botones e inputs
- Paleta con contraste medido contra fondo
- `frontend/` usa CSS plano sin frameworks (ADR-023) para control total sobre accesibilidad
