import {inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import Stripe from 'stripe';
import {v4 as uuidv4} from 'uuid';
import {
  IPaymentGateway,
  PaymentIntentRequest,
  PaymentIntentResponse,
  RefundRequest,
  RefundResult,
  WebhookResult,
} from '../gateway.interface';
import {TransactionRepository, PackageRepository} from '../../repositories';
import {TransactionStatus, PaymentGateway} from '../../models';
import {CreditService} from '../../services';

@injectable()
export class StripeAdapter implements IPaymentGateway {
  private stripe: Stripe;

  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @repository(PackageRepository)
    private packageRepository: PackageRepository,
    @inject('services.CreditService')
    private creditService: CreditService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_API_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      // 1. Verificar que el paquete existe y está activo
      const pkg = await this.packageRepository.findActivePackage(request.packageId);
      if (!pkg) {
        throw new Error(`Package ${request.packageId} not found or inactive`);
      }

      // 2. Generar un ID único para nuestra transacción
      const transactionId = uuidv4();

      // 3. Crear la transacción en nuestra BD con estado 'pending'
      const transaction = await this.transactionRepository.create({
        transactionId,
        userId: request.userEmail,
        packageId: request.packageId,
        amount: request.amount,
        currency: request.currency,
        status: TransactionStatus.PENDING,
        gateway: PaymentGateway.STRIPE,
        grantsCredits: pkg.grantsCredits,
        metadata: request.metadata,
      });

      // 4. Crear el PaymentIntent en Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Stripe usa centavos
        currency: request.currency.toLowerCase(),
        metadata: {
          internalTransactionId: transaction.id!,
          packageId: request.packageId,
          userEmail: request.userEmail,
        },
        description: `Purchase of ${pkg.name} by ${request.userEmail}`,
      });

      // 5. Actualizar la transacción con el ID de Stripe
      await this.transactionRepository.updateById(transaction.id!, {
        gatewayTransactionId: paymentIntent.id,
      });

      // 6. Devolver el client_secret para que el frontend lo use
      return {
        clientSecret: paymentIntent.client_secret!,
        transactionId: transaction.id!,
        gatewayTransactionId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe createPaymentIntent error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    try {
      // 1. Verificar la firma del webhook
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );

      console.log(`Received Stripe webhook: ${event.type}`);

      // 2. Procesar según el tipo de evento
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        
        case 'payment_intent.payment_failed':
          return this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        
        case 'payment_intent.canceled':
          return this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
          return {
            status: 'success',
            message: `Unhandled event type: ${event.type}`,
          };
      }
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return {
        status: 'failed',
        message: `Webhook processing failed: ${error.message}`,
      };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: request.gatewayTransactionId,
        amount: Math.round(request.amount * 100), // Stripe usa centavos
        reason: 'requested_by_customer',
        metadata: {
          reason: request.reason || 'Manual refund',
        },
      });

      return {
        success: true,
        refundId: refund.id,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        message: `Refund failed: ${error.message}`,
      };
    }
  }

  async verifyPaymentStatus(gatewayTransactionId: string): Promise<{
    status: string;
    amount?: number;
    currency?: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(gatewayTransactionId);
      
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convertir de centavos
        currency: paymentIntent.currency.toUpperCase(),
      };
    } catch (error) {
      console.error('Stripe verifyPaymentStatus error:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<WebhookResult> {
    try {
      const internalTransactionId = paymentIntent.metadata.internalTransactionId;
      if (!internalTransactionId) {
        return {
          status: 'failed',
          message: 'No internal transaction ID found in metadata',
        };
      }

      // Buscar la transacción en nuestra BD
      const transaction = await this.transactionRepository.findById(internalTransactionId);
      if (!transaction) {
        return {
          status: 'failed',
          message: `Transaction ${internalTransactionId} not found`,
        };
      }

      // Actualizar el estado de la transacción
      await this.transactionRepository.updateStatus(
        transaction.id!,
        TransactionStatus.COMPLETED,
        {
          gatewayResponse: paymentIntent,
        },
      );

      // Acreditar los créditos al usuario
      if (transaction.grantsCredits) {
        await this.creditService.addCredits(transaction.userId, transaction.grantsCredits);
      }

      return {
        status: 'success',
        message: 'Payment processed and credits added',
        transactionId: transaction.id!,
      };
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      return {
        status: 'failed',
        message: `Error processing payment: ${error.message}`,
      };
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<WebhookResult> {
    try {
      const internalTransactionId = paymentIntent.metadata.internalTransactionId;
      if (!internalTransactionId) {
        return {
          status: 'failed',
          message: 'No internal transaction ID found in metadata',
        };
      }

      // Actualizar el estado de la transacción
      await this.transactionRepository.updateStatus(
        internalTransactionId,
        TransactionStatus.FAILED,
        {
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          gatewayResponse: paymentIntent,
        },
      );

      return {
        status: 'success',
        message: 'Transaction marked as failed',
        transactionId: internalTransactionId,
      };
    } catch (error) {
      console.error('Error handling payment failed:', error);
      return {
        status: 'failed',
        message: `Error processing failed payment: ${error.message}`,
      };
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<WebhookResult> {
    try {
      const internalTransactionId = paymentIntent.metadata.internalTransactionId;
      if (!internalTransactionId) {
        return {
          status: 'failed',
          message: 'No internal transaction ID found in metadata',
        };
      }

      // Actualizar el estado de la transacción
      await this.transactionRepository.updateStatus(
        internalTransactionId,
        TransactionStatus.CANCELLED,
        {
          gatewayResponse: paymentIntent,
        },
      );

      return {
        status: 'success',
        message: 'Transaction marked as cancelled',
        transactionId: internalTransactionId,
      };
    } catch (error) {
      console.error('Error handling payment canceled:', error);
      return {
        status: 'failed',
        message: `Error processing canceled payment: ${error.message}`,
      };
    }
  }
}