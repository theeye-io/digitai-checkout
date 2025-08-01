import {DigitaiCheckoutApplication} from './application';
import {PackageRepository} from './repositories';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  const app = new DigitaiCheckoutApplication();
  await app.boot();
  await app.migrateSchema({existingSchema});

  // Seed data
  await seedData(app);

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

async function seedData(app: DigitaiCheckoutApplication) {
  console.log('Seeding data...');

  try {
    const packageRepo = await app.getRepository(PackageRepository);

    // Check if packages already exist
    const existingPackages = await packageRepo.find();
    if (existingPackages.length > 0) {
      console.log('Packages already exist, skipping seed data');
      return;
    }

    // Create sample packages
    const packages = [
      {
        packageId: 'inv_pack_100',
        name: 'Paquete de 100 Facturas',
        description: 'Paquete básico para procesar 100 facturas',
        price: 10.00,
        currency: 'USD',
        grantsCredits: {invoices: 100},
        isActive: true,
      },
      {
        packageId: 'inv_pack_500',
        name: 'Paquete de 500 Facturas',
        description: 'Paquete intermedio para procesar 500 facturas',
        price: 40.00,
        currency: 'USD',
        grantsCredits: {invoices: 500},
        isActive: true,
      },
      {
        packageId: 'inv_pack_1000',
        name: 'Paquete de 1000 Facturas',
        description: 'Paquete empresarial para procesar 1000 facturas',
        price: 70.00,
        currency: 'USD',
        grantsCredits: {invoices: 1000},
        isActive: true,
      },
      {
        packageId: 'inv_pack_5000',
        name: 'Paquete de 5000 Facturas',
        description: 'Paquete premium para procesar 5000 facturas',
        price: 300.00,
        currency: 'USD',
        grantsCredits: {invoices: 5000},
        isActive: true,
      },
    ];

    for (const pkg of packages) {
      await packageRepo.create(pkg);
      console.log(`Created package: ${pkg.name}`);
    }

    console.log('Seed data completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});