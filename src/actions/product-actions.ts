'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { productSchema, createVariantSchema } from '@/lib/validations'
import { generateSKU as generateSKUFromHelper } from '@/lib/product-helpers'
import { CreateProductInput, UpdateProductInput } from '@/types/product'
import { ChannelSyncService } from '@/services/channel-sync-service'
import { SyncAction } from '@prisma/client'

/**
 * Get all products with category and variant information
 */
export async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      attributes: true,
      variants: {
        include: {
          attributes: true,
          inventory: true,
        },
      },
      images: {
        orderBy: {
          position: 'asc',
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return products
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId: string) {
  const products = await prisma.product.findMany({
    where: { categoryId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      attributes: true,
      variants: {
        include: {
          attributes: true,
          inventory: true,
        },
      },
      images: {
        orderBy: {
          position: 'asc',
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return products
}

/**
 * Get a single product with full details
 */
export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      attributes: true,
      variants: {
        include: {
          attributes: true,
          inventory: true,
          channelListings: {
            include: {
              channel: true,
            },
          },
        },
      },
      images: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  })

  return product
}

/**
 * Create a new product with attributes, images, and variants
 */
export async function createProduct(data: CreateProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        modelName: data.name, // Set legacy field for backward compatibility
        description: data.description,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
        // Create product attributes
        attributes: {
          create: data.attributes.map(attr => ({
            key: attr.key,
            value: attr.value,
          })),
        },
        // Create product images
        images: {
          create: data.images?.map(img => ({
            url: img.url,
            altText: img.altText,
            position: img.position,
            isPrimary: img.isPrimary,
          })) || [],
        },
        // Create variants
        variants: {
          create: data.variants.map(variant => ({
            sku: variant.sku,
            barcode: variant.barcode,
            // Set legacy fields if variant has size/color attributes
            size: variant.attributes.find(a => a.key === 'size')?.value,
            color: variant.attributes.find(a => a.key === 'color')?.value,
            // Create variant attributes
            attributes: {
              create: variant.attributes.map(attr => ({
                key: attr.key,
                value: attr.value,
              })),
            },
            // Create inventory if provided
            ...(variant.inventory && {
              inventory: {
                create: {
                  quantityAvailable: variant.inventory.quantityAvailable,
                  quantityReserved: variant.inventory.quantityReserved || 0,
                  quantitySold: variant.inventory.quantitySold || 0,
                  minStockThreshold: variant.inventory.minStockThreshold || 5,
                  warehouseLocation: variant.inventory.warehouseLocation,
                },
              },
            }),
          })),
        },
      },
      include: {
        category: true,
        attributes: true,
        variants: {
          include: {
            attributes: true,
            inventory: true,
          },
        },
        images: true,
      },
    })

    revalidatePath('/products')
    revalidatePath(`/categories/${data.categoryId}`)
    return { success: true, product }
  } catch (error) {
    console.error('Create product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
    }
  }
}

/**
 * Update a product
 */
export async function updateProduct(id: string, data: UpdateProductInput) {
  try {
    // Start a transaction to update product and attributes
    const product = await prisma.$transaction(async (tx) => {
      // Update product basic fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.name && { name: data.name, modelName: data.name }), // Update legacy field too
          ...(data.description !== undefined && { description: data.description }),
          ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      })

      // Update attributes if provided
      if (data.attributes) {
        // Delete existing attributes
        await tx.productAttribute.deleteMany({
          where: { productId: id },
        })

        // Create new attributes
        await tx.productAttribute.createMany({
          data: data.attributes.map(attr => ({
            productId: id,
            key: attr.key,
            value: attr.value,
          })),
        })
      }

      // Update images if provided
      if (data.images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: id },
        })

        // Create new images
        await tx.productImage.createMany({
          data: data.images.map(img => ({
            productId: id,
            url: img.url,
            altText: img.altText,
            position: img.position,
            isPrimary: img.isPrimary,
          })),
        })
      }

      // Fetch and return complete product
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          attributes: true,
          variants: {
            include: {
              attributes: true,
              inventory: true,
            },
          },
          images: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      })
    })

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, product }
  } catch (error) {
    console.error('Update product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product',
    }
  }
}

/**
 * Delete a product (cascades to variants, inventory, etc.)
 */
export async function deleteProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true },
    })

    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/products')
    if (product?.categoryId) {
      revalidatePath(`/categories/${product.categoryId}`)
    }
    return { success: true }
  } catch (error) {
    console.error('Delete product error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
    }
  }
}

/**
 * Create a new variant for an existing product
 */
