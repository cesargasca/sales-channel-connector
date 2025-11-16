# Multi-Channel Shoe Inventory Management System

A full-stack inventory management application for shoes using Next.js 14+ (App Router), Prisma, and PostgreSQL that synchronizes stock across multiple e-commerce channels.

## Features

- **Product Management**: Create and manage shoe models with multiple variants (size + color combinations)
- **Inventory Tracking**: Real-time stock tracking with available, reserved, and sold quantities
- **Multi-Channel Sync**: Synchronize inventory across Shopify, Mercado Libre, Amazon, and SHEIN
- **Order Management**: Process orders from all channels with automatic inventory reservation
- **Transaction Logging**: Complete audit trail of all inventory changes
- **Low Stock Alerts**: Automatic alerts when stock falls below threshold
- **Sync Queue**: Reliable background job system for channel synchronization
- **Webhook Support**: Receive and process webhooks from sales channels

## Technology Stack

### Core
- **Next.js 14+** with App Router and Server Actions
- **TypeScript** (strict mode)
- **Prisma** as ORM
- **PostgreSQL** database
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Zod** for validation

### Architecture Highlights
- Server Actions for type-safe mutations
- Prisma transactions for data integrity
- Extensible channel adapter pattern
- Background sync queue for reliability
- Webhook idempotency handling

## Project Structure

```
shoe-inventory/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── products/      # Product management
│   │   │   ├── inventory/     # Inventory management
│   │   │   ├── channels/      # Channel configuration
│   │   │   └── orders/        # Order management
│   │   └── api/
│   │       ├── webhooks/      # Webhook receivers
│   │       └── sync/          # Sync queue processing
│   ├── actions/               # Server Actions
│   │   ├── product-actions.ts
│   │   ├── inventory-actions.ts
│   │   ├── order-actions.ts
│   │   └── channel-actions.ts
│   ├── services/              # Business logic
│   │   ├── inventory-service.ts
│   │   ├── channel-sync-service.ts
│   │   └── order-service.ts
│   ├── lib/
│   │   ├── channels/          # Channel adapters
│   │   │   ├── base-adapter.ts
│   │   │   ├── shopify-adapter.ts
│   │   │   ├── mercadolibre-adapter.ts
│   │   │   ├── amazon-adapter.ts
│   │   │   └── shein-adapter.ts
│   │   ├── prisma.ts          # Prisma client
│   │   ├── validations.ts     # Zod schemas
│   │   └── utils.ts           # Utilities
│   └── components/            # React components
│       └── ui/                # shadcn/ui components
├── docker-compose.yml         # PostgreSQL setup
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)

### Quick Setup (Recommended)

Run the automated setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
- Create your `.env` file from `.env.example`
- Install dependencies
- Start PostgreSQL with Docker
- Run database migrations
- Seed the database with sample data

Then start the development server:
```bash
npm run dev
```

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sales-channel-connector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   The default `.env` file is already configured for local development:
   ```
   DATABASE_URL="postgresql://admin:admin123@localhost:5432/shoe_inventory?schema=public"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database** (optional but recommended)
   ```bash
   npm run db:seed
   ```

   This will create:
   - 4 sales channels (Shopify, Mercado Libre, Amazon, SHEIN)
   - 3 sample products (Nike Air Max 90, Adidas Ultraboost 22, New Balance 574)
   - Multiple variants with inventory
   - Sample channel listings
   - 1 sample order

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Management

### Useful Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (dev)
npm run db:push

# Create a migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Database Schema Overview

**Core Models:**
- `Product` - Shoe models (e.g., "Nike Air Max 90")
- `ProductVariant` - Size + color combinations with unique SKUs
- `Inventory` - Stock tracking (available, reserved, sold)
- `SalesChannel` - E-commerce platforms (Shopify, etc.)
- `ChannelListing` - Products listed on each channel
- `Order` - Orders from all channels
- `OrderItem` - Line items in orders
- `InventoryTransaction` - Audit log of all inventory changes
- `SyncQueue` - Background jobs for channel synchronization
- `ProcessedWebhook` - Webhook idempotency tracking

## Core Concepts

### Inventory Management

The system uses a three-state inventory model:

1. **Available**: Stock available for sale
2. **Reserved**: Stock reserved for pending orders
3. **Sold**: Stock from confirmed/shipped orders

**Inventory Workflow:**
1. Order created → Stock moves from `available` to `reserved`
2. Order confirmed → Stock moves from `reserved` to `sold`
3. Order cancelled → Stock returns from `reserved` to `available`
4. Order returned → Stock returns from `sold` to `available`

### Channel Synchronization

The system uses a queue-based sync approach:

1. Inventory changes trigger sync jobs
2. Jobs are queued in `SyncQueue` table
3. Background worker processes jobs
4. Failed jobs are retried (max 5 attempts)
5. Completed jobs are cleaned up after 7 days

**Manual Sync Processing:**
```bash
# Process sync queue via API
curl -X POST http://localhost:3000/api/sync
```

