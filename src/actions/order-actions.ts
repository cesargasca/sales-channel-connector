'use server'

import { revalidatePath } from 'next/cache'
import { OrderService } from '@/services/order-service'
import { createOrderSchema, updateOrderStatusSchema } from '@/lib/validations'

export async function createOrder(data: unknown) {
  try {
    const validated = createOrderSchema.parse(data)

    const order = await OrderService.createOrder({
      channelId: validated.channelId,
      externalOrderId: validated.externalOrderId,
      totalAmount: validated.totalAmount,
      customerInfo: validated.customerInfo,
      items: validated.items,
    })

    revalidatePath('/orders')
    return { success: true, order }
  } catch (error) {
    console.error('Create order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    }
  }
}

export async function updateOrderStatus(data: unknown) {
  try {
    const validated = updateOrderStatusSchema.parse(data)

    const order = await OrderService.updateOrderStatus(
      validated.orderId,
      validated.status
    )

    revalidatePath('/orders')
    revalidatePath(`/orders/${validated.orderId}`)
    return { success: true, order }
  } catch (error) {
    console.error('Update order status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status'
    }
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const order = await OrderService.cancelOrder(orderId)

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { success: true, order }
  } catch (error) {
    console.error('Cancel order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order'
    }
  }
}

export async function getOrder(orderId: string) {
  try {
    const order = await OrderService.getOrder(orderId)
    return { success: true, order }
  } catch (error) {
    console.error('Get order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order'
    }
  }
}

export async function getOrders(filters?: {
  channelId?: string
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  limit?: number
}) {
  try {
    const orders = await OrderService.getOrders(filters)
    return { success: true, orders }
  } catch (error) {
    console.error('Get orders error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get orders'
    }
  }
}

export async function getOrderStats() {
  try {
    const stats = await OrderService.getOrderStats()
    return { success: true, stats }
  } catch (error) {
    console.error('Get order stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order stats'
    }
  }
}
