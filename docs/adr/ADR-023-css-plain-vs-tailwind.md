# ADR-023: CSS Nativo en lugar de Tailwind

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** CSS plano con media queries, sin Tailwind ni frameworks CSS

## Contexto

El frontend necesita estilos para mobile-first, accesibilidad y colores corporativos.

## Opciones Consideradas

1. **CSS plano** — Archivos `.css` por componente con media queries y custom properties
2. **Tailwind CSS** — Utility-first, clases directamente en HTML
3. **Bootstrap** — Componentes pre-diseñados, grid system
4. **Angular Material** — Componentes Material Design, CDK

## Decisión

CSS plano con custom properties para la paleta de colores:
```css
:root {
  --color-primary: #3E7BA6;
  --color-secondary: #7FA5C9;
  --color-bg-soft: #CCE1F4;
  --color-bg-neutral: #F8F4F3;
}
```
Cada componente tiene su propio archivo CSS, usando Flexbox/Grid y media queries para responsividad. Sin dependencias de frameworks externos.

## Consecuencias

- ✅ Sin dependencias externas (menos peso, menos riesgo de breaking changes)
- ✅ Control total sobre estilos y accesibilidad (tamaños mínimos, contrastes)
- ✅ Custom properties para theming consistente
- ❌ Más código CSS manual (vs utility classes de Tailwind)
- ❌ Sin componentes pre-construidos (todo hay que diseñarlo desde cero)
- ❌ Sin CDK de Angular Material (modales, overlays, drag-drop)
