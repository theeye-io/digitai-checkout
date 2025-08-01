import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {User, UserRelations} from '../models';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.email,
  UserRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(User, dataSource);
  }

  /**
   * Busca o crea un usuario
   * @param email Email del usuario
   */
  async findOrCreate(email: string): Promise<User> {
    try {
      return await this.findById(email);
    } catch (error) {
      // Si no existe, crearlo
      return this.create({
        email,
        userId: email,
        credits: {invoices: 0},
        isActive: true,
      });
    }
  }

  /**
   * Busca usuarios activos
   */
  async findActiveUsers(): Promise<User[]> {
    return this.find({
      where: {isActive: true},
    });
  }

  /**
   * Actualiza los créditos de un usuario de forma segura
   * @param email Email del usuario
   * @param credits Nuevos créditos
   */
  async updateCredits(email: string, credits: {[key: string]: number}): Promise<void> {
    await this.updateById(email, {
      credits,
      updatedAt: new Date(),
    });
  }
}