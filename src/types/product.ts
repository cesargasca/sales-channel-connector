import { Decimal } from '@prisma/client/runtime/library'

export interface ProductAttribute {
  id: string
  productId: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export interface VariantAttribute {
  id: string
  variantId: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText?: string | null
  position: number
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  size?: string | null
  color?: string | null
  sku: string
  barcode?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariantWithAttributes extends ProductVariant {
  attributes: VariantAttribute[]
}

export interface ProductVariantWithInventory extends ProductVariantWithAttributes {
  inventory?: {
    id: string
    quantityAvailable: number
    quantityReserved: number
    quantitySold: number
    minStockThreshold: number
    warehouseLocation?: string | null
  } | null
}

export interface Product {
  id: string
  categoryId: string
  name: string
  modelName?: string | null
  description?: string | null
  basePrice: Decimal
  imageUrl?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductWithCategory extends Product {
  category: {
    id: string
    name: string
    slug: string
  }
}

export interface ProductWithAttributes extends Product {
  attributes: ProductAttribute[]
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
}

export interface ProductWithDetails extends Product {
  category: {
    id: string
    name: string
    slug: string
    parent?: {
      id: string
      name: string
      slug: string
    } | null
  }
  attributes: ProductAttribute[]
  variants: ProductVariantWithInventory[]
  images: ProductImage[]
}

export interface ProductWithVariantCount extends ProductWithCategory {
  _count: {
    variants: number
  }
}

// Form data types
export type ProductAttributeInput = {
  key: string
  value: string
}

export type VariantAttributeInput = {
  key: string
  value: string
}

export type ProductImageInput = {
  url: string
  altText?: string
  position: number
  isPrimary: boolean
}

export type ProductVariantInput = {
  sku: string
  barcode?: string
  attributes: VariantAttributeInput[]
  inventory?: {
    quantityAvailable: number
    quantityReserved?: number
    quantitySold?: number
    minStockThreshold?: number
    warehouseLocation?: string
  }
}

export type CreateProductInput = {
  categoryId: string
  name: string
  description?: string
  basePrice: number
  imageUrl?: string
  isActive?: boolean
  attributes: ProductAttributeInput[]
  images?: ProductImageInput[]
  variants: ProductVariantInput[]
}

export type UpdateProductInput = {
  categoryId?: string
  name?: string
  description?: string
  basePrice?: number
  imageUrl?: string
  isActive?: boolean
  attributes?: ProductAttributeInput[]
  images?: ProductImageInput[]
}

// Helper type for attribute manipulation
export type AttributeMap = Record<string, string>
