'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { productSchema, variantSchema, createVariantSchema } from '@/lib/validations'
import { generateSKU } from '@/lib/utils'

export async function createProduct(data: unknown) {
  try {
    const validated = productSchema.parse(data)

    const product = await prisma.product.create({
      data: validated,
    })

    revalidatePath('/products')
    return { success: true, product }
  } catch (error) {
    console.error('Create product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product'
    }
  }
}

export async function updateProduct(id: string, data: unknown) {
  try {
    const validated = productSchema.parse(data)

    const product = await prisma.product.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, product }
  } catch (error) {
    console.error('Update product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product'
    }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    console.error('Delete product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product'
    }
  }
}

export async function createVariant(data: unknown) {
  try {
    const validated = createVariantSchema.parse(data)

    // Get product to generate SKU
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Generate SKU
    const sku = generateSKU(product.modelName, validated.size, validated.color)

    const variant = await prisma.productVariant.create({
      data: {
        ...validated,
        sku,
      },
    })

    // Create inventory record
    await prisma.inventory.create({
      data: {
        variantId: variant.id,
        quantityAvailable: 0,
        quantityReserved: 0,
        quantitySold: 0,
      },
    })

    revalidatePath(`/products/${validated.productId}`)
    return { success: true, variant }
  } catch (error) {
    console.error('Create variant error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variant'
    }
  }
}

export async function deleteVariant(id: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
    })

    if (!variant) {
      throw new Error('Variant not found')
    }

    await prisma.productVariant.delete({
      where: { id },
    })

    revalidatePath(`/products/${variant.productId}`)
    return { success: true }
  } catch (error) {
    console.error('Delete variant error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete variant'
    }
  }
}

export async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return products
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          inventory: true,
          channelListings: {
            include: {
              channel: true,
            },
          },
        },
      },
    },
  })

  return product
}
