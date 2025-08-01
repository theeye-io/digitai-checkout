import {inject, injectable} from '@loopback/core';
import {RedisDataSource} from '../datasources';

@injectable()
export class CacheService {
  private redisClient: any;

  constructor(
    @inject('datasources.redis')
    private redisDataSource: RedisDataSource,
  ) {
    this.redisClient = this.redisDataSource.client;
  }

  /**
   * Obtiene un valor del caché
   * @param key Clave del caché
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establece un valor en el caché
   * @param key Clave del caché
   * @param value Valor a almacenar
   * @param ttlSeconds TTL en segundos (opcional)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.set(key, serializedValue, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, serializedValue);
      }
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Elimina un valor del caché
   * @param key Clave del caché
   */
  async del(key: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Incrementa un contador en Redis (usado para rate limiting)
   * @param key Clave del contador
   * @param ttlSeconds TTL en segundos
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (!this.redisClient) {
      return 1;
    }

    try {
      const count = await this.redisClient.incr(key);
      if (count === 1) {
        // Solo establecer TTL en el primer incremento
        await this.redisClient.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      console.warn(`Cache increment error for key ${key}:`, error);
      return 1;
    }
  }

  /**
   * Verifica si Redis está disponible
   */
  async isAvailable(): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getStats(): Promise<{connected: boolean; keyCount?: number}> {
    if (!this.redisClient) {
      return {connected: false};
    }

    try {
      await this.redisClient.ping();
      const keyCount = await this.redisClient.dbsize();
      return {
        connected: true,
        keyCount,
      };
    } catch (error) {
      return {connected: false};
    }
  }
}