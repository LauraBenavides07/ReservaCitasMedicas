# Guía de Seed Data

## Credenciales de Prueba

Tras ejecutar `npx ts-node seed.ts`, se crean los siguientes usuarios:

| Rol | Email / Documento | Contraseña | Nombre |
|-----|-------------------|------------|--------|
| Administrador | `admin@piedrazul.com` | `123456` | Sofía Paz |
| Médico | `medico@piedrazul.com` | `123456` | Juan López |
| Paciente | `123456789` / `paciente@piedrazul.com` | `123456` | Luisa Pérez |

## Datos Creados

| Entidad | Cantidad | Detalle |
|---------|----------|---------|
| `User` (admin) | 1 | `admin@piedrazul.com`, rol `admin` |
| `User` (doctor) | 1 | `medico@piedrazul.com`, rol `doctor` |
| `Doctor` | 1 | Juan López, Cardiología, 08:00–18:00, slot 30min |
| `Patient` | 1 | Documento `123456789`, email `paciente@piedrazul.com` |
| `Appointment` | 1 | Hoy a las 09:00, estado `agendada` |

## Cómo Ejecutar

```bash
cd backend
pnpm install
npx ts-node seed.ts
```

El seed:
1. Corre las migraciones de TypeORM primero
2. Limpia todas las tablas (`TRUNCATE CASCADE`)
3. Inserta los datos de prueba

## Resetear la BD

Para volver al estado inicial:

```bash
# Opción 1: Volver a ejecutar seed (limpia + inserta)
npx ts-node seed.ts

# Opción 2: Dropear y recrear la BD manualmente
psql -U postgres -d piedrazul -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npx ts-node seed.ts
```

## Agregar Nuevos Datos de Prueba

Para extender el seed, editar `backend/seed.ts` y agregar:

```typescript
// Ejemplo: segundo médico
const doctor2 = doctorRepo.create({
  name: 'María García',
  specialty: 'Pediatría',
  scheduleStart: '09:00',
  scheduleEnd: '17:00',
  slotDuration: 20,
});
await doctorRepo.save(doctor2);
```