export async function createVariant(data: unknown) {
  try {
    const validated = createVariantSchema.parse(data)

    // Get product to access name for backward compatibility
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      select: { name: true },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: validated.productId,
        sku: validated.sku,
        barcode: validated.barcode,
        // Set legacy fields if attributes include size/color
        size: validated.attributes.find(a => a.key === 'size')?.value,
        color: validated.attributes.find(a => a.key === 'color')?.value,
        // Create variant attributes
        attributes: {
          create: validated.attributes.map(attr => ({
            key: attr.key,
            value: attr.value,
          })),
        },
        // Create inventory if provided
        ...(validated.inventory && {
          inventory: {
            create: {
              quantityAvailable: validated.inventory.quantityAvailable,
              quantityReserved: validated.inventory.quantityReserved || 0,
              quantitySold: validated.inventory.quantitySold || 0,
              minStockThreshold: validated.inventory.minStockThreshold || 5,
              warehouseLocation: validated.inventory.warehouseLocation,
            },
          },
        }),
      },
      include: {
        attributes: true,
        inventory: true,
      },
    })

    // If no inventory was provided, create a default one
    if (!validated.inventory) {
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          quantityAvailable: 0,
          quantityReserved: 0,
          quantitySold: 0,
          minStockThreshold: 5,
        },
      })
    }

    revalidatePath(`/products/${validated.productId}`)
    return { success: true, variant }
  } catch (error) {
    console.error('Create variant error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variant',
    }
  }
}

/**
 * Update a variant
 */
export async function updateVariant(
  id: string,
  data: {
    sku?: string
    barcode?: string
    attributes?: { key: string; value: string }[]
  }
) {
  try {
    const variant = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.productVariant.update({
        where: { id },
        data: {
          ...(data.sku && { sku: data.sku }),
          ...(data.barcode !== undefined && { barcode: data.barcode }),
          // Update legacy fields if attributes include size/color
          ...(data.attributes && {
            size: data.attributes.find(a => a.key === 'size')?.value,
            color: data.attributes.find(a => a.key === 'color')?.value,
          }),
        },
      })

      // Update attributes if provided
      if (data.attributes) {
        await tx.variantAttribute.deleteMany({
          where: { variantId: id },
        })

        await tx.variantAttribute.createMany({
          data: data.attributes.map(attr => ({
            variantId: id,
            key: attr.key,
            value: attr.value,
          })),
        })
      }

      return tx.productVariant.findUnique({
        where: { id },
        include: {
          attributes: true,
          inventory: true,
        },
      })
    })

    const productVariant = await prisma.productVariant.findUnique({
      where: { id },
      select: { productId: true },
    })

    if (productVariant) {
      revalidatePath(`/products/${productVariant.productId}`)
    }

    return { success: true, variant }
  } catch (error) {
    console.error('Update variant error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update variant',
    }
  }
}

/**
 * Delete a variant
 */
export async function deleteVariant(id: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      select: { productId: true },
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
      error: error instanceof Error ? error.message : 'Failed to delete variant',
    }
  }
}

/**
 * Publish a product to selected channels
 */
