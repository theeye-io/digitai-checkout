import {Entity, model, property} from '@loopback/repository';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  MERCADOPAGO = 'mercadopago',
}

@model()
export class Transaction extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  transactionId: string;

  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  packageId: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(PaymentGateway),
    },
  })
  gateway: PaymentGateway;

  @property({
    type: 'string',
  })
  gatewayTransactionId?: string;

  @property({
    type: 'string',
    required: true,
    default: TransactionStatus.PENDING,
    jsonSchema: {
      enum: Object.values(TransactionStatus),
    },
  })
  status: TransactionStatus;

  @property({
    type: 'number',
    required: true,
  })
  amount: number;

  @property({
    type: 'string',
    required: true,
    default: 'USD',
  })
  currency: string;

  @property({
    type: 'object',
  })
  grantsCredits?: {
    invoices: number;
    [key: string]: number;
  };

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: Date;

  @property({
    type: 'date',
  })
  completedAt?: Date;

  @property({
    type: 'string',
  })
  failureReason?: string;

  @property({
    type: 'object',
  })
  gatewayResponse?: object;

  @property({
    type: 'object',
  })
  metadata?: object;

  constructor(data?: Partial<Transaction>) {
    super(data);
  }
}

export interface TransactionRelations {
  // describe navigational properties here
}

export type TransactionWithRelations = Transaction & TransactionRelations;