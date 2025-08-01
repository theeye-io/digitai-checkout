# TheEye Checkout API

Una API robusta de pagos en línea para la gestión de compras de paquetes de servicios, desarrollada con **LoopBack 4**, **MongoDB**, **Redis** y integrada con **Stripe** y **MercadoPago**.

## 🚀 Características Principales

- **🏗️ Arquitectura Escalable**: Basada en LoopBack 4 con TypeScript
- **💳 Múltiples Pasarelas**: Integración con Stripe y MercadoPago usando Factory Pattern
- **💾 Sistema de Créditos**: Gestión automática de créditos post-compra
- **⚡ Alta Performance**: Caché con Redis para consultas frecuentes y rate limiting
- **🌍 Multi-entorno**: Configuración dinámica para Development, Staging y Production
- **🔒 Seguridad**: Manejo seguro de webhooks y validación de firmas
- **📊 Trazabilidad**: Registro completo de transacciones para auditoría
- **🔄 Resiliente**: Sistema de reembolso automático ante fallos

## 🛠️ Tecnologías

- **Framework**: LoopBack 4 + TypeScript
- **Base de Datos**: MongoDB (persistencia)
- **Caché**: Redis (performance + rate limiting)
- **Pasarelas de Pago**: Stripe + MercadoPago
- **Documentación**: OpenAPI/Swagger automático
- **Testing**: Mocha + Chai
- **Containerización**: Docker

## 📦 Instalación

### Prerrequisitos

- Node.js 20+ 
- MongoDB
- Redis
- Cuentas en Stripe y/o MercadoPago

### Clonar e Instalar

```bash
git clone <repository-url>
cd digitai-checkout
npm install
```

### Configuración de Entornos

Copia y configura las variables de entorno:

```bash
# Desarrollo
cp .env_development .env_development
# Editar .env_development con tus credenciales

# Staging  
cp .env_staging .env_staging
# Editar .env_staging con credenciales de staging

# Producción
cp .env_production .env_production  
# Editar .env_production con credenciales de producción
```

### Variables de Entorno Requeridas

```env
NODE_ENV=development
PORT=3000
HOST=127.0.0.1

# MongoDB
MONGO_URI=mongodb://localhost:27017/theeye_checkout_dev

# Redis
REDIS_URL=redis://localhost:6379

# Stripe (opcional)
STRIPE_API_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# MercadoPago (opcional)
MP_ACCESS_TOKEN=TEST-your_mercadopago_token
MP_WEBHOOK_SECRET=your_webhook_secret

# Configuración
LOG_LEVEL=debug
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── controllers/          # Endpoints de la API
│   ├── checkout.controller.ts    # Compras y webhooks
│   └── user.controller.ts        # Gestión de usuarios
├── models/               # Modelos de datos
│   ├── user.model.ts            # Usuario con créditos
│   ├── package.model.ts         # Paquetes de servicios
│   └── transaction.model.ts     # Transacciones
├── repositories/         # Acceso a datos
├── services/            # Lógica de negocio
│   ├── credit.service.ts        # Gestión de créditos
│   └── cache.service.ts         # Gestión de caché
├── gateways/            # Integración de pagos
│   ├── gateway.interface.ts     # Contrato común
│   ├── gateway.factory.ts       # Factory Pattern
│   └── adapters/
│       ├── stripe.adapter.ts    # Integración Stripe
│       └── mercado-pago.adapter.ts # Integración MP
├── datasources/         # Conexiones BD
│   ├── mongo.datasource.ts     # MongoDB
│   └── redis.datasource.ts     # Redis
└── application.ts       # Configuración de app
```

## 🌐 API Endpoints

### 💳 Compras y Pagos

```http
POST /purchase
Content-Type: application/json

{
  "amount": 10.00,
  "currency": "USD", 
  "userEmail": "user@example.com",
  "packageId": "inv_pack_100",
  "gateway": "stripe", // o "mercadopago"
  "metadata": {}
}
```

**Respuesta:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx", // Stripe
  "checkoutUrl": "https://checkout.mercadopago...", // MercadoPago
  "transactionId": "uuid-transaction",
  "gatewayTransactionId": "pi_xxx"
}
```

### 📊 Consultas

```http
# Estado de transacción
GET /transactions/{transactionId}

# Saldo de usuario (con caché Redis)
GET /users/{email}/balance

# Información de usuario
GET /users/{email}

# Pasarelas disponibles
GET /gateways
```

### 🎯 Gestión de Créditos

```http
# Consumir créditos
POST /users/{email}/consume
Content-Type: application/json

