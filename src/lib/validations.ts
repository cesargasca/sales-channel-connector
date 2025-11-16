import { z } from 'zod'

// Product validations
export const productSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be positive'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  barcode: z.string().optional(),
})

export const createVariantSchema = variantSchema.extend({
  productId: z.string().uuid(),
})

// Inventory validations
export const stockAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  quantityChange: z.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  userId: z.string().optional(),
})

export const minStockThresholdSchema = z.object({
  variantId: z.string().uuid(),
  minStockThreshold: z.number().int().min(0),
})

// Channel validations
export const channelSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  isActive: z.boolean().default(true),
  apiCredentials: z.record(z.any()).optional(),
  config: z.record(z.any()).optional(),
})

export const channelListingSchema = z.object({
  variantId: z.string().uuid(),
  channelId: z.string().uuid(),
  price: z.number().positive(),
  isActive: z.boolean().default(true),
})

// Order validations
export const createOrderSchema = z.object({
  channelId: z.string().uuid(),
  externalOrderId: z.string().min(1),
  totalAmount: z.number().positive(),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
  }).optional(),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
})

export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type ChannelInput = z.infer<typeof channelSchema>
export type ChannelListingInput = z.infer<typeof channelListingSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
