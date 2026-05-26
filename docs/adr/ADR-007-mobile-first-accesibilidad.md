# ADR-007: Mobile-First y Accesibilidad para Adultos Mayores

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Diseño Mobile-First con WCAG AAA para adultos mayores

## Contexto

El sistema es usado por pacientes adultos mayores en clínicas. Muchos acceden desde celulares y pueden tener visión reducida o problemas de motricidad fina.

## Opciones Consideradas

1. **Mobile-First + WCAG AAA** — Diseño desde la pantalla más pequeña, tipografía grande, touch targets
2. **Desktop-First** — Diseñar para PC, adaptar a mobile después
3. **Responsive estándar** — Sin foco específico en accesibilidad

## Decisión

Se adoptaron reglas estrictas desde el inicio:
- **Tipografía**: `font-size: 18px` base (mínimo legible para adultos mayores)
- **Touch targets**: `min-height: 48px; min-width: 48px` en todos los interactivos
- **Contraste WCAG AAA**: ratio ≥7:1 para texto normal, ≥4.5:1 para texto grande
- **Layout**: Flexbox/Grid responsive sin scroll horizontal
- **Paleta de alto contraste**: azul `#3E7BA6` sobre fondo `#F8F4F3`
- **Semántica HTML5**: etiquetas correctas (`<nav>`, `<main>`, `<button>`, `<dialog>`)

## Consecuencias

- ✅ Accesible para adultos mayores desde el día uno
- ✅ Bueno para SEO (semántica HTML5)
- ✅ Experiencia consistente en cualquier dispositivo
- ❌ Más espacio vertical requerido (menos información en pantalla)
- ❌ Diseño de componentes más restrictivo (tamaños mínimos fijos)
- ❌ Algunos diseños "modernos" (menús hamburguesa pequeños, sliders finos) no son viables
