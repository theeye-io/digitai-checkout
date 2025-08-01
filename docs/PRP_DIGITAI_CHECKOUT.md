Claro, aquí tienes el contenido completo listo para que lo copies y lo guardes en un archivo con extensión `.md`.

---

**Instrucciones para descargar:**

1.  Haz clic en el botón de "copiar" (el icono de dos hojas) que aparece en la esquina superior derecha del siguiente bloque de código.
2.  Abre un editor de texto plano (como Visual Studio Code, Notepad, Sublime Text, etc.).
3.  Pega el contenido.
4.  Guarda el archivo con el nombre que prefieras, asegurándote de que termine en `.md`. Por ejemplo: `PRP_theeye-checkout_v1.1.md`.

---

```markdown
# Propuesta de Proyecto (PRP)

| Campo | Valor |
|-------|-------|
| **Nombre del Proyecto** | Desarrollo de API de Pagos: theeye-checkout |
| **Cliente** | TheEye |
| **Fecha** | 02 de agosto de 2025 |
| **Versión** | 1.1 |
| **Preparado por** | Gemini |

## 1. Resumen Ejecutivo

Este documento detalla la propuesta para el diseño, desarrollo y despliegue de **theeye-checkout**, una API robusta para la gestión de pagos en línea. El objetivo es crear un sistema centralizado que permita a los clientes comprar "paquetes" de servicios (comenzando con paquetes de "facturas") a través de diversas pasarelas de pago. La primera versión de la API se integrará con **MercadoPago** y **Stripe**.

La solución se desarrollará sobre el framework **LoopBack 4** y utilizará **MongoDB** como base de datos persistente. Se incorporará **Redis** como una capa de caché de alto rendimiento para optimizar la velocidad de respuesta en consultas frecuentes y para implementar mecanismos de limitación de velocidad (rate limiting).

La arquitectura se diseñará desde el inicio para operar en múltiples entornos. La configuración para **Development, Staging y Production** se gestionará mediante archivos `.env` específicos (`.env_development`, `.env_staging`, `.env_production`), cargados dinámicamente según una variable de entorno en el arranque de la aplicación. El proyecto contempla la definición de modelos de datos, la implementación de endpoints para la gestión de compras, la consulta de créditos, y un sistema fiable de manejo de errores que incluya la devolución automática de dinero.

## 2. Justificación del Negocio

Actualmente, no existe un mecanismo automatizado para que los clientes adquieran servicios de forma autogestionada. Esta carencia representa una barrera para la escalabilidad del negocio y genera una carga operativa en el equipo para procesar ventas manualmente. La implementación de la API `theeye-checkout` es fundamental para:

- **Habilitar Nuevas Líneas de Ingreso**: Permitir la venta directa y automatizada de servicios y productos digitales.
- **Mejorar la Experiencia del Cliente**: Ofrecer un proceso de compra rápido, seguro y disponible 24/7.
- **Eficiencia Operativa**: Reducir la intervención manual en el proceso de venta, permitiendo que el equipo se enfoque en tareas de mayor valor.
- **Fundamento Escalable**: Crear una plataforma de pagos que pueda crecer para soportar nuevos paquetes, servicios y pasarelas de pago en el futuro.

## 3. Objetivos del Proyecto

### Objetivo Principal
Desarrollar y desplegar una API de pagos segura, escalable y mantenible que gestione el ciclo completo de compra de paquetes de servicios, desde la transacción inicial hasta la acreditación y consulta del saldo.

### Objetivos Secundarios

- **Integración de Pasarelas**: Integrar exitosamente la API con MercadoPago y Stripe, manejando sus flujos de pago específicos.
- **Gestión de Créditos**: Implementar una lógica de negocio para acreditar, consultar y descontar el "crédito" (ej. número de facturas) adquirido por un usuario.
- **Fiabilidad y Resiliencia**: Asegurar que el sistema pueda manejar fallos en la transacción, implementando un proceso de reembolso automático para pagos que no puedan ser procesados correctamente.
- **Arquitectura Multi-entorno**: Definir y configurar la aplicación para un despliegue consistente en los entornos de Development, Staging y Production, utilizando archivos de configuración dinámicos.
- **Seguridad**: Proteger la información sensible (claves de API, datos de usuario) y los endpoints de la API mediante las mejores prácticas.
- **Rendimiento y Escalabilidad**: Utilizar un sistema de caché (Redis) para reducir la latencia en las consultas de datos frecuentes y proteger la API mediante limitación de velocidad (rate limiting).
- **Trazabilidad**: Mantener un registro detallado de cada transacción en la base de datos para fines de auditoría y soporte.

## 4. Alcance del Proyecto

### Incluido en el Alcance

- **API Backend (LoopBack 4)**: Desarrollo de todos los controladores, servicios y modelos necesarios.
- **Modelado de Base de Datos (MongoDB)**: Diseño y creación de las colecciones para usuarios, paquetes y transacciones.
- **Capa de Caché (Redis)**: Integración de Redis para cachear saldos de usuario y definiciones de paquetes.
- **Módulo de Integración de Pagos**:
    - Conexión con las APIs de Stripe y MercadoPago.
    - Implementación de webhooks para recibir notificaciones asíncronas de los estados de pago.
- **Endpoints de la API**:
    - `POST /purchase`: Para iniciar un nuevo proceso de compra de un paquete.
    - `GET /transactions/{id}`: Para consultar el estado de una transacción específica.
    - `GET /users/{email}/balance`: Para consultar el crédito o saldo disponible de un usuario (optimizado con Redis).
    - `POST /consume`: Endpoint para consumir/descontar crédito del saldo de un usuario.
- **Lógica de Reembolso**: Implementación de la lógica para iniciar devoluciones de dinero cuando una transacción falla después del cobro.
- **Configuración de Entornos**: Creación de un sistema de configuración que cargue un archivo `.env` específico del entorno (`.env_development`, etc.) basado en una variable de sistema.
- **Documentación de la API**: Generación automática de la especificación OpenAPI (Swagger) a través de LoopBack 4.

### Fuera del Alcance

- El desarrollo de cualquier interfaz de usuario (UI/Frontend) para el proceso de compra.
- La integración con pasarelas de pago adicionales a MercadoPago y Stripe.
- El desarrollo de un panel de administración para gestionar usuarios o paquetes.
- Migración de datos de sistemas preexistentes.
- Dashboards o sistemas avanzados de reportería financiera.

## 5. Fases del Proyecto y Cronograma Preliminar

| Fase | Descripción | Duración Estimada |
|------|-------------|-------------------|
| **Fase 1: Planificación y Diseño** | Aprobación del PRP. Diseño detallado de la arquitectura. Definición de los modelos de datos en MongoDB y el uso de Redis. Especificación final de los endpoints. | 1 semana |
| **Fase 2: Setup y Desarrollo Core** | Inicialización del proyecto en LoopBack 4. Creación de repositorios, controladores y modelos. Configuración de la conexión a MongoDB y **Redis**. Implementación de la carga dinámica de archivos `.env`. | 2 semanas |
| **Fase 3: Integración con Pasarelas de Pago** | Desarrollo de los servicios de integración para Stripe y MercadoPago. Implementación de los endpoints de inicio de compra y los webhooks para confirmación de pago. | 3 semanas |
| **Fase 4: Desarrollo de Lógica de Negocio y Caché** | Implementación de la lógica para la gestión de créditos (acreditación, consulta, consumo). **Integración de la lógica de caché con Redis en los endpoints correspondientes**. Desarrollo del flujo de reembolso. | 2 semanas |
| **Fase 5: Pruebas y Despliegue** | Desarrollo de pruebas unitarias e de integración. Despliegue de la aplicación en los entornos de Staging y Producción. Pruebas End-to-End y de rendimiento. | 2 semanas |
| **Total Estimado** | | **10 semanas** |

## 6. Propuesta de Arquitectura Técnica

### Framework y Base de Datos

- **API Framework**: **LoopBack 4**. Elegido por su arquitectura moderna basada en TypeScript, inyección de dependencias, y generación automática de documentación OpenAPI.
- **Base de Datos Persistente**: **MongoDB**. Su modelo de documentos flexible es ideal para almacenar usuarios, paquetes y transacciones con estados variables.

### Capa de Caché y Rate Limiting (Redis)

- **¿Por qué Redis?**: Se introduce Redis para abordar dos necesidades clave: rendimiento y seguridad.
- **Casos de Uso**:
    1.  **Caché de Datos**: Se cachearán datos de lectura frecuente para reducir la carga sobre MongoDB y disminuir la latencia.
        - **Saldos de usuario**: El resultado de `GET /users/{email}/balance` se almacenará en Redis. La caché se invalidará (eliminará) tras una compra exitosa o un consumo de crédito.
        - **Definiciones de paquetes**: La información de los paquetes, que cambia con poca frecuencia, se mantendrá en caché.
    2.  **Rate Limiting**: Se utilizará Redis para implementar un límite en el número de solicitudes que un cliente puede hacer a endpoints críticos (ej. `POST /purchase`) en un período de tiempo, previniendo abusos y ataques de denegación de servicio.

### Modelo de Datos (Colecciones en MongoDB)

- **`users`**: `{ email: "cliente@email.com", userId: "...", credits: { invoices: 500 }, ... }`
- **`packages`**: `{ packageId: "inv_pack_100", name: "Paquete de 100 Facturas", price: 10.00, currency: "USD", grantsCredits: { invoices: 100 } }`
- **`transactions`**: `{ transactionId: "...", userId: "...", packageId: "...", gateway: "stripe", gatewayTransactionId: "pi_...", status: "completed" | "pending" | "failed" | "refunded", amount: 10.00, ... }`

### Gestión de Entornos

La configuración se manejará de forma robusta y segura para cada entorno:
- Se crearán archivos de entorno específicos: `.env_development`, `.env_staging`, `.env_production`.
- Al iniciar la aplicación, se utilizará una variable de entorno del sistema (ej. `NODE_ENV`) para determinar qué archivo cargar. Por ejemplo: `NODE_ENV=production npm start`.
- Un script en el punto de entrada de la aplicación (`src/index.ts`) se encargará de cargar el archivo `.env` correspondiente. Por ejemplo: `dotenv.config({ path: `.env_${process.env.NODE_ENV}` })`.
- Este enfoque garantiza el aislamiento total de las credenciales y configuraciones entre entornos.

## 7. Riesgos Potenciales y Planes de Mitigación
Claro, aquí tienes el contenido completo listo para que lo copies y lo guardes en un archivo con extensión `.md`.

---

**Instrucciones para descargar:**

1.  Haz clic en el botón de "copiar" (el icono de dos hojas) que aparece en la esquina superior derecha del siguiente bloque de código.
2.  Abre un editor de texto plano (como Visual Studio Code, Notepad, Sublime Text, etc.).
3.  Pega el contenido.
4.  Guarda el archivo con el nombre que prefieras, asegurándote de que termine en `.md`. Por ejemplo: `PRP_theeye-checkout_v1.1.md`.

---

```markdown
# Propuesta de Proyecto (PRP)

