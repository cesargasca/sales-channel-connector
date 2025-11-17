import { z } from 'zod'

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid().optional().nullable(),
})

// Product attribute validation
export const attributeSchema = z.object({
  key: z.string().min(1, 'Attribute key is required'),
  value: z.string().min(1, 'Attribute value is required'),
})

// Product image validation
export const productImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  altText: z.string().optional(),
  position: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
})

// Product validations (updated for category support)
export const productSchema = z.object({
  categoryId: z.string().uuid('Category is required'),
  name: z.string().min(1, 'Product name is required'),
  modelName: z.string().optional(), // Legacy field
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be positive'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')), // Legacy field
  isActive: z.boolean().default(true),
  attributes: z.array(attributeSchema).default([]),
  images: z.array(productImageSchema).optional().default([]),
})

// Variant validations (updated for flexible attributes)
export const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  size: z.string().optional(), // Legacy field
  color: z.string().optional(), // Legacy field
  barcode: z.string().optional(),
  attributes: z.array(attributeSchema).default([]),
})

export const createVariantSchema = variantSchema.extend({
  productId: z.string().uuid(),
  inventory: z.object({
    quantityAvailable: z.number().int().min(0).default(0),
    quantityReserved: z.number().int().min(0).default(0),
    quantitySold: z.number().int().min(0).default(0),
    minStockThreshold: z.number().int().min(0).default(5),
    warehouseLocation: z.string().optional(),
  }).optional(),
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

export type CategoryInput = z.infer<typeof categorySchema>
export type AttributeInput = z.infer<typeof attributeSchema>
export type ProductImageInput = z.infer<typeof productImageSchema>
export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type ChannelInput = z.infer<typeof channelSchema>
export type ChannelListingInput = z.infer<typeof channelListingSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
