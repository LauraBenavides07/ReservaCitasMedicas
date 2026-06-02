# Button Component - Atomic Design

Componente reutilizable y accesible para botones en toda la aplicación.

## 📋 Instalación

El componente ya está disponible en `shared/atoms/button`. Simplemente importalo en tu componente:

```typescript
import { ButtonComponent } from '../../shared/atoms/button/button.component';

@Component({
  imports: [ButtonComponent, CommonModule, ReactiveFormsModule]
})
export class MyComponent {}
```

## 🎨 Variantes

### Primary (Azul oscuro - Acción principal)
```html
<app-button variant="primary">
  Click me
</app-button>
```

### Secondary (Blanco con borde - Acción secundaria)
```html
<app-button variant="secondary">
  Cancelar
</app-button>
```

### Danger (Rojo - Acciones destructivas)
```html
<app-button variant="danger">
  Eliminar
</app-button>
```

### Success (Verde - Confirmaciones)
```html
<app-button variant="success">
  Confirmar
</app-button>
```

### Warning (Naranja - Advertencias)
```html
<app-button variant="warning">
  Advertencia
</app-button>
```

## 📏 Tamaños

### Small (36px - Para tablas)
```html
<app-button size="sm">Editar</app-button>
```

### Medium (48px - Estándar, por defecto)
```html
<app-button>Click me</app-button>
```

### Large (56px - Botones destacados)
```html
<app-button size="lg">Acción importante</app-button>
```

## ⚙️ Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `variant` | string | 'primary' | Variante visual: primary, secondary, danger, success, warning |
| `size` | string | 'md' | Tamaño: sm, md, lg |
| `disabled` | boolean | false | Desabilita el botón |
| `fullWidth` | boolean | false | Hace que el botón ocupe el 100% del ancho |
| `loading` | boolean | false | Muestra spinner y desabilita |
| `type` | string | 'button' | Tipo HTML: button, submit, reset |
| `ariaLabel` | string | '' | Etiqueta de accesibilidad |

## 🔄 Eventos

### clicked
Se emite cuando el usuario hace click en el botón (si no está deshabilitado o en loading):

```html
<app-button (clicked)="onButtonClick()">
  Guardar
</app-button>
```

```typescript
onButtonClick() {
  console.log('Button clicked!');
}
```

## 📝 Ejemplos de Uso

### Botón de formulario (Submit)
```html
<app-button
  type="submit"
  variant="primary"
  fullWidth
  [loading]="isLoading()"
  [disabled]="form.invalid">
  Enviar Formulario
</app-button>
```

### Botón de acción destructiva
```html
<app-button
  variant="danger"
  size="sm"
  (clicked)="delete(item.id)"
  ariaLabel="Eliminar elemento">
  🗑️ Eliminar
</app-button>
```

### Botón en estado loading
```html
<app-button
  variant="primary"
  [loading]="isSaving"
  (clicked)="save()">
  {{ isSaving ? 'Guardando...' : 'Guardar' }}
</app-button>
```

### Botón full width (móvil)
```html
<app-button
  variant="success"
  size="lg"
  fullWidth
  (clicked)="confirm()">
  Confirmar Cita
</app-button>
```

## ♿ Accesibilidad

El componente incluye soporte completo para accesibilidad:

- **aria-label**: Se genera automáticamente, o puedes personalizar
- **aria-busy**: Se activa cuando `loading` es true
- **Focus state**: Visible outline para navegación con teclado
- **Prefers-reduced-motion**: Respeta preferencias del usuario
- **Min-height de 48px**: Touch targets accesibles

### Buenas prácticas:

```html
<!-- ✅ Proporciona aria-label descriptivo -->
<app-button ariaLabel="Guardar documento">
  💾
</app-button>

<!-- ✅ Usa tipo "submit" en formularios -->
<app-button type="submit">
  Enviar
</app-button>

<!-- ✅ Disabilita durante acciones largas -->
<app-button [disabled]="isProcessing">
  Procesar
</app-button>
```

## 🧪 Testing

El componente incluye tests completos:

```bash
ng test --include='**/button.component.spec.ts'
```

## 🎯 Casos de Uso Comunes

### En Formularios
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- campos -->
  <app-button type="submit" fullWidth>
    Enviar
  </app-button>
</form>
```

### En Tablas
```html
<table>
  <tr *ngFor="let item of items">
    <td>{{ item.name }}</td>
    <td>
      <app-button size="sm" (clicked)="edit(item)">Editar</app-button>
      <app-button size="sm" variant="danger" (clicked)="delete(item)">Eliminar</app-button>
    </td>
  </tr>
</table>
```

### En Modales
```html
<div class="modal">
  <div class="modal-content"><!-- contenido --></div>
  <div class="modal-actions">
    <app-button variant="secondary" (clicked)="close()">
      Cancelar
    </app-button>
    <app-button variant="primary" (clicked)="save()">
      Guardar
    </app-button>
  </div>
</div>
```

## 🔄 Migración desde Botones Antiguos

### Antes (con clases CSS):
```html
<button class="btn btn-primary btn-full">Ingresar</button>
```

### Después (con componente):
```html
<app-button variant="primary" fullWidth>
  Ingresar
</app-button>
```

**Ventajas:**
- ✅ Código más limpio
- ✅ Lógica centralizada
- ✅ Reutilizable en toda la app
- ✅ Tests automáticos
- ✅ Accesibilidad garantizada

## 📌 Notas

- El componente es **standalone** (no necesita módulo)
- Compatible con Angular 15+
- Usa **CSS puro** (sin dependencias externas)
- Completamente **responsive**
- Optimizado para **accesibilidad WCAG AAA**
