import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Transaction, TransactionRelations, TransactionStatus, PaymentGateway} from '../models';

export class TransactionRepository extends DefaultCrudRepository<
  Transaction,
  typeof Transaction.prototype.id,
  TransactionRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Transaction, dataSource);
  }

  /**
   * Busca transacciones por usuario
   * @param userId ID del usuario
   */
  async findByUser(userId: string): Promise<Transaction[]> {
    return this.find({
      where: {userId},
      order: ['createdAt DESC'],
    });
  }

  /**
   * Busca transacciones por estado
   * @param status Estado de la transacción
   */
  async findByStatus(status: TransactionStatus): Promise<Transaction[]> {
    return this.find({
      where: {status},
      order: ['createdAt DESC'],
    });
  }

  /**
   * Busca transacciones por pasarela
   * @param gateway Pasarela de pago
   */
  async findByGateway(gateway: PaymentGateway): Promise<Transaction[]> {
    return this.find({
      where: {gateway},
      order: ['createdAt DESC'],
    });
  }

  /**
   * Busca una transacción por ID de la pasarela
   * @param gatewayTransactionId ID de la transacción en la pasarela
   */
  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<Transaction | null> {
    const transactions = await this.find({
      where: {gatewayTransactionId},
      limit: 1,
    });
    return transactions.length > 0 ? transactions[0] : null;
  }

  /**
   * Actualiza el estado de una transacción
   * @param transactionId ID de la transacción
   * @param status Nuevo estado
   * @param additionalData Datos adicionales a actualizar
   */
  async updateStatus(
    transactionId: string,
    status: TransactionStatus,
    additionalData?: Partial<Transaction>,
  ): Promise<void> {
    const updateData: Partial<Transaction> = {
      status,
      ...additionalData,
    };

    if (status === TransactionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.updateById(transactionId, updateData);
  }

  /**
   * Busca transacciones pendientes más antiguas que X minutos
   * @param minutes Minutos de antigüedad
   */
  async findStalePendingTransactions(minutes: number = 30): Promise<Transaction[]> {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - minutes);

    return this.find({
      where: {
        and: [
          {status: TransactionStatus.PENDING},
          {createdAt: {lt: cutoffDate}},
        ],
      },
    });
  }

  /**
   * Obtiene estadísticas de transacciones
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    refunded: number;
  }> {
    const [total, pending, completed, failed, refunded] = await Promise.all([
      this.count(),
      this.count({status: TransactionStatus.PENDING}),
      this.count({status: TransactionStatus.COMPLETED}),
      this.count({status: TransactionStatus.FAILED}),
      this.count({status: TransactionStatus.REFUNDED}),
    ]);

    return {
      total: total.count,
      pending: pending.count,
      completed: completed.count,
      failed: failed.count,
      refunded: refunded.count,
    };
  }
}