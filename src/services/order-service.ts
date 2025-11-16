import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { InventoryService } from './inventory-service'

export class OrderService {
  /**
   * Create a new order and reserve inventory
   */
  static async createOrder(data: {
    channelId: string
    externalOrderId: string
    totalAmount: number
    customerInfo?: any
    items: Array<{
      variantId: string
      quantity: number
      unitPrice: number
    }>
  }) {
    return await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          channelId: data.channelId,
          externalOrderId: data.externalOrderId,
          status: OrderStatus.PENDING,
          totalAmount: data.totalAmount,
          customerInfo: data.customerInfo,
          items: {
            create: data.items.map(item => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Reserve inventory for each item
      for (const item of data.items) {
        await InventoryService.reserveStock(item.variantId, item.quantity, order.id)
      }

      return order
    })
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Handle status transitions
    if (status === OrderStatus.CONFIRMED && order.status === OrderStatus.PENDING) {
      // Confirm sale - move from reserved to sold
      for (const item of order.items) {
        await InventoryService.confirmSale(item.variantId, item.quantity, orderId)
      }
    } else if (status === OrderStatus.CANCELLED) {
      // Release reserved inventory
      if (order.status === OrderStatus.PENDING) {
        for (const item of order.items) {
          await InventoryService.releaseReservation(item.variantId, item.quantity, orderId)
        }
      }
    } else if (status === OrderStatus.RETURNED) {
      // Process return
      for (const item of order.items) {
        await InventoryService.processReturn(item.variantId, item.quantity, orderId)
      }
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        channel: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Get all orders with filters
   */
  static async getOrders(filters?: {
    channelId?: string
    status?: OrderStatus
    limit?: number
  }) {
    return await prisma.order.findMany({
      where: {
        ...(filters?.channelId && { channelId: filters.channelId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        channel: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    })
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string) {
    return await this.updateOrderStatus(orderId, OrderStatus.CANCELLED)
  }

  /**
   * Get order statistics
   */
  static async getOrderStats() {
    const [total, pending, confirmed, shipped, delivered, cancelled] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ])

    const revenue = await prisma.order.aggregate({
      where: {
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    return {
      total,
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      totalRevenue: revenue._sum.totalAmount || 0,
    }
  }
}
