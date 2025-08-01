import {inject, Provider} from '@loopback/core';
import {repository} from '@loopback/repository';
import {IPaymentGateway} from './gateway.interface';
import {StripeAdapter} from './adapters/stripe.adapter';
import {MercadoPagoAdapter} from './adapters/mercado-pago.adapter';
import {TransactionRepository, PackageRepository} from '../repositories';
import {CreditService} from '../services';

export type GatewayType = 'stripe' | 'mercadopago';

export class PaymentGatewayFactory {
  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @repository(PackageRepository)
    private packageRepository: PackageRepository,
    @inject('services.CreditService')
    private creditService: CreditService,
  ) {}

  /**
   * Crea una instancia del adaptador de pasarela especificado
   * @param gatewayType Tipo de pasarela
   */
  create(gatewayType: GatewayType): IPaymentGateway {
    switch (gatewayType) {
      case 'stripe':
        return new StripeAdapter(
          this.transactionRepository,
          this.packageRepository,
          this.creditService,
        );
      
      case 'mercadopago':
        return new MercadoPagoAdapter(
          this.transactionRepository,
          this.packageRepository,
          this.creditService,
        );
      
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayType}`);
    }
  }

  /**
   * Obtiene la lista de pasarelas disponibles
   */
  getAvailableGateways(): GatewayType[] {
    const gateways: GatewayType[] = [];
    
    if (process.env.STRIPE_API_KEY) {
      gateways.push('stripe');
    }
    
    if (process.env.MP_ACCESS_TOKEN) {
      gateways.push('mercadopago');
    }
    
    return gateways;
  }

  /**
   * Verifica si una pasarela está configurada y disponible
   * @param gatewayType Tipo de pasarela
   */
  isGatewayAvailable(gatewayType: GatewayType): boolean {
    return this.getAvailableGateways().includes(gatewayType);
  }
}

// Provider para ser usado en la inyección de dependencias
export class PaymentGatewayFactoryProvider implements Provider<PaymentGatewayFactory> {
  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @repository(PackageRepository)
    private packageRepository: PackageRepository,
    @inject('services.CreditService')
    private creditService: CreditService,
  ) {}

  value(): PaymentGatewayFactory {
    return new PaymentGatewayFactory(
      this.transactionRepository,
      this.packageRepository,
      this.creditService,
    );
  }
}