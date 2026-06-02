# ADR-026: Errores Inline en Modales en lugar de SweetAlert2

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Errores de validación y API dentro de `<dialog>` se muestran inline, no con SweetAlert2

## Contexto

Cuando un usuario está dentro de un modal `<dialog>` y ocurre un error (validación de formulario, error del backend), se necesita mostrar el mensaje sin romper el flujo del modal. SweetAlert2 no es viable porque se renderiza detrás del top layer del `<dialog>`.

## Opciones Consideradas

1. **Mensaje inline** — Div oculto dentro del `<dialog>` que se muestra condicionalmente
2. **Cerrar diálogo + Swal** — Cerrar el modal, mostrar Swal, y si el usuario cancela, reabrir
3. **Toast dentro del diálogo** — Notificación tipo toast dentro del modal
4. **No mostrar error** — Simplemente ignorar el error

## Decisión

Mensajes inline con un `signal<string | null>`:
```typescript
errorMessage = signal<string | null>(null);
this.errorMessage.set('El campo es obligatorio');
```
```html
<div *ngIf="errorMessage()" class="inline-error" role="alert">
  {{ errorMessage() }}
</div>
```

## Consecuencias

- ✅ El usuario ve el error sin interrumpir el flujo del modal
- ✅ Sin conflictos de top layer (el error está dentro del `<dialog>`)
- ✅ Accesible (role="alert", leído por screen readers)
- ❌ Menos visible que un toast o alerta centrada
- ❌ Hay que gestionar el estado de error manualmente (signal + limpieza)
