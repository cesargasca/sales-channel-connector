'use server'

import { revalidatePath } from 'next/cache'
import { InventoryService } from '@/services/inventory-service'
import { ChannelSyncService } from '@/services/channel-sync-service'
import { stockAdjustmentSchema, minStockThresholdSchema } from '@/lib/validations'

export async function adjustStock(data: unknown) {
  try {
    const validated = stockAdjustmentSchema.parse(data)

    const inventory = await InventoryService.adjustStock(
      validated.variantId,
      validated.quantityChange,
      validated.reason,
      validated.userId
    )

    // Queue sync to all channels
    await ChannelSyncService.syncStockToAllChannels(validated.variantId)

    revalidatePath('/inventory')
    return { success: true, inventory }
  } catch (error) {
    console.error('Adjust stock error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to adjust stock'
    }
  }
}

export async function updateMinStockThreshold(data: unknown) {
  try {
    const validated = minStockThresholdSchema.parse(data)

    const inventory = await InventoryService.updateMinStockThreshold(
      validated.variantId,
      validated.minStockThreshold
    )

    revalidatePath('/inventory')
    return { success: true, inventory }
  } catch (error) {
    console.error('Update threshold error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update threshold'
    }
  }
}

export async function getInventory(variantId?: string) {
  try {
    if (variantId) {
      const inventory = await InventoryService.getInventory(variantId)
      return { success: true, inventory }
    } else {
      const inventory = await InventoryService.getAllInventory()
      return { success: true, inventory }
    }
  } catch (error) {
    console.error('Get inventory error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory'
    }
  }
}

export async function getLowStockItems() {
  try {
    const items = await InventoryService.getLowStockItems()
    return { success: true, items }
  } catch (error) {
    console.error('Get low stock items error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get low stock items'
    }
  }
}

export async function getTransactionHistory(variantId: string) {
  try {
    const transactions = await InventoryService.getTransactionHistory(variantId)
    return { success: true, transactions }
  } catch (error) {
    console.error('Get transaction history error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    }
  }
}

export async function syncStockToChannels(variantId: string) {
  try {
    await ChannelSyncService.syncStockToAllChannels(variantId)
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    console.error('Sync stock error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync stock'
    }
  }
}