### Channel Adapters

Each sales channel has its own adapter implementing:

- `authenticate()` - Validate API credentials
- `updateStock()` - Update inventory on channel
- `updatePrice()` - Update product price
- `createListing()` - Create new product listing
- `deleteListing()` - Remove product listing
- `fetchOrders()` - Retrieve recent orders
- `handleWebhook()` - Process incoming webhooks

**Adding a New Channel:**

1. Create adapter in `src/lib/channels/new-channel-adapter.ts`
2. Extend `BaseChannelAdapter`
3. Implement required methods
4. Add to factory in `adapter-factory.ts`
5. Create channel record in database

## API Endpoints

### REST APIs

```
GET  /api/products              # Get all products
GET  /api/inventory             # Get inventory levels
POST /api/sync                  # Process sync queue
GET  /api/sync                  # Get sync queue status
POST /api/webhooks/[channel]    # Channel webhook receiver
```

### Server Actions

All data mutations use Next.js Server Actions for type safety:

```typescript
// Product actions
createProduct(data)
updateProduct(id, data)
deleteProduct(id)
createVariant(data)

// Inventory actions
adjustStock(data)
updateMinStockThreshold(data)
syncStockToChannels(variantId)

// Order actions
createOrder(data)
updateOrderStatus(data)
cancelOrder(orderId)

// Channel actions
createChannel(data)
updateChannel(id, data)
testChannelConnection(id)
```

## Production Considerations

### Environment Variables

For production, configure:

```env
DATABASE_URL="your-production-database-url"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Optional: Redis for job queue
REDIS_URL="redis://your-redis-url"

# Optional: Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
```

### Channel Credentials

Store encrypted API credentials in the `SalesChannel.apiCredentials` JSON field:

```typescript
{
  apiKey: "...",
  apiSecret: "...",
  shopDomain: "...",
  accessToken: "..."
}
```

### Background Workers

For production, run sync queue processing as a cron job or background worker:

```typescript
import { ChannelSyncService } from '@/services/channel-sync-service'

// Run every 5 minutes
setInterval(async () => {
  await ChannelSyncService.processSyncQueue(50)
}, 5 * 60 * 1000)
```

### Webhooks

Configure webhooks in each sales channel to point to:
```
https://your-domain.com/api/webhooks/shopify
https://your-domain.com/api/webhooks/mercadolibre
https://your-domain.com/api/webhooks/amazon
https://your-domain.com/api/webhooks/shein
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

### Docker

```bash
# Build image
docker build -t shoe-inventory .

# Run container
docker run -p 3000:3000 --env-file .env shoe-inventory
```

## Development

### Code Structure

- **Server Actions** (`src/actions/`) - All data mutations
- **Services** (`src/services/`) - Business logic
- **Adapters** (`src/lib/channels/`) - Channel integrations
- **Components** (`src/components/`) - Reusable UI components
- **Pages** (`src/app/`) - Next.js App Router pages

### Type Safety

The project uses strict TypeScript mode with Zod for runtime validation:

```typescript
import { z } from 'zod'

const productSchema = z.object({
  modelName: z.string().min(1),
  basePrice: z.number().positive(),
})

// Type inferred from schema
type ProductInput = z.infer<typeof productSchema>
```

### Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Key Features Implementation

### Transaction Safety

All inventory operations use Prisma transactions:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.inventory.update({ ... })
  await tx.inventoryTransaction.create({ ... })
})
```

### Webhook Idempotency

Webhooks are deduplicated using the `ProcessedWebhook` model:

```typescript
const existing = await prisma.processedWebhook.findUnique({
  where: { webhookId }
})
if (existing) return // Already processed
```

### Low Stock Alerts

Query for items below threshold:

```typescript
await prisma.inventory.findMany({
  where: {
    quantityAvailable: {
      lte: prisma.inventory.fields.minStockThreshold
    }
  }
})
```

## Troubleshooting

### Error: Environment variable not found: DATABASE_URL

**Problem:** When running `npm run db:seed` or other Prisma commands, you get:
```
Error: Environment variable not found: DATABASE_URL.
  -->  schema.prisma:7
```

**Solution:** You need to create a `.env` file with your database connection string.

1. **Quick fix:**
   ```bash
   cp .env.example .env
   ```

2. **Or run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Verify the file exists:**
   ```bash
   cat .env
   ```

The `.env` file should contain:
```
DATABASE_URL="postgresql://admin:admin123@localhost:5432/shoe_inventory?schema=public"
```

### Database Connection Failed

**Problem:** Can't connect to PostgreSQL

**Solutions:**
1. Make sure Docker is running
2. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```
3. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

### Prisma Client Not Generated

**Problem:** Import errors for `@prisma/client`

**Solution:**
```bash
npm run db:generate
```

### Migration Errors

**Problem:** Database schema is out of sync

**Solution:**
```bash
# For development (WARNING: may lose data)
npm run db:push

# For production
npm run db:migrate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js 14, Prisma, and PostgreSQL
