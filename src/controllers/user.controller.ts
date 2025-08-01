import {inject} from '@loopback/core';
import {
  get,
  post,
  param,
  requestBody,
  response,
} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {UserRepository} from '../repositories';
import {CreditService} from '../services';

export class UserController {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
    @inject('services.CreditService')
    private creditService: CreditService,
  ) {}

  @get('/users/{email}/balance')
  @response(200, {
    description: 'Get user credit balance',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            credits: {
              type: 'object',
              properties: {
                invoices: {type: 'number'},
              },
              additionalProperties: {type: 'number'},
            },
          },
        },
      },
    },
  })
  async getBalance(
    @param.path.string('email') email: string,
  ): Promise<{credits: {[key: string]: number}}> {
    try {
      const balance = await this.creditService.getUserBalance(email);
      return balance;
    } catch (error) {
      console.error('Get balance error:', error);
      throw new Error(`Failed to get balance for user ${email}: ${error.message}`);
    }
  }

  @post('/users/{email}/consume')
  @response(200, {
    description: 'Consume user credits',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {type: 'boolean'},
            message: {type: 'string'},
            remainingCredits: {
              type: 'object',
              additionalProperties: {type: 'number'},
            },
          },
        },
      },
    },
  })
  async consumeCredits(
    @param.path.string('email') email: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['credits'],
            properties: {
              credits: {
                type: 'object',
                properties: {
                  invoices: {type: 'number', minimum: 1},
                },
                additionalProperties: {type: 'number', minimum: 1},
                minProperties: 1,
              },
            },
          },
        },
      },
    })
    body: {credits: {[key: string]: number}},
  ): Promise<{success: boolean; message?: string; remainingCredits?: {[key: string]: number}}> {
    try {
      const result = await this.creditService.consumeCredits(email, body.credits);
      
      if (result.success) {
        // Obtener el balance actualizado
        const balance = await this.creditService.getUserBalance(email);
        return {
          success: true,
          remainingCredits: balance.credits,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Consume credits error:', error);
      return {
        success: false,
        message: `Failed to consume credits: ${error.message}`,
      };
    }
  }

  @get('/users/{email}')
  @response(200, {
    description: 'Get user details',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            email: {type: 'string'},
            userId: {type: 'string'},
            credits: {
              type: 'object',
              additionalProperties: {type: 'number'},
            },
            isActive: {type: 'boolean'},
            createdAt: {type: 'string'},
            updatedAt: {type: 'string'},
          },
        },
      },
    },
  })
  async getUser(
    @param.path.string('email') email: string,
  ): Promise<object> {
    try {
      const user = await this.userRepository.findById(email);
      return {
        email: user.email,
        userId: user.userId,
        credits: user.credits,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(`User ${email} not found`);
    }
  }

  @post('/users')
  @response(201, {
    description: 'Create a new user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            email: {type: 'string'},
            userId: {type: 'string'},
            credits: {
              type: 'object',
              additionalProperties: {type: 'number'},
            },
            isActive: {type: 'boolean'},
          },
        },
      },
    },
  })
  async createUser(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {type: 'string', format: 'email'},
              userId: {type: 'string'},
              credits: {
                type: 'object',
                properties: {
                  invoices: {type: 'number', minimum: 0},
                },
                additionalProperties: {type: 'number', minimum: 0},
              },
            },
          },
        },
      },
    })
    body: {email: string; userId?: string; credits?: {[key: string]: number}},
  ): Promise<object> {
    try {
      const user = await this.userRepository.create({
        email: body.email,
        userId: body.userId || body.email,
        credits: body.credits || {invoices: 0},
        isActive: true,
      });

      return {
        email: user.email,
        userId: user.userId,
        credits: user.credits,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
}