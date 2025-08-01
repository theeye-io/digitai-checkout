// Define los datos necesarios para crear una intención de pago
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  userEmail: string;
  packageId: string;
  metadata?: Record<string, any>;
}

// Define la respuesta esperada tras crear la intención de pago
export interface PaymentIntentResponse {
  clientSecret?: string; // Para el frontend (ej. Stripe)
  checkoutUrl?: string;  // Para redirección (ej. MercadoPago)
  transactionId: string; // Nuestro ID interno
  gatewayTransactionId?: string; // ID de la transacción en la pasarela
}

// Define la estructura de una solicitud de reembolso
export interface RefundRequest {
  gatewayTransactionId: string;
  amount: number;
  reason?: string;
}

// Define la estructura del resultado de un webhook
export interface WebhookResult {
  status: 'success' | 'failed';
  message: string;
  transactionId?: string;
  shouldUpdateTransaction?: boolean;
  newStatus?: string;
}

// Define la estructura para el resultado de un reembolso
export interface RefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
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
  handleWebhook(payload: any, signature?: string): Promise<WebhookResult>;

  /**
   * Inicia un reembolso.
   * @param request Datos de la solicitud de reembolso.
   */
  refund(request: RefundRequest): Promise<RefundResult>;

  /**
   * Verifica el estado de una transacción en la pasarela.
   * @param gatewayTransactionId ID de la transacción en la pasarela.
   */
  verifyPaymentStatus(gatewayTransactionId: string): Promise<{
    status: string;
    amount?: number;
    currency?: string;
  }>;
}