import {inject} from '@loopback/core';
import {
  post,
  get,
  requestBody,
  param,
  response,
  Request,
  RestBindings,
} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {PaymentGatewayFactory, GatewayType} from '../gateways';
import {TransactionRepository} from '../repositories';
import {PaymentIntentRequest, PaymentIntentResponse} from '../gateways/gateway.interface';

export class CheckoutController {
  constructor(
    @inject('factories.PaymentGatewayFactory')
    private gatewayFactory: PaymentGatewayFactory,
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
  ) {}

  @post('/purchase')
  @response(200, {
    description: 'Initiate a purchase transaction',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            clientSecret: {type: 'string'},
            checkoutUrl: {type: 'string'},
            transactionId: {type: 'string'},
            gatewayTransactionId: {type: 'string'},
          },
        },
      },
    },
  })
  async purchase(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['amount', 'currency', 'userEmail', 'packageId', 'gateway'],
            properties: {
              amount: {type: 'number', minimum: 0.01},
              currency: {type: 'string', enum: ['USD', 'EUR', 'ARS']},
              userEmail: {type: 'string', format: 'email'},
              packageId: {type: 'string'},
              gateway: {type: 'string', enum: ['stripe', 'mercadopago']},
              metadata: {type: 'object'},
            },
          },
        },
      },
    })
    body: PaymentIntentRequest & {gateway: GatewayType},
  ): Promise<PaymentIntentResponse> {
    // 1. Validar que la pasarela esté disponible
    if (!this.gatewayFactory.isGatewayAvailable(body.gateway)) {
      throw new Error(`Payment gateway ${body.gateway} is not available or configured`);
    }

    // 2. Obtener el adaptador correcto
    const gatewayAdapter = this.gatewayFactory.create(body.gateway);

    // 3. Crear la intención de pago
    try {
      const result = await gatewayAdapter.createPaymentIntent({
        amount: body.amount,
        currency: body.currency,
        userEmail: body.userEmail,
        packageId: body.packageId,
        metadata: body.metadata,
      });

      return result;
    } catch (error) {
      console.error('Purchase error:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  @get('/transactions/{id}')
  @response(200, {
    description: 'Get transaction details',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: {type: 'string'},
            transactionId: {type: 'string'},
            status: {type: 'string'},
            amount: {type: 'number'},
            currency: {type: 'string'},
            gateway: {type: 'string'},
            createdAt: {type: 'string'},
            completedAt: {type: 'string'},
          },
        },
      },
    },
  })
  async getTransaction(
    @param.path.string('id') transactionId: string,
  ): Promise<object> {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      
      return {
        id: transaction.id,
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        packageId: transaction.packageId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        gateway: transaction.gateway,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        failureReason: transaction.failureReason,
      };
    } catch (error) {
      console.error('Get transaction error:', error);
      throw new Error(`Transaction ${transactionId} not found`);
    }
  }

  @post('/webhooks/stripe')
  @response(200, {
    description: 'Stripe webhook endpoint',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            received: {type: 'boolean'},
            message: {type: 'string'},
          },
        },
      },
    },
  })
  async stripeWebhook(
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{received: boolean; message: string}> {
    try {
      const signature = request.headers['stripe-signature'] as string;
      const payload = request.body;

      if (!signature) {
        throw new Error('Missing Stripe signature');
      }

      const stripeAdapter = this.gatewayFactory.create('stripe');
      const result = await stripeAdapter.handleWebhook(payload, signature);

      return {
        received: result.status === 'success',
        message: result.message,
      };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return {
        received: false,
        message: `Webhook processing failed: ${error.message}`,
      };
    }
  }

  @post('/webhooks/mercadopago')
  @response(200, {
    description: 'MercadoPago webhook endpoint',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            received: {type: 'boolean'},
            message: {type: 'string'},
          },
        },
      },
    },
  })
  async mercadoPagoWebhook(
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{received: boolean; message: string}> {
    try {
      const payload = request.body;
      
      const mpAdapter = this.gatewayFactory.create('mercadopago');
      const result = await mpAdapter.handleWebhook(payload);

      return {
        received: result.status === 'success',
        message: result.message,
      };
    } catch (error) {
      console.error('MercadoPago webhook error:', error);
      return {
        received: false,
        message: `Webhook processing failed: ${error.message}`,
      };
    }
  }

  @get('/gateways')
  @response(200, {
    description: 'Get available payment gateways',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            available: {
              type: 'array',
              items: {type: 'string'},
            },
          },
        },
      },
    },
  })
  async getAvailableGateways(): Promise<{available: GatewayType[]}> {
    return {
      available: this.gatewayFactory.getAvailableGateways(),
    };
  }
}