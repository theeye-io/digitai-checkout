import {Entity, model, property} from '@loopback/repository';

@model()
export class Package extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  packageId: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'string',
    required: true,
    default: 'USD',
  })
  currency: string;

  @property({
    type: 'object',
    required: true,
  })
  grantsCredits: {
    invoices: number;
    [key: string]: number;
  };

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: Date;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt?: Date;

  @property({
    type: 'object',
  })
  metadata?: object;

  constructor(data?: Partial<Package>) {
    super(data);
  }
}

export interface PackageRelations {
  // describe navigational properties here
}

export type PackageWithRelations = Package & PackageRelations;