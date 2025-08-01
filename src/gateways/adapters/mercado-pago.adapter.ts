import {inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {MercadoPagoConfig, Preference} from 'mercadopago';
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
export class MercadoPagoAdapter implements IPaymentGateway {
  private client: MercadoPagoConfig;
  private preference: Preference;

  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @repository(PackageRepository)
    private packageRepository: PackageRepository,
    @inject('services.CreditService')
    private creditService: CreditService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    });
    this.preference = new Preference(this.client);
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
      const externalReference = `theeye_${transactionId}`;

      // 3. Crear la transacción en nuestra BD con estado 'pending'
      const transaction = await this.transactionRepository.create({
        transactionId,
        userId: request.userEmail,
        packageId: request.packageId,
        amount: request.amount,
        currency: request.currency,
        status: TransactionStatus.PENDING,
        gateway: PaymentGateway.MERCADOPAGO,
        grantsCredits: pkg.grantsCredits,
        metadata: request.metadata,
      });

      // 4. Crear la preferencia en MercadoPago
      const preferenceData = {
        items: [
          {
            id: request.packageId,
            title: pkg.name,
            description: pkg.description || `Purchase of ${pkg.name}`,
            quantity: 1,
            unit_price: request.amount,
            currency_id: request.currency,
          },
        ],
        payer: {
          email: request.userEmail,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/pending`,
        },
        auto_return: 'approved' as const,
        external_reference: externalReference,
        notification_url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/webhooks/mercadopago`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        metadata: {
          internal_transaction_id: transaction.id!,
          user_email: request.userEmail,
          package_id: request.packageId,
        },
      };

      const preference = await this.preference.create({body: preferenceData});

      if (!preference.id || !preference.init_point) {
        throw new Error('Failed to create MercadoPago preference');
      }

      // 5. Actualizar la transacción con el ID de MercadoPago
      await this.transactionRepository.updateById(transaction.id!, {
        gatewayTransactionId: preference.id,
      });

      // 6. Devolver la URL de checkout para redirección
      return {
        checkoutUrl: preference.init_point,
        transactionId: transaction.id!,
        gatewayTransactionId: preference.id,
      };
    } catch (error) {
      console.error('MercadoPago createPaymentIntent error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    try {
      console.log('Received MercadoPago webhook:', JSON.stringify(payload, null, 2));

      // MercadoPago envía diferentes tipos de notificaciones
      if (payload.type === 'payment') {
        return this.handlePaymentNotification(payload);
      }

      if (payload.type === 'merchant_order') {
        return this.handleMerchantOrderNotification(payload);
      }

      console.log(`Unhandled MercadoPago webhook type: ${payload.type}`);
      return {
        status: 'success',
        message: `Unhandled webhook type: ${payload.type}`,
      };
    } catch (error) {
      console.error('MercadoPago webhook error:', error);
      return {
        status: 'failed',
        message: `Webhook processing failed: ${error.message}`,
      };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      // MercadoPago maneja reembolsos a través de la API de pagos
      // Nota: Implementación simplificada - en producción requiere más lógica
      console.log(`Refund requested for MercadoPago payment: ${request.gatewayTransactionId}`);
      
      // TODO: Implementar refund real usando la API de MercadoPago
      // const refund = await mercadopago.refund.create({...});
      
      return {
        success: false,
        message: 'MercadoPago refunds require manual processing',
      };
    } catch (error) {
      console.error('MercadoPago refund error:', error);
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
      // TODO: Implementar verificación de estado usando la API de MercadoPago
      // const payment = await mercadopago.payment.get(gatewayTransactionId);
      
      return {
        status: 'unknown',
        amount: 0,
        currency: 'USD',
      };
    } catch (error) {
      console.error('MercadoPago verifyPaymentStatus error:', error);
      throw error;
    }
  }

  private async handlePaymentNotification(payload: any): Promise<WebhookResult> {
    try {
      const paymentId = payload.data?.id;
      if (!paymentId) {
        return {
          status: 'failed',
          message: 'No payment ID found in webhook',
        };
      }

      // TODO: Obtener información del pago desde MercadoPago
      // const payment = await mercadopago.payment.get(paymentId);
      
      // Por ahora, implementación básica
      console.log(`Processing payment notification for payment ID: ${paymentId}`);
      
      return {
        status: 'success',
        message: 'Payment notification processed',
      };
    } catch (error) {
      console.error('Error handling payment notification:', error);
      return {
        status: 'failed',
        message: `Error processing payment notification: ${error.message}`,
      };
    }
  }

  private async handleMerchantOrderNotification(payload: any): Promise<WebhookResult> {
    try {
      const orderId = payload.data?.id;
      if (!orderId) {
        return {
          status: 'failed',
          message: 'No order ID found in webhook',
        };
      }

      // TODO: Obtener información de la orden desde MercadoPago
      console.log(`Processing merchant order notification for order ID: ${orderId}`);
      
      return {
        status: 'success',
        message: 'Merchant order notification processed',
      };
    } catch (error) {
      console.error('Error handling merchant order notification:', error);
      return {
        status: 'failed',
        message: `Error processing merchant order notification: ${error.message}`,
      };
    }
  }
}