| Campo | Valor |
|-------|-------|
| **Nombre del Proyecto** | Desarrollo de API de Pagos: theeye-checkout |
| **Cliente** | TheEye |
| **Fecha** | 02 de agosto de 2025 |
| **Versión** | 1.1 |
| **Preparado por** | Gemini |

## 1. Resumen Ejecutivo

Este documento detalla la propuesta para el diseño, desarrollo y despliegue de **theeye-checkout**, una API robusta para la gestión de pagos en línea. El objetivo es crear un sistema centralizado que permita a los clientes comprar "paquetes" de servicios (comenzando con paquetes de "facturas") a través de diversas pasarelas de pago. La primera versión de la API se integrará con **MercadoPago** y **Stripe**.

La solución se desarrollará sobre el framework **LoopBack 4** y utilizará **MongoDB** como base de datos persistente. Se incorporará **Redis** como una capa de caché de alto rendimiento para optimizar la velocidad de respuesta en consultas frecuentes y para implementar mecanismos de limitación de velocidad (rate limiting).

La arquitectura se diseñará desde el inicio para operar en múltiples entornos. La configuración para **Development, Staging y Production** se gestionará mediante archivos `.env` específicos (`.env_development`, `.env_staging`, `.env_production`), cargados dinámicamente según una variable de entorno en el arranque de la aplicación. El proyecto contempla la definición de modelos de datos, la implementación de endpoints para la gestión de compras, la consulta de créditos, y un sistema fiable de manejo de errores que incluya la devolución automática de dinero.

