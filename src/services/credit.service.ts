import {inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserRepository} from '../repositories';
import {User} from '../models';
import {RedisDataSource} from '../datasources';

@injectable()
export class CreditService {
  private redisClient: any;

  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('datasources.redis')
    private redisDataSource: RedisDataSource,
  ) {
    this.redisClient = this.redisDataSource.client;
  }

  /**
   * Agrega créditos a un usuario
   * @param userEmail Email del usuario
   * @param creditsToAdd Créditos a agregar
   */
  async addCredits(userEmail: string, creditsToAdd: {[key: string]: number}): Promise<User> {
    // 1. Buscar o crear el usuario
    let user: User;
    try {
      user = await this.userRepository.findById(userEmail);
    } catch (error) {
      // Si no existe, crear el usuario
      user = await this.userRepository.create({
        email: userEmail,
        userId: userEmail,
        credits: {invoices: 0},
        isActive: true,
      });
    }

    // 2. Calcular los nuevos créditos
    const currentCredits = user.credits || {invoices: 0};
    const newCredits: {[key: string]: number} = {};
    
    // Sumar los créditos existentes + los nuevos
    for (const [creditType, amount] of Object.entries(creditsToAdd)) {
      newCredits[creditType] = (currentCredits[creditType] || 0) + amount;
    }

    // 3. Actualizar el usuario en la base de datos
    const updatedUser = await this.userRepository.updateById(userEmail, {
      credits: newCredits,
      updatedAt: new Date(),
    });

    // 4. Invalidar la caché de Redis para este usuario
    await this.invalidateUserCache(userEmail);

    // 5. Retornar el usuario actualizado
    return this.userRepository.findById(userEmail);
  }

  /**
   * Consume créditos de un usuario
   * @param userEmail Email del usuario
   * @param creditsToConsume Créditos a consumir
   * @returns true si se pudieron consumir los créditos, false si no hay suficientes
   */
  async consumeCredits(userEmail: string, creditsToConsume: {[key: string]: number}): Promise<{success: boolean; message?: string}> {
    try {
      const user = await this.userRepository.findById(userEmail);
      const currentCredits = user.credits || {invoices: 0};

      // Verificar que hay suficientes créditos
      for (const [creditType, amount] of Object.entries(creditsToConsume)) {
        if ((currentCredits[creditType] || 0) < amount) {
          return {
            success: false,
            message: `Insufficient ${creditType} credits. Required: ${amount}, Available: ${currentCredits[creditType] || 0}`,
          };
        }
      }

      // Consumir los créditos
      const newCredits: {[key: string]: number} = {...currentCredits};
      for (const [creditType, amount] of Object.entries(creditsToConsume)) {
        newCredits[creditType] = (newCredits[creditType] || 0) - amount;
      }

      // Actualizar el usuario
      await this.userRepository.updateById(userEmail, {
        credits: newCredits,
        updatedAt: new Date(),
      });

      // Invalidar la caché
      await this.invalidateUserCache(userEmail);

      return {success: true};
    } catch (error) {
      return {
        success: false,
        message: `User not found: ${userEmail}`,
      };
    }
  }

  /**
   * Obtiene el balance de créditos de un usuario (optimizado con caché)
   * @param userEmail Email del usuario
   */
  async getUserBalance(userEmail: string): Promise<{credits: {[key: string]: number}}> {
    const cacheKey = `balance:${userEmail}`;

    try {
      // 1. Intentar obtener de la caché
      if (this.redisClient) {
        const cachedBalance = await this.redisClient.get(cacheKey);
        if (cachedBalance) {
          return JSON.parse(cachedBalance);
        }
      }

      // 2. Si no está en caché, obtener de la BD
      let user: User;
      try {
        user = await this.userRepository.findById(userEmail);
      } catch (error) {
        // Si el usuario no existe, retornar créditos en 0
        return {credits: {invoices: 0}};
      }

      const balance = {credits: user.credits || {invoices: 0}};

      // 3. Guardar en caché para la próxima vez (TTL de 1 hora)
      if (this.redisClient) {
        await this.redisClient.set(cacheKey, JSON.stringify(balance), 'EX', 3600);
      }

      return balance;
    } catch (error) {
      // En caso de error, devolver créditos en 0
      return {credits: {invoices: 0}};
    }
  }

  /**
   * Invalida la caché de un usuario
   * @param userEmail Email del usuario
   */
  private async invalidateUserCache(userEmail: string): Promise<void> {
    if (this.redisClient) {
      const cacheKey = `balance:${userEmail}`;
      try {
        await this.redisClient.del(cacheKey);
      } catch (error) {
        console.warn(`Failed to invalidate cache for user ${userEmail}:`, error);
      }
    }
  }
}