export async function publishProductToChannels(
  productId: string,
  channelIds: string[]
) {
  try {
    // Get product with all variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        attributes: true,
        images: {
          orderBy: {
            position: 'asc',
          },
        },
        variants: {
          include: {
            attributes: true,
            inventory: true,
            channelListings: {
              select: {
                channelId: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    if (product.variants.length === 0) {
      throw new Error('Product has no variants to publish')
    }

    // Get channels to verify they exist and are active
    const channels = await prisma.salesChannel.findMany({
      where: {
        id: { in: channelIds },
        isActive: true,
      },
    })

    if (channels.length === 0) {
      throw new Error('No active channels found')
    }

    const results = []

    // Publish each variant to each channel
    for (const variant of product.variants) {
      for (const channel of channels) {
        // Skip if listing already exists
        const existingListing = variant.channelListings.find(
          (listing) => listing.channelId === channel.id
        )

        if (existingListing) {
          results.push({
            variantId: variant.id,
            channelId: channel.id,
            status: 'skipped',
            message: 'Listing already exists',
          })
          continue
        }

        // Create channel listing
        const listing = await prisma.channelListing.create({
          data: {
            variantId: variant.id,
            channelId: channel.id,
            price: product.basePrice,
            isActive: true,
          },
        })

        // Prepare payload for channel adapter
        const payload = {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category.name,
            images: product.images.map((img) => ({
              url: img.url,
              altText: img.altText,
              position: img.position,
            })),
            attributes: product.attributes.reduce((acc, attr) => {
              acc[attr.key] = attr.value
              return acc
            }, {} as Record<string, string>),
          },
          variant: {
            id: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            price: product.basePrice.toString(),
            inventory: variant.inventory?.quantityAvailable || 0,
            attributes: variant.attributes.reduce((acc, attr) => {
              acc[attr.key] = attr.value
              return acc
            }, {} as Record<string, string>),
          },
          listingId: listing.id,
        }

        // Queue sync job
        await ChannelSyncService.queueSync(
          variant.id,
          channel.id,
          SyncAction.CREATE_LISTING,
          payload
        )

        results.push({
          variantId: variant.id,
          channelId: channel.id,
          status: 'queued',
          message: 'Publishing job queued',
        })
      }
    }

    revalidatePath(`/products/${productId}`)
    revalidatePath('/channels')

    return {
      success: true,
      results,
      message: `Queued ${results.filter(r => r.status === 'queued').length} publishing jobs`,
    }
  } catch (error) {
    console.error('Publish product to channels error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to publish product to channels',
    }
  }
}

/**
 * Publish specific variants to specific channels with custom pricing
 */
interface VariantChannelSelection {
  variantId: string
  channelId: string
  price: number
}

export async function publishVariantsToChannels(
  selections: VariantChannelSelection[]
) {
  try {
    if (selections.length === 0) {
      throw new Error('No variants selected for publishing')
    }

    // Get all unique variant IDs
    const variantIds = [...new Set(selections.map((s) => s.variantId))]

    // Get variants with product information
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        attributes: true,
        inventory: true,
        channelListings: {
          select: {
            channelId: true,
          },
        },
        product: {
          include: {
            category: true,
            attributes: true,
            images: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
    })

    if (variants.length === 0) {
      throw new Error('No variants found')
    }

    // Get all unique channel IDs
    const channelIds = [...new Set(selections.map((s) => s.channelId))]

    // Get channels to verify they exist and are active
    const channels = await prisma.salesChannel.findMany({
      where: {
        id: { in: channelIds },
        isActive: true,
      },
    })

    if (channels.length === 0) {
      throw new Error('No active channels found')
    }

    const results = []
    const productIds = new Set<string>()

    // Process each selection
    for (const selection of selections) {
      const variant = variants.find((v) => v.id === selection.variantId)
      const channel = channels.find((c) => c.id === selection.channelId)

      if (!variant || !channel) {
        results.push({
          variantId: selection.variantId,
          channelId: selection.channelId,
          status: 'error',
          message: 'Variant or channel not found',
        })
        continue
      }

      productIds.add(variant.product.id)

      // Check if listing already exists
      const existingListing = variant.channelListings.find(
        (listing) => listing.channelId === channel.id
      )

      if (existingListing) {
        results.push({
          variantId: variant.id,
          channelId: channel.id,
          status: 'skipped',
          message: 'Listing already exists',
        })
        continue
      }

      // Create channel listing with custom price
      const listing = await prisma.channelListing.create({
        data: {
          variantId: variant.id,
          channelId: channel.id,
          price: selection.price,
          isActive: true,
        },
      })

      // Prepare payload for channel adapter
      const payload = {
        product: {
          id: variant.product.id,
          name: variant.product.name,
          description: variant.product.description,
          category: variant.product.category.name,
          images: variant.product.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            position: img.position,
          })),
          attributes: variant.product.attributes.reduce((acc, attr) => {
            acc[attr.key] = attr.value
            return acc
          }, {} as Record<string, string>),
        },
        variant: {
          id: variant.id,
          sku: variant.sku,
          barcode: variant.barcode,
          price: selection.price.toString(),
          inventory: variant.inventory?.quantityAvailable || 0,
          attributes: variant.attributes.reduce((acc, attr) => {
            acc[attr.key] = attr.value
            return acc
          }, {} as Record<string, string>),
        },
        listingId: listing.id,
      }

      // Queue sync job
      await ChannelSyncService.queueSync(
        variant.id,
        channel.id,
        SyncAction.CREATE_LISTING,
        payload
      )

      results.push({
        variantId: variant.id,
        channelId: channel.id,
        status: 'queued',
        message: 'Publishing job queued',
      })
    }

    // Revalidate all affected product pages
    productIds.forEach((productId) => {
      revalidatePath(`/products/${productId}`)
    })
    revalidatePath('/channels')

    const queuedCount = results.filter((r) => r.status === 'queued').length

    return {
      success: true,
      results,
      message: `Queued ${queuedCount} publishing job${queuedCount !== 1 ? 's' : ''}`,
    }
  } catch (error) {
    console.error('Publish variants to channels error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to publish variants to channels',
    }
  }
}
