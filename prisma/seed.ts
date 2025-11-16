import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create channels
  const shopify = await prisma.salesChannel.upsert({
    where: { name: 'shopify' },
    update: {},
    create: {
      name: 'shopify',
      displayName: 'Shopify',
      isActive: true,
    },
  })

  const mercadolibre = await prisma.salesChannel.upsert({
    where: { name: 'mercadolibre' },
    update: {},
    create: {
      name: 'mercadolibre',
      displayName: 'Mercado Libre',
      isActive: true,
    },
  })

  const amazon = await prisma.salesChannel.upsert({
    where: { name: 'amazon' },
    update: {},
    create: {
      name: 'amazon',
      displayName: 'Amazon',
      isActive: true,
    },
  })

  const shein = await prisma.salesChannel.upsert({
    where: { name: 'shein' },
    update: {},
    create: {
      name: 'shein',
      displayName: 'SHEIN',
      isActive: false,
    },
  })

  console.log('Created sales channels')

  // Create sample products with variants and inventory
  const nikeAirMax = await prisma.product.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      modelName: 'Nike Air Max 90',
      description: 'Classic Nike Air Max sneakers with iconic visible Air cushioning',
      basePrice: 120.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=Nike+Air+Max+90',
      variants: {
        create: [
          {
            size: '9',
            color: 'White',
            sku: 'nike-air-max-90-9-white',
            inventory: {
              create: {
                quantityAvailable: 10,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 3,
                warehouseLocation: 'A1-01',
              },
            },
          },
          {
            size: '9',
            color: 'Black',
            sku: 'nike-air-max-90-9-black',
            inventory: {
              create: {
                quantityAvailable: 15,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 3,
                warehouseLocation: 'A1-02',
              },
            },
          },
          {
            size: '10',
            color: 'White',
            sku: 'nike-air-max-90-10-white',
            inventory: {
              create: {
                quantityAvailable: 2,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'A1-03',
              },
            },
          },
          {
            size: '10',
            color: 'Black',
            sku: 'nike-air-max-90-10-black',
            inventory: {
              create: {
                quantityAvailable: 8,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 3,
                warehouseLocation: 'A1-04',
              },
            },
          },
        ],
      },
    },
  })

  const adidasUltraBoost = await prisma.product.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      modelName: 'Adidas Ultraboost 22',
      description: 'Premium running shoes with Boost cushioning technology',
      basePrice: 180.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=Adidas+Ultraboost',
      variants: {
        create: [
          {
            size: '9',
            color: 'Core Black',
            sku: 'adidas-ultraboost-22-9-core-black',
            inventory: {
              create: {
                quantityAvailable: 12,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'B2-01',
              },
            },
          },
          {
            size: '9.5',
            color: 'Cloud White',
            sku: 'adidas-ultraboost-22-9.5-cloud-white',
            inventory: {
              create: {
                quantityAvailable: 7,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'B2-02',
              },
            },
          },
          {
            size: '10',
            color: 'Core Black',
            sku: 'adidas-ultraboost-22-10-core-black',
            inventory: {
              create: {
                quantityAvailable: 1,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'B2-03',
              },
            },
          },
        ],
      },
    },
  })

  const newBalance574 = await prisma.product.upsert({
    where: { id: '3' },
    update: {},
    create: {
      id: '3',
      modelName: 'New Balance 574',
      description: 'Iconic lifestyle sneaker with ENCAP midsole technology',
      basePrice: 85.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=New+Balance+574',
      variants: {
        create: [
          {
            size: '8',
            color: 'Grey',
            sku: 'new-balance-574-8-grey',
            inventory: {
              create: {
                quantityAvailable: 20,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'C3-01',
              },
            },
          },
          {
            size: '9',
            color: 'Navy',
            sku: 'new-balance-574-9-navy',
            inventory: {
              create: {
                quantityAvailable: 18,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'C3-02',
              },
            },
          },
        ],
      },
    },
  })

  console.log('Created products with variants and inventory')

  // Create sample channel listings
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
  })

  for (const variant of variants) {
    // List on Shopify
    await prisma.channelListing.create({
      data: {
        variantId: variant.id,
        channelId: shopify.id,
        externalId: `shopify_${variant.sku}`,
        channelSku: variant.sku,
        price: variant.product.basePrice,
        isActive: true,
      },
    })

    // List on Mercado Libre (only some products)
    if (Math.random() > 0.3) {
      await prisma.channelListing.create({
        data: {
          variantId: variant.id,
          channelId: mercadolibre.id,
          externalId: `ml_${variant.sku}`,
          channelSku: variant.sku,
          price: variant.product.basePrice * 1.1, // 10% markup
          isActive: true,
        },
      })
    }
  }

  console.log('Created channel listings')

  // Create sample orders
  const firstVariant = variants[0]
  const order = await prisma.order.create({
    data: {
      channelId: shopify.id,
      externalOrderId: 'SHOP-12345',
      status: 'CONFIRMED',
      totalAmount: 120.00,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St, City, State 12345',
      },
      items: {
        create: [
          {
            variantId: firstVariant.id,
            quantity: 1,
            unitPrice: 120.00,
            subtotal: 120.00,
          },
        ],
      },
    },
  })

  console.log('Created sample order')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
