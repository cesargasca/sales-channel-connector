import { Decimal } from '@prisma/client/runtime/library'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
  parentId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CategoryWithChildren extends Category {
  children: Category[]
}

export interface CategoryWithParent extends Category {
  parent?: Category | null
}

export interface CategoryWithHierarchy extends Category {
  parent?: Category | null
  children: Category[]
}

export interface CategoryWithProducts extends CategoryWithHierarchy {
  products: {
    id: string
    name: string
    basePrice: Decimal
    imageUrl?: string | null
  }[]
  _count: {
    products: number
  }
}

export type CategoryFormData = {
  name: string
  slug: string
  description?: string
  imageUrl?: string
  isActive: boolean
  parentId?: string | null
}

export type CreateCategoryInput = CategoryFormData
export type UpdateCategoryInput = Partial<CategoryFormData>
