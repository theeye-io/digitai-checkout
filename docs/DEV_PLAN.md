¡Excelente! A partir de la Propuesta de Proyecto (PRP v1.1), aquí tienes un Plan de Desarrollo detallado.

Este plan traduce la arquitectura definida en el PRP a una estructura de código concreta, patrones de diseño y pasos accionables para el equipo de desarrollo, con un fuerte énfasis en la reutilización y escalabilidad, especialmente en la integración de pasarelas de pago.

---

# Plan de Desarrollo: API theeye-checkout

## 1. Introducción

Este documento es la guía técnica para la construcción de la API `theeye-checkout`. Describe la estructura del proyecto en **LoopBack 4**, los patrones de diseño a implementar y las especificaciones detalladas para los componentes clave como controladores, modelos y, fundamentalmente, los conectores de pasarelas de pago.

El objetivo es crear una base de código mantenible, robusta y preparada para futuras expansiones.

## 2. Fase 1 y 2: Arquitectura Core y Configuración del Proyecto

Esta fase establece los cimientos de la aplicación.

### 2.1. Estructura de Directorios

El esqueleto base de LoopBack 4 será extendido con directorios adicionales para organizar mejor la lógica de negocio y las integraciones.

```
/theeye-checkout
|-- /dist
|-- /node_modules
|-- /src
|   |-- /controllers       # Controladores de la API (endpoints)
|   |-- /datasources       # Conexiones a MongoDB y Redis
|   |-- /gateways          # Lógica de integración de pasarelas (Stripe, MP)
|   |   |-- /adapters      # Clases concretas para cada pasarela
|   |   `-- gateway.interface.ts # Contrato común para todas las pasarelas
|   |-- /models            # Definición de los modelos de datos (User, Package, etc.)
|   |-- /repositories      # Acceso a datos (interactúan con los modelos)
|   |-- /services          # Lógica de negocio desacoplada (CreditService, CacheService)
|   |-- application.ts
|   |-- index.ts           # Punto de entrada, carga de .env
|   `-- sequence.ts
|-- .env_development       # Variables de entorno para desarrollo
|-- .env_staging           # Variables de entorno para staging
|-- .env_production        # Variables de entorno para producción
|-- .gitignore
|-- package.json
`-- tsconfig.json
```

### 2.2. Configuración de Entorno Dinámica

Para cargar el archivo `.env` correcto según el entorno, modificaremos `src/index.ts`.

**`src/index.ts`**
```typescript
import {TheeyeCheckoutApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import * as dotenv from 'dotenv';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  // Determinar la ruta del archivo .env a cargar
  const envPath = `.${process.env.NODE_ENV || 'development'}.env`;
  
  // Cargar las variables de entorno desde el archivo correspondiente
  dotenv.config({ path: envPath });

  console.log(`Loading environment from: ${envPath}`);

  const app = new TheeyeCheckoutApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Configuración para gestionar el cierre de la aplicación
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST,
      gracefulShutdownTimeout: 10000,
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
```
**Ejemplo de archivo `.env_development`**
```
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/theeye_checkout_dev
REDIS_URL=redis://localhost:6379
STRIPE_API_KEY=sk_test_...
MP_ACCESS_TOKEN=TEST-...
LOG_LEVEL=debug
```

### 2.3. Datasources

Se configurarán dos datasources que obtendrán sus credenciales de las variables de entorno.

**`src/datasources/mongo.datasource.ts`**
```typescript
import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'mongo',
  connector: 'mongodb',
  url: process.env.MONGO_URI, // Cargado desde el .env
  useNewUrlParser: true
};

@lifeCycleObserver('datasource')
export class MongoDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'mongo';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongo', {optional: true}) dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
```
Se creará un `redis.datasource.ts` de manera similar.

### 2.4. Modelos, Repositorios y Controladores Base

Se crearán los modelos y repositorios para las tres colecciones principales.

*   **Modelos (`/src/models`)**:
    *   `user.model.ts`: `{ email: string (id), credits: { invoices: number } }`
    *   `package.model.ts`: `{ packageId: string (id), name: string, price: number, currency: string, grantsCredits: object }`
    *   `transaction.model.ts`: `{ transactionId: string (id), userId: string, packageId: string, gateway: string, status: string, amount: number, createdAt: Date, ... }`
*   **Repositorios (`/src/repositories`)**:
    *   `user.repository.ts`, `package.repository.ts`, `transaction.repository.ts`. Serán clases `DefaultCrudRepository` estándar que se conectan a la datasource de MongoDB.
*   **Controladores (`/src/controllers`)**:
    *   `user.controller.ts`: Implementará `GET /users/{email}/balance` y `POST /consume`.
    *   `checkout.controller.ts`: Implementará `POST /purchase` y los endpoints de webhook.

## 3. Fase 3: Diseño del Conector de Pasarelas de Pago (Reutilizable)

Este es el núcleo de la extensibilidad. Se usará el **Patrón Adaptador (Adapter Pattern)**.

### 3.1. El Contrato: `PaymentGateway.interface.ts`

Definiremos una interfaz de TypeScript que todas las pasarelas de pago **deben** implementar. Este es el secreto para un código reutilizable.

**`src/gateways/gateway.interface.ts`**
```typescript
// Define los datos necesarios para crear una intención de pago
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  userEmail: string;
  packageId: string;
}

