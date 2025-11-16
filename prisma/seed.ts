import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clean existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Cleaning existing data...')
    await prisma.processedWebhook.deleteMany()
    await prisma.syncQueue.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.inventoryTransaction.deleteMany()
    await prisma.channelListing.deleteMany()
    await prisma.inventory.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.salesChannel.deleteMany()

    // Create Sales Channels
    console.log('📢 Creating sales channels...')

    const shopify = await prisma.salesChannel.create({
        data: {
            name: 'shopify',
            displayName: 'Shopify',
            isActive: true,
            config: {
                storeName: 'my-store',
                apiVersion: '2024-01',
            },
        },
    })

    const mercadolibre = await prisma.salesChannel.create({
        data: {
            name: 'mercadolibre',
            displayName: 'Mercado Libre',
            isActive: true,
            config: {
                siteId: 'MLM', // Mexico
            },
        },
    })

    const amazon = await prisma.salesChannel.create({
        data: {
            name: 'amazon',
            displayName: 'Amazon',
            isActive: true,
            config: {
                marketplace: 'US',
            },
        },
    })

    const shein = await prisma.salesChannel.create({
        data: {
            name: 'shein',
            displayName: 'Shein',
            isActive: false, // Not active yet
        },
    })

    console.log('✅ Created 4 sales channels')

    // Create Products with Variants
    console.log('👟 Creating products and variants...')

    // Product 1: Nike Air Max 90
    const nikeAirMax = await prisma.product.create({
        data: {
            modelName: 'Nike Air Max 90',
            description: 'Classic Nike Air Max sneakers with visible Air cushioning',
            basePrice: new Prisma.Decimal('120.00'),
            imageUrl: 'https://example.com/nike-air-max-90.jpg',
            variants: {
                create: [
                    {
                        size: '8',
                        color: 'White',
                        sku: 'nike-air-max-90-8-white',
                        inventory: {
                            create: {
                                quantityAvailable: 25,
                                quantityReserved: 0,
                                quantitySold: 15,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-101',
                            },
                        },
                    },
                    {
                        size: '8',
                        color: 'Black',
                        sku: 'nike-air-max-90-8-black',
                        inventory: {
                            create: {
                                quantityAvailable: 30,
                                quantityReserved: 2,
                                quantitySold: 20,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-102',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'White',
                        sku: 'nike-air-max-90-9-white',
                        inventory: {
                            create: {
                                quantityAvailable: 20,
                                quantityReserved: 0,
                                quantitySold: 25,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-103',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'Black',
                        sku: 'nike-air-max-90-9-black',
                        inventory: {
                            create: {
                                quantityAvailable: 3,
                                quantityReserved: 0,
                                quantitySold: 35,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-104',
                            },
                        },
                    },
                    {
                        size: '10',
                        color: 'White',
                        sku: 'nike-air-max-90-10-white',
                        inventory: {
                            create: {
                                quantityAvailable: 15,
                                quantityReserved: 1,
                                quantitySold: 18,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-105',
                            },
                        },
                    },
                    {
                        size: '10',
                        color: 'Black',
                        sku: 'nike-air-max-90-10-black',
                        inventory: {
                            create: {
                                quantityAvailable: 2,
                                quantityReserved: 0,
                                quantitySold: 40,
                                minStockThreshold: 5,
                                warehouseLocation: 'A-106',
                            },
                        },
                    },
                ],
            },
        },
        include: {
            variants: {
                include: {
                    inventory: true,
                },
            },
        },
    })

    console.log(`✅ Created Nike Air Max 90 with ${nikeAirMax.variants.length} variants`)

    // Product 2: Adidas Ultraboost
    const adidasUltraboost = await prisma.product.create({
        data: {
            modelName: 'Adidas Ultraboost 22',
            description: 'Responsive running shoes with Boost cushioning technology',
            basePrice: new Prisma.Decimal('180.00'),
            imageUrl: 'https://example.com/adidas-ultraboost.jpg',
            variants: {
                create: [
                    {
                        size: '8',
                        color: 'Core Black',
                        sku: 'adidas-ultraboost-22-8-core-black',
                        inventory: {
                            create: {
                                quantityAvailable: 18,
                                quantityReserved: 0,
                                quantitySold: 12,
                                minStockThreshold: 3,
                                warehouseLocation: 'B-201',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'Core Black',
                        sku: 'adidas-ultraboost-22-9-core-black',
                        inventory: {
                            create: {
                                quantityAvailable: 22,
                                quantityReserved: 3,
                                quantitySold: 18,
                                minStockThreshold: 3,
                                warehouseLocation: 'B-202',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'Cloud White',
                        sku: 'adidas-ultraboost-22-9-cloud-white',
                        inventory: {
                            create: {
                                quantityAvailable: 10,
                                quantityReserved: 0,
                                quantitySold: 22,
                                minStockThreshold: 3,
                                warehouseLocation: 'B-203',
                            },
                        },
                    },
                    {
                        size: '10',
                        color: 'Cloud White',
                        sku: 'adidas-ultraboost-22-10-cloud-white',
                        inventory: {
                            create: {
                                quantityAvailable: 8,
                                quantityReserved: 2,
                                quantitySold: 28,
                                minStockThreshold: 3,
                                warehouseLocation: 'B-204',
                            },
                        },
                    },
                ],
            },
        },
        include: {
            variants: {
                include: {
                    inventory: true,
                },
            },
        },
    })

    console.log(`✅ Created Adidas Ultraboost with ${adidasUltraboost.variants.length} variants`)

    // Product 3: Converse Chuck Taylor
    const converseChuck = await prisma.product.create({
        data: {
            modelName: 'Converse Chuck Taylor All Star',
            description: 'Iconic canvas sneakers with timeless design',
            basePrice: new Prisma.Decimal('65.00'),
            imageUrl: 'https://example.com/converse-chuck.jpg',
            variants: {
                create: [
                    {
                        size: '7',
                        color: 'Black',
                        sku: 'converse-chuck-taylor-7-black',
                        inventory: {
                            create: {
                                quantityAvailable: 50,
                                quantityReserved: 5,
                                quantitySold: 80,
                                minStockThreshold: 10,
                                warehouseLocation: 'C-301',
                            },
                        },
                    },
                    {
                        size: '8',
                        color: 'Black',
                        sku: 'converse-chuck-taylor-8-black',
                        inventory: {
                            create: {
                                quantityAvailable: 45,
                                quantityReserved: 3,
                                quantitySold: 95,
                                minStockThreshold: 10,
                                warehouseLocation: 'C-302',
                            },
                        },
                    },
                    {
                        size: '8',
                        color: 'White',
                        sku: 'converse-chuck-taylor-8-white',
                        inventory: {
                            create: {
                                quantityAvailable: 40,
                                quantityReserved: 0,
                                quantitySold: 85,
                                minStockThreshold: 10,
                                warehouseLocation: 'C-303',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'White',
                        sku: 'converse-chuck-taylor-9-white',
                        inventory: {
                            create: {
                                quantityAvailable: 35,
                                quantityReserved: 2,
                                quantitySold: 100,
                                minStockThreshold: 10,
                                warehouseLocation: 'C-304',
                            },
                        },
                    },
                    {
                        size: '9',
                        color: 'Red',
                        sku: 'converse-chuck-taylor-9-red',
                        inventory: {
                            create: {
                                quantityAvailable: 4,
                                quantityReserved: 0,
                                quantitySold: 45,
                                minStockThreshold: 10,
                                warehouseLocation: 'C-305',
                            },
                        },
                    },
                ],
            },
        },
        include: {
            variants: {
                include: {
                    inventory: true,
                },
            },
        },
    })

    console.log(`✅ Created Converse Chuck Taylor with ${converseChuck.variants.length} variants`)

    // Create Channel Listings
    console.log('🔗 Creating channel listings...')

    // Get all variants
    const allVariants = await prisma.productVariant.findMany({
        include: {
            product: true,
            inventory: true,
        },
    })

    let listingCount = 0

    for (const variant of allVariants) {
        // Calculate price with markup (convert Decimal to number for calculation)
        const basePrice = variant.product.basePrice.toNumber()
        const markup = 1.1 // 10% markup
        const finalPrice = new Prisma.Decimal((basePrice * markup).toFixed(2))

        // List on Shopify
        await prisma.channelListing.create({
            data: {
                variantId: variant.id,
                channelId: shopify.id,
                externalId: `shopify_${variant.sku}`,
                channelSku: variant.sku,
                price: finalPrice,
                isActive: true,
            },
        })

        // List on Mercado Libre (with higher markup)
        const mlPrice = new Prisma.Decimal((basePrice * 1.15).toFixed(2))
        await prisma.channelListing.create({
            data: {
                variantId: variant.id,
                channelId: mercadolibre.id,
                externalId: `ml_${variant.sku}`,
                channelSku: variant.sku,
                price: mlPrice,
                isActive: true,
            },
        })

        // List some on Amazon (only Nike and Adidas)
        if (variant.product.modelName.includes('Nike') || variant.product.modelName.includes('Adidas')) {
            const amzPrice = new Prisma.Decimal((basePrice * 1.12).toFixed(2))
            await prisma.channelListing.create({
                data: {
                    variantId: variant.id,
                    channelId: amazon.id,
                    externalId: `amz_${variant.sku}`,
                    channelSku: variant.sku,
                    price: amzPrice,
                    isActive: true,
                },
            })
            listingCount += 3
        } else {
            listingCount += 2
        }
    }

    console.log(`✅ Created ${listingCount} channel listings`)

    // Create Sample Orders
    console.log('📦 Creating sample orders...')

    // Order 1: From Shopify
    const order1 = await prisma.order.create({
        data: {
            channelId: shopify.id,
            externalOrderId: 'shopify_12345',
            status: 'DELIVERED',
            totalAmount: new Prisma.Decimal('264.00'),
            customerInfo: {
                name: 'John Doe',
                email: 'john@example.com',
                address: '123 Main St, New York, NY 10001',
            },
            items: {
                create: [
                    {
                        variantId: nikeAirMax.variants[0].id,
                        quantity: 2,
                        unitPrice: new Prisma.Decimal('132.00'),
                        subtotal: new Prisma.Decimal('264.00'),
                    },
                ],
            },
        },
    })

    // Order 2: From Mercado Libre
    const order2 = await prisma.order.create({
        data: {
            channelId: mercadolibre.id,
            externalOrderId: 'ml_67890',
            status: 'SHIPPED',
            totalAmount: new Prisma.Decimal('207.00'),
            customerInfo: {
                name: 'María García',
                email: 'maria@example.com',
                address: 'Av. Insurgentes 456, CDMX, Mexico',
            },
            items: {
                create: [
                    {
                        variantId: adidasUltraboost.variants[0].id,
                        quantity: 1,
                        unitPrice: new Prisma.Decimal('207.00'),
                        subtotal: new Prisma.Decimal('207.00'),
                    },
                ],
            },
        },
    })

    // Order 3: From Amazon
    const order3 = await prisma.order.create({
        data: {
            channelId: amazon.id,
            externalOrderId: 'amz_abc123',
            status: 'PENDING',
            totalAmount: new Prisma.Decimal('147.84'),
            customerInfo: {
                name: 'Sarah Johnson',
                email: 'sarah@example.com',
                address: '789 Oak Ave, Los Angeles, CA 90001',
            },
            items: {
                create: [
                    {
                        variantId: nikeAirMax.variants[2].id,
                        quantity: 1,
                        unitPrice: new Prisma.Decimal('147.84'),
                        subtotal: new Prisma.Decimal('147.84'),
                    },
                ],
            },
        },
    })

    console.log(`✅ Created 3 sample orders`)

    // Create Inventory Transactions for the orders
    console.log('📝 Creating inventory transaction history...')

    await prisma.inventoryTransaction.createMany({
        data: [
            {
                variantId: nikeAirMax.variants[0].id,
                transactionType: 'SALE',
                quantityChange: -2,
                referenceType: 'order',
                referenceId: order1.id,
                notes: 'Sold via Shopify',
            },
            {
                variantId: adidasUltraboost.variants[0].id,
                transactionType: 'SALE',
                quantityChange: -1,
                referenceType: 'order',
                referenceId: order2.id,
                notes: 'Sold via Mercado Libre',
            },
            {
                variantId: nikeAirMax.variants[2].id,
                transactionType: 'SALE',
                quantityChange: -1,
                referenceType: 'order',
                referenceId: order3.id,
                notes: 'Sold via Amazon',
            },
            // Some restocking transactions
            {
                variantId: converseChuck.variants[4].id,
                transactionType: 'RESTOCK',
                quantityChange: 20,
                referenceType: 'manual',
                notes: 'Restock from supplier',
            },
            {
                variantId: nikeAirMax.variants[3].id,
                transactionType: 'RESTOCK',
                quantityChange: 15,
                referenceType: 'manual',
                notes: 'Emergency restock - low inventory',
            },
        ],
    })

    console.log('✅ Created inventory transaction history')

    // Summary
    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Products: 3`)
    console.log(`   Variants: ${allVariants.length}`)
    console.log(`   Sales Channels: 4`)
    console.log(`   Channel Listings: ${listingCount}`)
    console.log(`   Orders: 3`)
    console.log(`   Low Stock Items: ${allVariants.filter(v => v.inventory && v.inventory.quantityAvailable < v.inventory.minStockThreshold).length}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error seeding database:', e)
        await prisma.$disconnect()
        process.exit(1)
    })