{
  "credits": {
    "invoices": 5
  }
}
```

### 🔗 Webhooks

```http
# Webhook Stripe
POST /webhooks/stripe
Stripe-Signature: xxx

# Webhook MercadoPago  
POST /webhooks/mercadopago
```

## 🎛️ Uso de la API

### Flujo de Compra Completo

1. **Obtener paquetes disponibles** (pendiente implementar)
2. **Iniciar compra**:
   ```bash
   curl -X POST http://localhost:3000/purchase \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 10.00,
       "currency": "USD",
       "userEmail": "customer@example.com", 
       "packageId": "inv_pack_100",
       "gateway": "stripe"
     }'
   ```

3. **Procesar pago** (frontend con Stripe Elements o redirección MP)

4. **Webhook confirma pago** → **Créditos se acreditan automáticamente**

5. **Consultar saldo**:
   ```bash
   curl http://localhost:3000/users/customer@example.com/balance
   ```

6. **Consumir créditos**:
   ```bash
   curl -X POST http://localhost:3000/users/customer@example.com/consume \
     -H "Content-Type: application/json" \
     -d '{"credits": {"invoices": 1}}'
   ```

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
npm run build:watch    # Compilación automática
NODE_ENV=development npm start

# Staging  
NODE_ENV=staging npm start

# Producción
NODE_ENV=production npm start

# Base de datos
npm run migrate        # Migrar esquemas + seed data
npm run migrate -- --rebuild  # Recrear BD

# Código
npm run lint          # Linting
npm run lint:fix      # Fix automático
npm test             # Tests
npm run rebuild      # Build completo

# Docker
npm run docker:build  # Construir imagen
npm run docker:run    # Ejecutar contenedor
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t digitai-checkout .

# Ejecutar
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://mongo:27017/theeye_checkout \
  -e REDIS_URL=redis://redis:6379 \
  digitai-checkout
```

## 📋 Modelos de Datos

### Usuario
```typescript
{
  email: string;        // ID único
  userId: string;       
  credits: {
    invoices: number;   // Créditos disponibles
    [key: string]: number; // Extensible
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Paquete
```typescript
{
  packageId: string;    // ID único
  name: string;
  description?: string;
  price: number;
  currency: string;
  grantsCredits: {      // Créditos que otorga
    invoices: number;
    [key: string]: number;
  };
  isActive: boolean;
}
```

### Transacción
```typescript
{
  transactionId: string;
  userId: string;
  packageId: string;
  gateway: 'stripe' | 'mercadopago';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  gatewayTransactionId?: string;
  grantsCredits?: object;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}
```

## 🔧 Configuración Avanzada

### Rate Limiting
El sistema incluye rate limiting por IP usando Redis:
- Configurable via `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX_REQUESTS`
- Protege endpoints críticos como `/purchase`

### Caché Inteligente
- **Saldos de usuario**: TTL 1 hora, invalidación automática post-transacción
- **Definiciones de paquetes**: Caché de larga duración
- **Fallback graceful**: La app funciona sin Redis

### Multimoneda
Soporte nativo para USD, EUR, ARS (extensible)

## 📖 Documentación

- **Swagger UI**: `http://localhost:3000/explorer`
- **OpenAPI Spec**: `npm run openapi-spec`
- **Arquitectura**: Ver `docs/PRP_DIGITAI_CHECKOUT.md`
- **Plan de Desarrollo**: Ver `docs/DEV_PLAN.md`

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- --grep "CreditService"
```

## 🔍 Troubleshooting

### MongoDB no conecta
```bash
# Verificar MongoDB
mongosh mongodb://localhost:27017/theeye_checkout_dev
```

### Redis no disponible
```bash
# Verificar Redis
redis-cli ping
```

### Errores de webhook
- Verificar `STRIPE_WEBHOOK_SECRET` en Stripe Dashboard
- Logs detallados en console con `LOG_LEVEL=debug`

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agrega nueva funcionalidad'`
4. Push a branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

## 🏷️ Roadmap

- [ ] Panel de administración
- [ ] Más pasarelas (PayPal, etc.)
- [ ] Sistema de cupones/descuentos
- [ ] Analytics y reportes
- [ ] API de subscripciones
- [ ] Webhook retry logic
- [ ] Tests de integración

---

**Desarrollado por**: TheEye Team  
**Tecnología**: LoopBack 4 + TypeScript  
**Documentación**: Siempre actualizada en `/explorer`

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)