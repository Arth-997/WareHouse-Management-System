import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

  private mapInventoryItem(item: any) {
    const available = item.quantityOnHand - item.quantityReserved;
    return {
      id: item.id,
      sku: item.sku.skuCode,
      description: item.sku.description,
      client: item.client.name,
      warehouse: item.warehouse.code,
      onHand: item.quantityOnHand,
      reserved: item.quantityReserved,
      available,
      storageType: item.sku.storageType,
      expiry: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : 'N/A',
    };
  }

  async findAll(q?: string, clientId?: string) {
    const query = q?.trim();

    const whereConditions: any[] = [];

    if (query) {
      whereConditions.push({
        OR: [
          { sku: { skuCode: { contains: query, mode: 'insensitive' } } },
          { sku: { description: { contains: query, mode: 'insensitive' } } },
          { client: { name: { contains: query, mode: 'insensitive' } } },
          { warehouse: { code: { contains: query, mode: 'insensitive' } } },
        ],
      });
    }

    // Data scoping for CLIENT_USER
    if (clientId) {
      whereConditions.push({ clientId });
    }

    const items = await this.prisma.inventoryPosition.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
      include: {
        sku: true,
        client: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => this.mapInventoryItem(i));
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryPosition.findUnique({
      where: { id },
      include: {
        sku: true,
        client: true,
        warehouse: true,
      },
    });

    if (!item) return null;
    return this.mapInventoryItem(item);
  }
}