## 2. Justificación del Negocio

Actualmente, no existe un mecanismo automatizado para que los clientes adquieran servicios de forma autogestionada. Esta carencia representa una barrera para la escalabilidad del negocio y genera una carga operativa en el equipo para procesar ventas manualmente. La implementación de la API `theeye-checkout` es fundamental para:

- **Habilitar Nuevas Líneas de Ingreso**: Permitir la venta directa y automatizada de servicios y productos digitales.
- **Mejorar la Experiencia del Cliente**: Ofrecer un proceso de compra rápido, seguro y disponible 24/7.
- **Eficiencia Operativa**: Reducir la intervención manual en el proceso de venta, permitiendo que el equipo se enfoque en tareas de mayor valor.
- **Fundamento Escalable**: Crear una plataforma de pagos que pueda crecer para soportar nuevos paquetes, servicios y pasarelas de pago en el futuro.

## 3. Objetivos del Proyecto

### Objetivo Principal
Desarrollar y desplegar una API de pagos segura, escalable y mantenible que gestione el ciclo completo de compra de paquetes de servicios, desde la transacción inicial hasta la acreditación y consulta del saldo.

### Objetivos Secundarios

- **Integración de Pasarelas**: Integrar exitosamente la API con MercadoPago y Stripe, manejando sus flujos de pago específicos.
- **Gestión de Créditos**: Implementar una lógica de negocio para acreditar, consultar y descontar el "crédito" (ej. número de facturas) adquirido por un usuario.
- **Fiabilidad y Resiliencia**: Asegurar que el sistema pueda manejar fallos en la transacción, implementando un proceso de reembolso automático para pagos que no puedan ser procesados correctamente.
- **Arquitectura Multi-entorno**: Definir y configurar la aplicación para un despliegue consistente en los entornos de Development, Staging y Production, utilizando archivos de configuración dinámicos.
- **Seguridad**: Proteger la información sensible (claves de API, datos de usuario) y los endpoints de la API mediante las mejores prácticas.
- **Rendimiento y Escalabilidad**: Utilizar un sistema de caché (Redis) para reducir la latencia en las consultas de datos frecuentes y proteger la API mediante limitación de velocidad (rate limiting).
- **Trazabilidad**: Mantener un registro detallado de cada transacción en la base de datos para fines de auditoría y soporte.