// Define la respuesta esperada tras crear la intención de pago
export interface PaymentIntentResponse {
  clientSecret: string; // Para el frontend (ej. Stripe)
  checkoutUrl?: string;  // Para redirección (ej. MercadoPago)
  transactionId: string; // Nuestro ID interno
}

// Define la estructura de una solicitud de reembolso
export interface RefundRequest {
  gatewayTransactionId: string;
  amount: number;
  reason?: string;
}

// El contrato que cada adaptador de pasarela debe cumplir
export interface IPaymentGateway {
  /**
   * Crea una intención de pago o una sesión de checkout en la pasarela.
   * @param request Datos de la solicitud de pago.
   */
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse>;

  /**
   * Procesa un evento de webhook entrante de la pasarela.
   * @param payload El cuerpo del webhook.
   * @param signature La firma para verificación (si aplica).
   * @returns Un objeto indicando el resultado del procesamiento.
   */
  handleWebhook(payload: any, signature?: string): Promise<{status: 'success' | 'failed', message: string}>;

  /**
   * Inicia un reembolso.
   * @param request Datos de la solicitud de reembolso.
   */
  refund(request: RefundRequest): Promise<{success: boolean, refundId?: string}>;
}
```

### 3.2. Implementaciones Concretas (Adaptadores)

Para cada pasarela, crearemos una clase que implemente `IPaymentGateway`.

**`src/gateways/adapters/stripe.adapter.ts`**
```typescript
import {IPaymentGateway, PaymentIntentRequest, PaymentIntentResponse, RefundRequest} from '../gateway.interface';
import {Stripe} from 'stripe';
import {inject} from '@loopback/core';
import {TransactionRepository} from '../../repositories';

export class StripeAdapter implements IPaymentGateway {
  private stripe: Stripe;

  constructor(
    // Inyectamos nuestro repositorio para crear la transacción localmente
    @inject('repositories.TransactionRepository')
    private transactionRepository: TransactionRepository,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_API_KEY!, { apiVersion: '2022-11-15' });
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    // 1. Crear la transacción en nuestra BD con estado 'pending'
    const transaction = await this.transactionRepository.create({
      userId: request.userEmail,
      packageId: request.packageId,
      amount: request.amount,
      currency: request.currency,
      status: 'pending',
      gateway: 'stripe',
    });

    // 2. Crear el PaymentIntent en Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: request.amount * 100, // Stripe usa centavos
      currency: request.currency,
      metadata: {
        internalTransactionId: transaction.id, // Vinculamos nuestro ID
        packageId: request.packageId,
      },
    });

    // 3. Devolver el client_secret para que el frontend lo use
    return {
      clientSecret: paymentIntent.client_secret!,
      transactionId: transaction.id,
    };
  }

  async handleWebhook(payload: any, signature: string): Promise<{status: 'success' | 'failed', message: string}> {
    // Lógica para verificar la firma del webhook de Stripe
    // ...
    // Procesar el evento (ej. 'payment_intent.succeeded')
    // Actualizar el estado de la transacción en nuestra BD
    // Llamar al CreditService para acreditar los fondos
    // ...
    return { status: 'success', message: 'Webhook processed' };
  }

  async refund(request: RefundRequest): Promise<{success: boolean, refundId?: string}> {
    // Lógica de reembolso usando la API de Stripe
    // ...
    return { success: true };
  }
}
```
Se creará un `mercado-pago.adapter.ts` siguiendo el mismo patrón, pero utilizando el SDK de MercadoPago y su flujo específico (ej. generando una `checkoutUrl`).

### 3.3. Fábrica de Pasarelas y Uso en el Controlador

Para desacoplar el controlador de las implementaciones, usaremos una fábrica simple.

**`src/gateways/gateway.factory.ts`**
```typescript
import {Provider} from '@loopback/core';
import {StripeAdapter} from './adapters/stripe.adapter';
import {MercadoPagoAdapter} from './adapters/mercado-pago.adapter';
import {IPaymentGateway} from './gateway.interface';

// Esta fábrica determina qué adaptador instanciar
export class PaymentGatewayFactory implements Provider<IPaymentGateway> {
    constructor(private gatewayType: 'stripe' | 'mercadopago') {}
    
