import {ApplicationConfig, DigitaiCheckoutApplication} from './application';
import * as dotenv from 'dotenv';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  // Determinar la ruta del archivo .env a cargar
  const envPath = `.env_${process.env.NODE_ENV || 'development'}`;
  
  // Cargar las variables de entorno desde el archivo correspondiente
  dotenv.config({ path: envPath });

  console.log(`Loading environment from: ${envPath}`);

  const app = new DigitaiCheckoutApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST || '127.0.0.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