## 4. Alcance del Proyecto

### Incluido en el Alcance

- **API Backend (LoopBack 4)**: Desarrollo de todos los controladores, servicios y modelos necesarios.
- **Modelado de Base de Datos (MongoDB)**: Diseño y creación de las colecciones para usuarios, paquetes y transacciones.
- **Capa de Caché (Redis)**: Integración de Redis para cachear saldos de usuario y definiciones de paquetes.
- **Módulo de Integración de Pagos**:
    - Conexión con las APIs de Stripe y MercadoPago.
    - Implementación de webhooks para recibir notificaciones asíncronas de los estados de pago.
- **Endpoints de la API**:
    - `POST /purchase`: Para iniciar un nuevo proceso de compra de un paquete.
    - `GET /transactions/{id}`: Para consultar el estado de una transacción específica.
    - `GET /users/{email}/balance`: Para consultar el crédito o saldo disponible de un usuario (optimizado con Redis).
    - `POST /consume`: Endpoint para consumir/descontar crédito del saldo de un usuario.
- **Lógica de Reembolso**: Implementación de la lógica para iniciar devoluciones de dinero cuando una transacción falla después del cobro.
- **Configuración de Entornos**: Creación de un sistema de configuración que cargue un archivo `.env` específico del entorno (`.env_development`, etc.) basado en una variable de sistema.
- **Documentación de la API**: Generación automática de la especificación OpenAPI (Swagger) a través de LoopBack 4.

### Fuera del Alcance

- El desarrollo de cualquier interfaz de usuario (UI/Frontend) para el proceso de compra.
- La integración con pasarelas de pago adicionales a MercadoPago y Stripe.
- El desarrollo de un panel de administración para gestionar usuarios o paquetes.
- Migración de datos de sistemas preexistentes.
- Dashboards o sistemas avanzados de reportería financiera.

