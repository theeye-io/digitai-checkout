import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {createClient, RedisClientType} from 'redis';

@lifeCycleObserver('datasource')
export class RedisDataSource implements LifeCycleObserver {
  static dataSourceName = 'redis';
  public client: RedisClientType;
  private _isConnected = false;

  constructor(
    @inject('datasources.config.redis', {optional: true})
    dsConfig?: object,
  ) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this._isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this._isConnected = false;
    });
  }

  async start(): Promise<void> {
    if (!this._isConnected) {
      try {
        await this.client.connect();
        console.log('Redis datasource started successfully');
      } catch (error) {
        console.error('Failed to start Redis datasource:', error);
        // Don't throw error to allow app to start without Redis
      }
    }
  }

  async stop(): Promise<void> {
    if (this._isConnected) {
      try {
        await this.client.quit();
        console.log('Redis datasource stopped successfully');
      } catch (error) {
        console.error('Error stopping Redis datasource:', error);
      }
    }
  }

  get connector() {
    return {
      client: this.client,
    };
  }

  isConnected(): boolean {
    return this._isConnected;
  }
}