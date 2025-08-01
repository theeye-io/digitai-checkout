import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';

// Import datasources
import {MongoDataSource, RedisDataSource} from './datasources';

// Import repositories
import {UserRepository, PackageRepository, TransactionRepository} from './repositories';

// Import services
import {CreditService, CacheService} from './services';

// Import gateways
import {PaymentGatewayFactory, PaymentGatewayFactoryProvider} from './gateways';

export {ApplicationConfig};

export class DigitaiCheckoutApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    // Register datasources
    this.dataSource(MongoDataSource, 'mongo');
    this.bind('datasources.redis').toClass(RedisDataSource);

    // Register repositories
    this.repository(UserRepository);
    this.repository(PackageRepository);
    this.repository(TransactionRepository);

    // Register services
    this.service(CreditService);
    this.service(CacheService);

    // Register factories
    this.bind('factories.PaymentGatewayFactory').toProvider(PaymentGatewayFactoryProvider);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
