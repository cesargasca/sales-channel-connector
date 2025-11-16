import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'

export class InventoryService {
  /**
   * Reserve stock for an order (prevents overselling)
   */
  static async reserveStock(variantId: string, quantity: number, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // Lock the inventory row
      const inventory = await tx.inventory.findUnique({
        where: { variantId },
      })

      if (!inventory) {
        throw new Error('Inventory not found')
      }

      if (inventory.quantityAvailable < quantity) {
        throw new Error(`Insufficient stock. Available: ${inventory.quantityAvailable}, Requested: ${quantity}`)
      }

      // Update inventory
      const updated = await tx.inventory.update({
        where: { variantId },
        data: {
          quantityAvailable: { decrement: quantity },
          quantityReserved: { increment: quantity },
        },
      })

      // Create transaction log
      await tx.inventoryTransaction.create({
        data: {
          variantId,
          transactionType: TransactionType.SALE,
          quantityChange: -quantity,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Reserved ${quantity} units for order ${orderId}`,
        },
      })

      return updated
    })
  }

  /**
   * Confirm sale (move from reserved to sold)
   */
  static async confirmSale(variantId: string, quantity: number, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { variantId },
        data: {
          quantityReserved: { decrement: quantity },
          quantitySold: { increment: quantity },
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          variantId,
          transactionType: TransactionType.SALE,
          quantityChange: -quantity,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Confirmed sale of ${quantity} units`,
        },
      })

      return updated
    })
  }

  /**
   * Release reserved stock (cancelled order)
   */
  static async releaseReservation(variantId: string, quantity: number, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { variantId },
        data: {
          quantityAvailable: { increment: quantity },
          quantityReserved: { decrement: quantity },
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          variantId,
          transactionType: TransactionType.ADJUSTMENT,
          quantityChange: quantity,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Released ${quantity} units from cancelled order`,
        },
      })

      return updated
    })
  }

  /**
   * Process return
   */
  static async processReturn(variantId: string, quantity: number, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { variantId },
        data: {
          quantityAvailable: { increment: quantity },
          quantitySold: { decrement: quantity },
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          variantId,
          transactionType: TransactionType.RETURN,
          quantityChange: quantity,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Returned ${quantity} units`,
        },
      })

      return updated
    })
  }

  /**
   * Manual stock adjustment
   */
  static async adjustStock(
    variantId: string,
    quantityChange: number,
    reason: string,
    userId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { variantId },
        data: {
          quantityAvailable: { increment: quantityChange },
          lastRestockedAt: quantityChange > 0 ? new Date() : undefined,
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          variantId,
          transactionType: quantityChange > 0 ? TransactionType.RESTOCK : TransactionType.ADJUSTMENT,
          quantityChange,
          referenceType: 'manual',
          notes: reason,
          createdBy: userId,
        },
      })

      return updated
    })
  }

  /**
   * Check stock availability
   */
  static async checkAvailability(variantId: string, quantity: number): Promise<boolean> {
    const inventory = await prisma.inventory.findUnique({
      where: { variantId },
    })

    return inventory ? inventory.quantityAvailable >= quantity : false
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems() {
    const items = await prisma.inventory.findMany({
      where: {
        quantityAvailable: {
          lte: prisma.inventory.fields.minStockThreshold,
        },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    })

    return items
  }

  /**
   * Get inventory by variant ID
   */
  static async getInventory(variantId: string) {
    return await prisma.inventory.findUnique({
      where: { variantId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    })
  }

  /**
   * Get all inventory with low stock filter
   */
  static async getAllInventory(lowStockOnly = false) {
    if (lowStockOnly) {
      return this.getLowStockItems()
    }

    return await prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  /**
   * Update minimum stock threshold
   */
  static async updateMinStockThreshold(variantId: string, minStockThreshold: number) {
    return await prisma.inventory.update({
      where: { variantId },
      data: { minStockThreshold },
    })
  }

  /**
   * Get inventory transaction history
   */
  static async getTransactionHistory(variantId: string, limit = 50) {
    return await prisma.inventoryTransaction.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