    value(): IPaymentGateway {
        if (this.gatewayType === 'stripe') {
            return new StripeAdapter(/* dependencias inyectadas */);
        }
        if (this.gatewayType === 'mercadopago') {
            return new MercadoPagoAdapter(/* dependencias inyectadas */);
        }
        throw new Error('Unsupported payment gateway');
    }
}
```

**`src/controllers/checkout.controller.ts`**
```typescript
import {post, requestBody} from '@loopback/rest';
import {inject} from '@loopback/core';
import {PaymentGatewayFactory} from '../gateways/gateway.factory';
import {PaymentIntentRequest, PaymentIntentResponse} from '../gateways/gateway.interface';

export class CheckoutController {
  constructor(
      // Inyectamos nuestra fábrica
      @inject('factories.PaymentGatewayFactory')
      private gatewayFactory: PaymentGatewayFactory,
  ) {}

  @post('/purchase')
  async purchase(
    @requestBody() body: PaymentIntentRequest & { gateway: 'stripe' | 'mercadopago' }
  ): Promise<PaymentIntentResponse> {
    // 1. Usa la fábrica para obtener el adaptador correcto
    const gatewayAdapter = this.gatewayFactory.forGateway(body.gateway); // `forGateway` es un método a crear en la fábrica

    // 2. Llama al método de la interfaz, sin saber la implementación
    return gatewayAdapter.createPaymentIntent(body);
  }

  @post('/webhooks/{gateway}')
  // ... lógica para recibir webhooks, usar la fábrica para obtener el adaptador y llamar a `handleWebhook`
}
```
**Para agregar una nueva pasarela (ej. PayPal) en el futuro, solo se necesitará:**
1.  Crear `paypal.adapter.ts` que implemente `IPaymentGateway`.
2.  Actualizar la `PaymentGatewayFactory` para que reconozca `'paypal'`.
¡El controlador no necesitará ningún cambio!

## 4. Fase 4: Lógica de Negocio y Caché (Redis)

### 4.1. `CreditService`

Se creará un `src/services/credit.service.ts` con la lógica para manejar los créditos.
```typescript
export class CreditService {
  constructor(
    @repository(UserRepository) private userRepository: UserRepository
  ) {}

  async addCredits(userEmail: string, creditsToAdd: { invoices: number }): Promise<void> {
    const user = await this.userRepository.findById(userEmail);
    const newCredits = (user.credits?.invoices || 0) + creditsToAdd.invoices;
    await this.userRepository.updateById(userEmail, { credits: { invoices: newCredits } });

    // Aquí también se invalidará la caché de Redis para este usuario
  }
}
```
Este servicio será llamado desde el método `handleWebhook` de los adaptadores de pasarela cuando un pago sea exitoso.

### 4.2. Implementación de Caché con Redis

Se usará Redis para el endpoint `GET /users/{email}/balance`.

**`src/controllers/user.controller.ts` (extracto)**
```typescript
import {get, param} from '@loopback/rest';
import {inject} from '@loopback/core';
import {RedisDataSource} from '../datasources'; // Asumiendo que la datasource de Redis está configurada

export class UserController {
    private redisClient;

    constructor(
        @repository(UserRepository) private userRepository: UserRepository,
        @inject('datasources.redis') private redisDataSource: RedisDataSource,
    ) {
        this.redisClient = this.redisDataSource.connector.client;
    }

    @get('/users/{email}/balance')
    async getBalance(@param.path.string('email') email: string): Promise<{credits: any}> {
        const cacheKey = `balance:${email}`;

        // 1. Intentar obtener de la caché
        const cachedBalance = await this.redisClient.get(cacheKey);
        if (cachedBalance) {
            return JSON.parse(cachedBalance);
        }

        // 2. Si no está en caché, obtener de la BD
        const user = await this.userRepository.findById(email);
        const balance = { credits: user.credits };

        // 3. Guardar en caché para la próxima vez (con un TTL, ej. 1 hora)
        await this.redisClient.set(cacheKey, JSON.stringify(balance), 'EX', 3600);
        
        return balance;
    }
}
```

## 5. Fase 5: Pruebas y Seguridad

*   **Pruebas Unitarias**: Se deben crear pruebas para cada adaptador de pasarela, *mockeando* los SDKs de Stripe/MercadoPago para no realizar llamadas reales.
*   **Pruebas de Integración**: Se probarán los endpoints del controlador, asegurando que la fábrica y los adaptadores se invoquen correctamente.
*   **Seguridad**: Se implementará el *rate limiting* a nivel de `sequence.ts` o con un decorador personalizado, usando Redis para llevar la cuenta de las solicitudes por IP o usuario.