import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // ==================== SALES CHANNELS ====================
  console.log('Creating sales channels...')

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

  console.log('✓ Created sales channels')

  // ==================== CATEGORIES ====================
  console.log('Creating categories...')

  // Main categories
  const shoesCategory = await prisma.category.upsert({
    where: { slug: 'shoes' },
    update: {},
    create: {
      name: 'Shoes',
      slug: 'shoes',
      description: 'Footwear for all occasions',
      imageUrl: 'https://via.placeholder.com/400x400?text=Shoes',
      isActive: true,
    },
  })

  const clothingCategory = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion items',
      imageUrl: 'https://via.placeholder.com/400x400?text=Clothing',
      isActive: true,
    },
  })

  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Consumer electronics and gadgets',
      imageUrl: 'https://via.placeholder.com/400x400?text=Electronics',
      isActive: true,
    },
  })

  const booksCategory = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      slug: 'books',
      description: 'Books and publications',
      imageUrl: 'https://via.placeholder.com/400x400?text=Books',
      isActive: true,
    },
  })

  // Subcategories
  const sneakersCategory = await prisma.category.upsert({
    where: { slug: 'sneakers' },
    update: {},
    create: {
      name: 'Sneakers',
      slug: 'sneakers',
      description: 'Athletic and casual sneakers',
      parentId: shoesCategory.id,
      isActive: true,
    },
  })

  const tshirtsCategory = await prisma.category.upsert({
    where: { slug: 't-shirts' },
    update: {},
    create: {
      name: 'T-Shirts',
      slug: 't-shirts',
      description: 'Casual and formal t-shirts',
      parentId: clothingCategory.id,
      isActive: true,
    },
  })

  const smartphonesCategory = await prisma.category.upsert({
    where: { slug: 'smartphones' },
    update: {},
    create: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      parentId: electronicsCategory.id,
      isActive: true,
    },
  })

  const fictionCategory = await prisma.category.upsert({
    where: { slug: 'fiction' },
    update: {},
    create: {
      name: 'Fiction',
      slug: 'fiction',
      description: 'Fiction books and novels',
      parentId: booksCategory.id,
      isActive: true,
    },
  })

  console.log('✓ Created categories and subcategories')

  // ==================== SHOE PRODUCTS ====================
  console.log('Creating shoe products...')

  const nikeAirMax = await prisma.product.create({
    data: {
      categoryId: sneakersCategory.id,
      name: 'Nike Air Max 90',
      modelName: 'Nike Air Max 90', // Legacy field
      description: 'Classic Nike Air Max sneakers with iconic visible Air cushioning',
      basePrice: 120.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=Nike+Air+Max+90',
      isActive: true,
      attributes: {
        create: [
          { key: 'brand', value: 'Nike' },
          { key: 'material', value: 'Leather & Mesh' },
          { key: 'gender', value: 'Unisex' },
          { key: 'type', value: 'Running' },
        ],
      },
      images: {
        create: [
          { url: 'https://via.placeholder.com/400x400?text=Nike+Air+Max+90', altText: 'Nike Air Max 90', position: 0, isPrimary: true },
          { url: 'https://via.placeholder.com/400x400?text=Nike+Air+Max+90+Side', altText: 'Side view', position: 1, isPrimary: false },
        ],
      },
      variants: {
        create: [
          {
            size: '9', // Legacy field
            color: 'White', // Legacy field
            sku: 'nike-air-max-90-9-white',
            attributes: {
              create: [
                { key: 'size', value: '9' },
                { key: 'color', value: 'White' },
              ],
            },
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
            attributes: {
              create: [
                { key: 'size', value: '9' },
                { key: 'color', value: 'Black' },
              ],
            },
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
            attributes: {
              create: [
                { key: 'size', value: '10' },
                { key: 'color', value: 'White' },
              ],
            },
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
            attributes: {
              create: [
                { key: 'size', value: '10' },
                { key: 'color', value: 'Black' },
              ],
            },
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

  console.log('✓ Created Nike Air Max 90')

  // ==================== CLOTHING PRODUCTS ====================
  console.log('Creating clothing products...')

  const premiumTshirt = await prisma.product.create({
    data: {
      categoryId: tshirtsCategory.id,
      name: 'Premium Cotton T-Shirt',
      description: 'Ultra-soft premium cotton t-shirt with modern fit',
      basePrice: 29.99,
      imageUrl: 'https://via.placeholder.com/400x400?text=Premium+T-Shirt',
      isActive: true,
      attributes: {
        create: [
          { key: 'brand', value: 'ComfortWear' },
          { key: 'material', value: '100% Cotton' },
          { key: 'fit', value: 'Regular' },
          { key: 'care_instructions', value: 'Machine wash cold' },
          { key: 'season', value: 'All Season' },
        ],
      },
      images: {
        create: [
          { url: 'https://via.placeholder.com/400x400?text=Premium+T-Shirt', altText: 'Premium T-Shirt', position: 0, isPrimary: true },
        ],
      },
      variants: {
        create: [
          {
            sku: 'tshirt-premium-s-white',
            attributes: {
              create: [
                { key: 'size', value: 'S' },
                { key: 'color', value: 'White' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 25,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'D4-01',
              },
            },
          },
          {
            sku: 'tshirt-premium-m-white',
            attributes: {
              create: [
                { key: 'size', value: 'M' },
                { key: 'color', value: 'White' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 30,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'D4-02',
              },
            },
          },
          {
            sku: 'tshirt-premium-l-black',
            attributes: {
              create: [
                { key: 'size', value: 'L' },
                { key: 'color', value: 'Black' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 20,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'D4-03',
              },
            },
          },
          {
            sku: 'tshirt-premium-xl-navy',
            attributes: {
              create: [
                { key: 'size', value: 'XL' },
                { key: 'color', value: 'Navy' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 15,
                quantityReserved: 0,
                quantitySold: 0,
                minStockThreshold: 5,
                warehouseLocation: 'D4-04',
              },
            },
          },
        ],
      },
    },
  })

  console.log('✓ Created Premium Cotton T-Shirt')

  // ==================== ELECTRONICS PRODUCTS ====================
  console.log('Creating electronics products...')

  const iphone15Pro = await prisma.product.create({
    data: {
      categoryId: smartphonesCategory.id,
      name: 'iPhone 15 Pro',
      description: 'The latest iPhone with A17 Pro chip and advanced camera system',
      basePrice: 999.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
      isActive: true,
      attributes: {
        create: [
          { key: 'brand', value: 'Apple' },
          { key: 'os', value: 'iOS 17' },
          { key: 'processor', value: 'A17 Pro' },
          { key: 'screen_size', value: '6.1 inches' },
          { key: 'camera', value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto' },
          { key: 'battery', value: 'Up to 23 hours video playback' },
        ],
      },
      images: {
        create: [
          { url: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro', altText: 'iPhone 15 Pro', position: 0, isPrimary: true },
          { url: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro+Back', altText: 'Back view', position: 1, isPrimary: false },
        ],
      },
      variants: {
        create: [
          {
            sku: 'iphone-15-pro-128gb-black',
            attributes: {
              create: [
                { key: 'storage', value: '128GB' },
                { key: 'color', value: 'Black Titanium' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 12,
                quantityReserved: 2,
                quantitySold: 5,
                minStockThreshold: 3,
                warehouseLocation: 'E5-01',
              },
            },
          },
          {
            sku: 'iphone-15-pro-256gb-blue',
            attributes: {
              create: [
                { key: 'storage', value: '256GB' },
                { key: 'color', value: 'Blue Titanium' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 8,
                quantityReserved: 1,
                quantitySold: 3,
                minStockThreshold: 3,
                warehouseLocation: 'E5-02',
              },
            },
          },
          {
            sku: 'iphone-15-pro-512gb-natural',
            attributes: {
              create: [
                { key: 'storage', value: '512GB' },
                { key: 'color', value: 'Natural Titanium' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 5,
                quantityReserved: 0,
                quantitySold: 2,
                minStockThreshold: 2,
                warehouseLocation: 'E5-03',
              },
            },
          },
        ],
      },
    },
  })

  const samsungS24Ultra = await prisma.product.create({
    data: {
      categoryId: smartphonesCategory.id,
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android flagship with S Pen and advanced AI features',
      basePrice: 1199.00,
      imageUrl: 'https://via.placeholder.com/400x400?text=Galaxy+S24+Ultra',
      isActive: true,
      attributes: {
        create: [
          { key: 'brand', value: 'Samsung' },
          { key: 'os', value: 'Android 14' },
          { key: 'processor', value: 'Snapdragon 8 Gen 3' },
          { key: 'screen_size', value: '6.8 inches' },
          { key: 'camera', value: '200MP Main + 50MP Telephoto + 12MP Ultra Wide' },
          { key: 'battery', value: '5000 mAh' },
        ],
      },
      images: {
        create: [
          { url: 'https://via.placeholder.com/400x400?text=Galaxy+S24+Ultra', altText: 'Galaxy S24 Ultra', position: 0, isPrimary: true },
        ],
      },
      variants: {
        create: [
          {
            sku: 'samsung-s24-ultra-256gb-gray',
            attributes: {
              create: [
                { key: 'storage', value: '256GB' },
                { key: 'color', value: 'Titanium Gray' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 10,
                quantityReserved: 1,
                quantitySold: 4,
                minStockThreshold: 3,
                warehouseLocation: 'E5-04',
              },
            },
          },
          {
            sku: 'samsung-s24-ultra-512gb-violet',
            attributes: {
              create: [
                { key: 'storage', value: '512GB' },
                { key: 'color', value: 'Titanium Violet' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 7,
                quantityReserved: 0,
                quantitySold: 2,
                minStockThreshold: 3,
                warehouseLocation: 'E5-05',
              },
            },
          },
        ],
      },
    },
  })

  console.log('✓ Created iPhone 15 Pro and Samsung Galaxy S24 Ultra')

  // ==================== BOOK PRODUCTS ====================
  console.log('Creating book products...')

  const harryPotter = await prisma.product.create({
    data: {
      categoryId: fictionCategory.id,
      name: "Harry Potter and the Sorcerer's Stone",
      description: 'The first book in the beloved Harry Potter series',
      basePrice: 14.99,
      imageUrl: 'https://via.placeholder.com/400x400?text=Harry+Potter',
      isActive: true,
      attributes: {
        create: [
          { key: 'author', value: 'J.K. Rowling' },
          { key: 'publisher', value: 'Scholastic' },
          { key: 'isbn', value: '978-0590353427' },
          { key: 'pages', value: '309' },
          { key: 'language', value: 'English' },
          { key: 'publication_year', value: '1998' },
        ],
      },
      images: {
        create: [
          { url: 'https://via.placeholder.com/400x400?text=Harry+Potter', altText: 'Book cover', position: 0, isPrimary: true },
        ],
      },
      variants: {
        create: [
          {
            sku: 'hp-ss-hardcover-new',
            attributes: {
              create: [
                { key: 'format', value: 'Hardcover' },
                { key: 'condition', value: 'New' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 50,
                quantityReserved: 5,
                quantitySold: 20,
                minStockThreshold: 10,
                warehouseLocation: 'F6-01',
              },
            },
          },
          {
            sku: 'hp-ss-paperback-new',
            attributes: {
              create: [
                { key: 'format', value: 'Paperback' },
                { key: 'condition', value: 'New' },
              ],
            },
            inventory: {
              create: {
                quantityAvailable: 75,
                quantityReserved: 10,
                quantitySold: 35,
                minStockThreshold: 15,
                warehouseLocation: 'F6-02',
              },
            },
          },
        ],
      },
    },
  })

  console.log('✓ Created Harry Potter book')

  // ==================== CHANNEL LISTINGS ====================
  console.log('Creating channel listings...')

  const allVariants = await prisma.productVariant.findMany({
    include: { product: true },
  })

  for (const variant of allVariants) {
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

    // List on Mercado Libre (70% of products)
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

    // List on Amazon (50% of products)
    if (Math.random() > 0.5) {
      await prisma.channelListing.create({
        data: {
          variantId: variant.id,
          channelId: amazon.id,
          externalId: `amz_${variant.sku}`,
          channelSku: variant.sku,
          price: variant.product.basePrice * 1.15, // 15% markup
          isActive: true,
        },
      })
    }
  }

  console.log('✓ Created channel listings')

  // ==================== SAMPLE ORDERS ====================
  console.log('Creating sample orders...')

  // Order 1: Nike shoes
  const nikeVariant = allVariants.find(v => v.sku === 'nike-air-max-90-9-white')
  if (nikeVariant) {
    await prisma.order.create({
      data: {
        channelId: shopify.id,
        externalOrderId: 'SHOP-12345',
        status: 'CONFIRMED',
        totalAmount: 120.00,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St, New York, NY 10001',
        },
        items: {
          create: [
            {
              variantId: nikeVariant.id,
              quantity: 1,
              unitPrice: 120.00,
              subtotal: 120.00,
            },
          ],
        },
      },
    })
  }

  // Order 2: iPhone
  const iphoneVariant = allVariants.find(v => v.sku === 'iphone-15-pro-256gb-blue')
  if (iphoneVariant) {
    await prisma.order.create({
      data: {
        channelId: amazon.id,
        externalOrderId: 'AMZ-67890',
        status: 'SHIPPED',
        totalAmount: 1148.85,
        customerInfo: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          address: '456 Oak Ave, Los Angeles, CA 90001',
        },
        items: {
          create: [
            {
              variantId: iphoneVariant.id,
              quantity: 1,
              unitPrice: 1148.85,
              subtotal: 1148.85,
            },
          ],
        },
      },
    })
  }

  // Order 3: Multiple items
  const tshirtVariant = allVariants.find(v => v.sku === 'tshirt-premium-l-black')
  const bookVariant = allVariants.find(v => v.sku === 'hp-ss-paperback-new')
  if (tshirtVariant && bookVariant) {
    await prisma.order.create({
      data: {
        channelId: mercadolibre.id,
        externalOrderId: 'ML-11111',
        status: 'DELIVERED',
        totalAmount: 49.48,
        customerInfo: {
          name: 'Carlos García',
          email: 'carlos@example.com',
          address: 'Av. Libertador 1234, Buenos Aires, Argentina',
        },
        items: {
          create: [
            {
              variantId: tshirtVariant.id,
              quantity: 1,
              unitPrice: 32.99,
              subtotal: 32.99,
            },
            {
              variantId: bookVariant.id,
              quantity: 1,
              unitPrice: 16.49,
              subtotal: 16.49,
            },
          ],
        },
      },
    })
  }

  console.log('✓ Created sample orders')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  - 3 Sales Channels')
  console.log('  - 8 Categories (4 parent + 4 subcategories)')
  console.log('  - 5 Products across multiple categories')
  console.log('  - 17 Product Variants with flexible attributes')
  console.log('  - Multiple Channel Listings')
  console.log('  - 3 Sample Orders')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