## 5. Fases del Proyecto y Cronograma Preliminar

| Fase | Descripción | Duración Estimada |
|------|-------------|-------------------|
| **Fase 1: Planificación y Diseño** | Aprobación del PRP. Diseño detallado de la arquitectura. Definición de los modelos de datos en MongoDB y el uso de Redis. Especificación final de los endpoints. | 1 semana |
| **Fase 2: Setup y Desarrollo Core** | Inicialización del proyecto en LoopBack 4. Creación de repositorios, controladores y modelos. Configuración de la conexión a MongoDB y **Redis**. Implementación de la carga dinámica de archivos `.env`. | 2 semanas |
| **Fase 3: Integración con Pasarelas de Pago** | Desarrollo de los servicios de integración para Stripe y MercadoPago. Implementación de los endpoints de inicio de compra y los webhooks para confirmación de pago. | 3 semanas |
| **Fase 4: Desarrollo de Lógica de Negocio y Caché** | Implementación de la lógica para la gestión de créditos (acreditación, consulta, consumo). **Integración de la lógica de caché con Redis en los endpoints correspondientes**. Desarrollo del flujo de reembolso. | 2 semanas |
| **Fase 5: Pruebas y Despliegue** | Desarrollo de pruebas unitarias e de integración. Despliegue de la aplicación en los entornos de Staging y Producción. Pruebas End-to-End y de rendimiento. | 2 semanas |
| **Total Estimado** | | **10 semanas** |

## 6. Propuesta de Arquitectura Técnica

### Framework y Base de Datos

- **API Framework**: **LoopBack 4**. Elegido por su arquitectura moderna basada en TypeScript, inyección de dependencias, y generación automática de documentación OpenAPI.
- **Base de Datos Persistente**: **MongoDB**. Su modelo de documentos flexible es ideal para almacenar usuarios, paquetes y transacciones con estados variables.

### Capa de Caché y Rate Limiting (Redis)

- **¿Por qué Redis?**: Se introduce Redis para abordar dos necesidades clave: rendimiento y seguridad.
- **Casos de Uso**:
    1.  **Caché de Datos**: Se cachearán datos de lectura frecuente para reducir la carga sobre MongoDB y disminuir la latencia.
        - **Saldos de usuario**: El resultado de `GET /users/{email}/balance` se almacenará en Redis. La caché se invalidará (eliminará) tras una compra exitosa o un consumo de crédito.
        - **Definiciones de paquetes**: La información de los paquetes, que cambia con poca frecuencia, se mantendrá en caché.
    2.  **Rate Limiting**: Se utilizará Redis para implementar un límite en el número de solicitudes que un cliente puede hacer a endpoints críticos (ej. `POST /purchase`) en un período de tiempo, previniendo abusos y ataques de denegación de servicio.

### Modelo de Datos (Colecciones en MongoDB)

- **`users`**: `{ email: "cliente@email.com", userId: "...", credits: { invoices: 500 }, ... }`
- **`packages`**: `{ packageId: "inv_pack_100", name: "Paquete de 100 Facturas", price: 10.00, currency: "USD", grantsCredits: { invoices: 100 } }`
- **`transactions`**: `{ transactionId: "...", userId: "...", packageId: "...", gateway: "stripe", gatewayTransactionId: "pi_...", status: "completed" | "pending" | "failed" | "refunded", amount: 10.00, ... }`

### Gestión de Entornos

La configuración se manejará de forma robusta y segura para cada entorno:
- Se crearán archivos de entorno específicos: `.env_development`, `.env_staging`, `.env_production`.
- Al iniciar la aplicación, se utilizará una variable de entorno del sistema (ej. `NODE_ENV`) para determinar qué archivo cargar. Por ejemplo: `NODE_ENV=production npm start`.
- Un script en el punto de entrada de la aplicación (`src/index.ts`) se encargará de cargar el archivo `.env` correspondiente. Por ejemplo: `dotenv.config({ path: `.env_${process.env.NODE_ENV}` })`.
- Este enfoque garantiza el aislamiento total de las credenciales y configuraciones entre entornos.

