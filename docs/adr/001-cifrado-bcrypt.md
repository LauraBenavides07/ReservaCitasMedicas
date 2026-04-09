# ADR-001: Implementación de Algoritmo de Hashing (Bcrypt) para Credenciales

### Fecha: 9 de abril de 2026  
### Estado: Terminado  

## Contexto
En el desarrollo de Piedrazul, la seguridad de las cuentas de usuario y de la información médica confidencial es un aspecto crítico. El principal problema técnico radicaba en definir un mecanismo seguro para almacenar y validar credenciales, evitando el riesgo de exposición de contraseñas en caso de una intrusión a la base de datos. En la documentación arquitectónica inicial, solo se definía de manera general el proceso de “Autenticar Usuario”, sin detallar el mecanismo para proteger las contraseñas. Esto implicaba que no se abordaba cómo evitar su almacenamiento en texto plano, dejando un vacío frente al cumplimiento de los estándares de seguridad necesarios.

## Decisión
Se decidió implementar el algoritmo de hashing unidireccional `bcrypt`, utilizando un factor de costo (salt rounds) de 10 e integrándolo con el ecosistema de NestJS; de este modo, durante el registro la contraseña es enviada al controlador y procesada en el `auth.service.ts`, donde se hashea antes de ser persistida mediante TypeORM en PostgreSQL, mientras que en el inicio de sesión se emplea exclusivamente la función de comparación asíncrona de `bcrypt` para validar la contraseña ingresada contra el hash almacenado, sin exponer ni manipular en ningún momento la contraseña en texto plano.

## Consecuencias

### Positivas
- Se garantiza el cumplimiento de buenas prácticas y regulaciones de ciberseguridad relacionadas con la protección de información personal.
- En caso de una exposición no autorizada de la base de datos, las credenciales permanecen protegidas, ya que los hashes son ilegibles y resistentes a ataques de fuerza bruta.

### Negativas o Riesgos
- El proceso de hashing introduce una latencia adicional debido a su naturaleza computacionalmente intensiva, especialmente en operaciones como el inicio de sesión.
- Se incrementa la dependencia de una librería criptográfica externa al núcleo de Node.js, delegando en ella la responsabilidad del manejo seguro de las credenciales.
