# ADR-018: bcrypt para Hashing de Contraseñas

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** bcrypt como algoritmo de hashing

## Contexto

El backend almacena contraseñas de pacientes (registro local) y necesita un algoritmo seguro de hash.

## Opciones Consideradas

1. **bcrypt** — Algoritmo estable, 10 rounds de salt, ampliamente usado
2. **argon2** — Algoritmo moderno, ganador del PHC, más resistente a ataques GPU
3. **scrypt** — Alternativa a bcrypt, usada en blockchain
4. **PBKDF2** — Estándar NIST, menos memoria-hard

## Decisión

bcrypt con saltRounds = 10. Es la opción más madura y compatible: TypeORM tiene `@BeforeInsert`/`@BeforeUpdate` hooks que funcionan bien con bcrypt. El proyecto se acopla a través de la interfaz `IPasswordHasher`, permitiendo cambiar la implementación sin afectar el dominio. `BcryptPasswordHasher` implementa la interfaz.

## Consecuencias

- ✅ Ampliamente adoptado, auditado y probado
- ✅ Fácil integración con NestJS (inyección vía `IPasswordHasher`)
- ✅ Configurable (salt rounds)
- ❌ argon2 es más seguro contra ataques GPU
- ❌ bcrypt tiene límite de 72 bytes en la entrada (no relevante para contraseñas típicas)
- ✅ La interfaz `IPasswordHasher` permite migrar a argon2 sin cambiar servicios