## 7. Riesgos Potenciales y Planes de Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Indisponibilidad o cambios en las APIs de pasarelas** | Media | Alto | Crear servicios "adaptadores" para cada pasarela, aislando su lógica. Implementar reintentos y un sistema de alertas si un servicio externo falla. |
| **Fallo en la acreditación de crédito post-pago** | Baja | Alto | El diseño se basará en webhooks. La colección `transactions` servirá como "fuente de verdad". Se creará un script de reconciliación para corregir discrepancias. |
| **Indisponibilidad del servicio de Redis** | Baja | Medio | La aplicación se diseñará para ser "cache-aware". Si Redis no está disponible, el código debe poder obtener los datos directamente de MongoDB (funcionamiento degradado pero funcional). Utilizar un servicio de Redis gestionado con alta disponibilidad. |
| **Vulnerabilidades de seguridad (exposición de claves)** | Baja | Alto | Adherencia estricta al uso de la carga dinámica de archivos `.env` por entorno y un sistema de gestión de secretos para producción. Nunca se subirán secretos al repositorio Git. |

## 8. Criterios de Éxito

- ✅ La API está desplegada en producción y procesa transacciones reales a través de Stripe y MercadoPago.
- ✅ Los créditos se acreditan de forma automática e inmediata tras la confirmación del pago.
- ✅ El endpoint `GET /users/{email}/balance` refleja correctamente el saldo y responde con baja latencia gracias a Redis.
- ✅ Los fallos de transacción se registran adecuadamente y el proceso de reembolso se inicia de forma fiable.
- ✅ La configuración de los tres entornos (Dev, Staging, Prod) es funcional mediante la carga dinámica de archivos `.env`.

## 9. Próximos Pasos

1. **Revisión y aprobación** de esta propuesta (versión 1.1) por parte de los stakeholders.
2. **Kick-off técnico** para validar la arquitectura y los modelos de datos.
3. **Configuración del repositorio** `theeye-checkout` con el esqueleto de LoopBack 4 y las políticas de ramas.
4. **Aprovisionamiento de las bases de datos** en MongoDB y Redis para cada entorno.
5. **Comienzo de la Fase 1** del proyecto.
```
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Indisponibilidad o cambios en las APIs de pasarelas** | Media | Alto | Crear servicios "adaptadores" para cada pasarela, aislando su lógica. Implementar reintentos y un sistema de alertas si un servicio externo falla. |
| **Fallo en la acreditación de crédito post-pago** | Baja | Alto | El diseño se basará en webhooks. La colección `transactions` servirá como "fuente de verdad". Se creará un script de reconciliación para corregir discrepancias. |
| **Indisponibilidad del servicio de Redis** | Baja | Medio | La aplicación se diseñará para ser "cache-aware". Si Redis no está disponible, el código debe poder obtener los datos directamente de MongoDB (funcionamiento degradado pero funcional). Utilizar un servicio de Redis gestionado con alta disponibilidad. |
| **Vulnerabilidades de seguridad (exposición de claves)** | Baja | Alto | Adherencia estricta al uso de la carga dinámica de archivos `.env` por entorno y un sistema de gestión de secretos para producción. Nunca se subirán secretos al repositorio Git. |

## 8. Criterios de Éxito

- ✅ La API está desplegada en producción y procesa transacciones reales a través de Stripe y MercadoPago.
- ✅ Los créditos se acreditan de forma automática e inmediata tras la confirmación del pago.
- ✅ El endpoint `GET /users/{email}/balance` refleja correctamente el saldo y responde con baja latencia gracias a Redis.
- ✅ Los fallos de transacción se registran adecuadamente y el proceso de reembolso se inicia de forma fiable.
- ✅ La configuración de los tres entornos (Dev, Staging, Prod) es funcional mediante la carga dinámica de archivos `.env`.

## 9. Próximos Pasos

1. **Revisión y aprobación** de esta propuesta (versión 1.1) por parte de los stakeholders.
2. **Kick-off técnico** para validar la arquitectura y los modelos de datos.
3. **Configuración del repositorio** `theeye-checkout` con el esqueleto de LoopBack 4 y las políticas de ramas.
4. **Aprovisionamiento de las bases de datos** en MongoDB y Redis para cada entorno.
5. **Comienzo de la Fase 1** del proyecto.
```