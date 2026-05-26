# ADR-025: Constructor DI vs inject() Function

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Ambos patrones conviven: `constructor` para servicios y `inject()` para componentes

## Contexto

Angular 14+ introdujo la función `inject()` como alternativa a la inyección por constructor. El proyecto usa ambos patrones.

## Opciones Consideradas

1. **Constructor DI** — Tradicional, tipado explícito, compatible con todos los decoradores
2. **`inject()` function** — Menos boilerplate, no requiere `constructor`
3. **Solo constructor** — Consistencia total
4. **Solo inject()** — Moderno, consistente con Signals

## Decisión

Se usa `constructor` para servicios NestJS (inyección de repositories y otros servicios) y `inject()` para componentes Angular (AuthService, DoctorService, etc.). Esto permite escribir componentes sin `constructor`, más alineados con el estilo funcional moderno de Angular.

```typescript
// Servicio NestJS — constructor
constructor(
  @InjectRepository(Doctor) private repo: Repository<Doctor>,
  private readonly doctorService: DoctorService,
) {}

// Componente Angular — inject()
auth = inject(AuthService);
private appointmentService = inject(AppointmentService);
```

## Consecuencias

- ✅ Menos boilerplate en componentes (sin `constructor` + `super()`)
- ✅ Consistente con el estilo Angular moderno
- ❌ Dos patrones conviviendo (inconsistencia visual)
- ❌ `inject()` solo funciona en contexto de inyección (no en clases fuera del DI tree)
- ⚠️ Se prefiere `inject()` para componentes nuevos
