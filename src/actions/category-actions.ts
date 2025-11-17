'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithProducts,
  CategoryWithHierarchy,
} from '@/types/category'

const prisma = new PrismaClient()

/**
 * Get all categories with hierarchy
 */
export async function getCategories(): Promise<CategoryWithHierarchy[]> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    })

    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
}

/**
 * Get all root categories (no parent)
 */
export async function getRootCategories(): Promise<CategoryWithHierarchy[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    })

    return categories
  } catch (error) {
    console.error('Error fetching root categories:', error)
    throw new Error('Failed to fetch root categories')
  }
}

/**
 * Get category by ID with full details
 */
export async function getCategoryById(
  id: string
): Promise<CategoryWithProducts | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            imageUrl: true,
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return category
  } catch (error) {
    console.error('Error fetching category:', error)
    throw new Error('Failed to fetch category')
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithProducts | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            imageUrl: true,
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return category
  } catch (error) {
    console.error('Error fetching category:', error)
    throw new Error('Failed to fetch category')
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryInput) {
  try {
    // Validate slug uniqueness
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    })

    if (existingCategory) {
      throw new Error('A category with this slug already exists')
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        parentId: data.parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    revalidatePath('/categories')
    return { success: true, category }
  } catch (error) {
    console.error('Error creating category:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

/**
 * Update a category
 */
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  try {
    // If slug is being updated, check uniqueness
    if (data.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      })

      if (existingCategory) {
        throw new Error('A category with this slug already exists')
      }
    }

    // Prevent circular hierarchy
    if (data.parentId) {
      const isCircular = await checkCircularHierarchy(id, data.parentId)
      if (isCircular) {
        throw new Error('Cannot set parent: this would create a circular hierarchy')
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
      include: {
        parent: true,
        children: true,
      },
    })

    revalidatePath('/categories')
    revalidatePath(`/categories/${id}`)
    return { success: true, category }
  } catch (error) {
    console.error('Error updating category:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  try {
    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    if (category._count.products > 0) {
      throw new Error('Cannot delete category with existing products')
    }

    if (category._count.children > 0) {
      throw new Error('Cannot delete category with subcategories')
    }

    await prisma.category.delete({
      where: { id },
    })

    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    }
  }
}

/**
 * Get category hierarchy as a tree structure
 */
export async function getCategoryTree() {
  try {
    const allCategories = await prisma.category.findMany({
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Build tree structure from flat list
    const rootCategories = allCategories.filter(cat => !cat.parentId)

    return rootCategories
  } catch (error) {
    console.error('Error fetching category tree:', error)
    throw new Error('Failed to fetch category tree')
  }
}

/**
 * Helper function to check for circular hierarchy
 */
async function checkCircularHierarchy(
  categoryId: string,
  newParentId: string
): Promise<boolean> {
  if (categoryId === newParentId) {
    return true
  }

  let currentId: string | null = newParentId
  const visited = new Set<string>([categoryId])

  while (currentId) {
    if (visited.has(currentId)) {
      return true
    }

    visited.add(currentId)

    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    })

    currentId = parent?.parentId || null
  }

  return false
}

/**
 * Generate slug from category name
 */
export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
