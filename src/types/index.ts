import { Product, ProductVariant, Inventory, SalesChannel, Order, OrderItem } from '@prisma/client'

// Extended types with relations
export type ProductWithVariants = Product & {
  variants: (ProductVariant & {
    inventory: Inventory | null
  })[]
}

export type ProductVariantWithDetails = ProductVariant & {
  product: Product
  inventory: Inventory | null
  channelListings: ChannelListingWithChannel[]
}

export type ChannelListingWithChannel = {
  id: string
  variantId: string
  channelId: string
  externalId: string | null
  channelSku: string | null
  price: number
  isActive: boolean
  lastSyncedAt: Date | null
  channel: SalesChannel
}

export type OrderWithDetails = Order & {
  channel: SalesChannel
  items: (OrderItem & {
    variant: ProductVariant & {
      product: Product
    }
  })[]
}

export type InventoryWithVariant = Inventory & {
  variant: ProductVariant & {
    product: Product
  }
}

// Dashboard stats
export interface DashboardStats {
  totalProducts: number
  totalVariants: number
  lowStockItems: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  activeChannels: number
}

// Sync queue types
export interface SyncQueueItem {
  id: string
  variantId: string | null
  channelId: string
  action: 'UPDATE_STOCK' | 'UPDATE_PRICE' | 'CREATE_LISTING' | 'DELETE_LISTING'
  payload: any
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  retryCount: number
  errorMessage: string | null
  createdAt: Date
}
