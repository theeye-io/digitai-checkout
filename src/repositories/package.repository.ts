import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Package, PackageRelations} from '../models';

export class PackageRepository extends DefaultCrudRepository<
  Package,
  typeof Package.prototype.packageId,
  PackageRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Package, dataSource);
  }

  /**
   * Busca paquetes activos
   */
  async findActivePackages(): Promise<Package[]> {
    return this.find({
      where: {isActive: true},
    });
  }

  /**
   * Busca un paquete activo por ID
   * @param packageId ID del paquete
   */
  async findActivePackage(packageId: string): Promise<Package | null> {
    try {
      const pkg = await this.findById(packageId);
      return pkg.isActive ? pkg : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca paquetes por rango de precio
   * @param minPrice Precio mínimo
   * @param maxPrice Precio máximo
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Package[]> {
    return this.find({
      where: {
        and: [
          {price: {gte: minPrice}},
          {price: {lte: maxPrice}},
          {isActive: true},
        ],
      },
    });
  }
}