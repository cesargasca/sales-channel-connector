# Documentation Index

This directory contains comprehensive documentation about the Sales Channel Connector codebase. Use this index to navigate to the right information for your needs.

## Documentation Files

### 1. **CODEBASE_OVERVIEW.md** (24 KB) - START HERE
The most comprehensive guide covering:
- Complete database schema with all tables and relationships
- How products, variants, and channels are structured
- All API routes and server actions explained
- Frontend pages and components overview
- Complete services layer documentation
- Type definitions and validation schemas

**Read this first** if you're new to the codebase.

### 2. **ARCHITECTURE_FLOW.md** (26 KB) - VISUAL LEARNER
Detailed flow diagrams showing:
- Product structure hierarchy (Product → Variants → Channels)
- Complete publishing flow (user action → database → background job)
- Inventory synchronization across channels
- Order processing from webhook to database
- Channel adapter pattern and isolation
- Data consistency and transaction handling
- Error handling and retry strategy
- Performance optimization approaches

**Read this** if you prefer visual/diagram-based explanations.

### 3. **VARIANTS_IMPLEMENTATION_GUIDE.md** (7.5 KB) - IMPLEMENTATION READY
Quick reference guide for building the variants feature:
- Current state vs. enhanced state comparison
- Architecture decision rationale
- File reading roadmap (which files to read for specific topics)
- Data model deep dive with examples
- Critical database constraints
- Important notes for variant implementation
- Next steps for enhancement

**Read this** if you're ready to implement product variants features.

### 4. **README.md** (13 KB) - PROJECT SETUP
Original project documentation:
- Feature overview
- Technology stack
- Getting started guide
- Project structure
- Database setup instructions

**Read this** if you need to set up or run the project.

### 5. **architecture-diagrams.md** (23 KB)
System-level architecture diagrams:
- High-level system architecture
- Database schema relationships
- Data flow for key operations
- Component interactions

**Read this** for system-wide understanding.

### 6. **MULTI_CATEGORY_IMPLEMENTATION.md** (15 KB)
Documentation about the category hierarchy feature:
- How product categories are implemented
- Parent-child category relationships
- Category-based filtering

**Read this** if working with product categories.

---

## Quick Navigation by Use Case

### I want to understand the entire system
1. Start with **CODEBASE_OVERVIEW.md** - Sections 1-3 (Database & Architecture)
2. Read **ARCHITECTURE_FLOW.md** - All flow diagrams
3. Reference specific files from **CODEBASE_OVERVIEW.md** - Section 9

### I want to understand how products work
1. Read **CODEBASE_OVERVIEW.md** - Section 1 (Database Schema)
2. Check **ARCHITECTURE_FLOW.md** - Diagram 1 (Product Structure Flow)
3. Reference files from **VARIANTS_IMPLEMENTATION_GUIDE.md** - File Reading Reference

### I want to understand how channels work
1. Read **CODEBASE_OVERVIEW.md** - Section 2 (Channel Implementation)
2. Check **ARCHITECTURE_FLOW.md** - Diagram 5 (Channel Adapter Pattern)
3. Look at `/src/lib/channels/` directory (adapter implementations)

### I want to understand how publishing works
1. Read **ARCHITECTURE_FLOW.md** - Diagram 2 (Publishing Flow)
2. Check **CODEBASE_OVERVIEW.md** - Section 10 (Data Flow Examples)
3. Review `/src/actions/product-actions.ts` - `publishProductToChannels()` function

### I want to understand inventory management
1. Read **ARCHITECTURE_FLOW.md** - Diagram 3 (Inventory Sync Flow)
2. Check **CODEBASE_OVERVIEW.md** - Section 6 (Services & Business Logic)
3. Review `/src/services/inventory-service.ts`

### I want to implement product variants features
1. Start with **VARIANTS_IMPLEMENTATION_GUIDE.md** - Full file
2. Review **ARCHITECTURE_FLOW.md** - Diagram 1 (Product Structure)
3. Check database schema in `/prisma/schema.prisma` (lines 88-125)
4. Use file reading reference from **VARIANTS_IMPLEMENTATION_GUIDE.md**

### I want to understand the UI/Frontend
1. Read **CODEBASE_OVERVIEW.md** - Section 5 (UI Components & Pages)
2. Check **ARCHITECTURE_FLOW.md** - Diagram 7 (Component Hierarchy)
3. Visit `/src/app/(dashboard)/` and `/src/components/` directories

### I want to add a new channel
1. Read **CODEBASE_OVERVIEW.md** - Section 2 (Channel Implementation)
2. Check **ARCHITECTURE_FLOW.md** - Diagram 5 (Channel Adapter Pattern)
3. Copy `/src/lib/channels/shopify-adapter.ts` as a template
4. Implement the `BaseChannelAdapter` interface

### I want to understand data consistency
1. Read **ARCHITECTURE_FLOW.md** - Diagram 6 (Data Consistency & Transactions)
2. Check **CODEBASE_OVERVIEW.md** - Section 10 (Data Flow Examples)
3. Review Prisma `$transaction()` usage in services

---

## Key File Locations

### Database
- Schema: `/prisma/schema.prisma`
- Seed data: `/prisma/seed.ts`

### API & Backend
- Server Actions: `/src/actions/`
  - Product operations: `product-actions.ts`
  - Channel operations: `channel-actions.ts`
  - Inventory operations: `inventory-actions.ts`
  - Order operations: `order-actions.ts`
- REST Routes: `/src/app/api/`
  - Products: `/api/products`
  - Inventory: `/api/inventory`
  - Sync queue: `/api/sync`
  - Webhooks: `/api/webhooks/[channel]`
- Services: `/src/services/`
  - `channel-sync-service.ts` - Background sync jobs
  - `inventory-service.ts` - Stock management
  - `order-service.ts` - Order processing

### Channels
- Base adapter: `/src/lib/channels/base-adapter.ts`
- Factory: `/src/lib/channels/adapter-factory.ts`
- Implementations:
  - `/src/lib/channels/shopify-adapter.ts`
  - `/src/lib/channels/mercadolibre-adapter.ts`
  - `/src/lib/channels/amazon-adapter.ts`
  - `/src/lib/channels/shein-adapter.ts`

### Frontend
- Product pages: `/src/app/(dashboard)/products/`
  - List: `page.tsx`
  - Detail: `[id]/page.tsx`
  - Edit: `[id]/edit/product-edit-form.tsx`
- Channel pages: `/src/app/(dashboard)/channels/page.tsx`
- Components: `/src/components/`
  - Publish dialog: `/src/components/products/publish-to-channels.tsx`
  - UI components: `/src/components/ui/`

### Types & Validation
- Product types: `/src/types/product.ts`
- Category types: `/src/types/category.ts`
- Index types: `/src/types/index.ts`
- Validations: `/src/lib/validations.ts`
- Helpers: `/src/lib/product-helpers.ts`

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│        FRONTEND (React + Next.js 14)        │
│  Pages, Components, Client-side Logic       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│   SERVER ACTIONS & API ROUTES               │
│  Type-safe mutations and REST endpoints     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       SERVICES (Business Logic)             │
│  ChannelSyncService, InventoryService       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    CHANNEL ADAPTERS (Factory Pattern)       │
│  Shopify, Amazon, Mercado Libre, Shein      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      PRISMA ORM (Data Access)               │
│      PostgreSQL Database                    │
└─────────────────────────────────────────────┘
```

---

## Key Concepts

### Product Hierarchy
```
Product
├── Category (parent-child relationships)
├── ProductAttribute[] (product-level metadata)
├── ProductImage[] (multiple images per product)
└── ProductVariant[] (size, color, storage combinations)
    ├── VariantAttribute[] (flexible attributes)
    ├── Inventory (stock tracking)
    └── ChannelListing[] (per-variant per-channel publishing)
```

### Variant Publishing
- **Per-Variant**: Each variant can be published independently
- **Per-Channel**: Each variant can have different pricing on different channels
- **Async**: Uses SyncQueue for reliable background processing
- **Adapters**: Channel-specific logic isolated in adapters

### Inventory Management
```
quantityAvailable  = stock ready to sell
+ quantityReserved = locked by orders
+ quantitySold     = fulfilled sales
= Total stock (audit trail)
```

### Channel Synchronization
1. User action → Database update + SyncQueue job
2. Background worker processes SyncQueue
3. Calls appropriate channel adapter
4. Handles failures with retry logic
5. Updates database with results

---

## Common Tasks

### Add a new product variant
See: `/src/actions/product-actions.ts` → `createVariant()`

### Publish variant to channel
See: `/src/actions/product-actions.ts` → `publishProductToChannels()`

### Update inventory across channels
See: `/src/services/inventory-service.ts` → `adjustStock()`

### Add a new sales channel
1. Create adapter: `/src/lib/channels/[channel]-adapter.ts`
2. Implement `BaseChannelAdapter` interface
3. Register in factory: `/src/lib/channels/adapter-factory.ts`
4. Add to database via UI or seed

### Sync inventory to channels
See: `/src/services/channel-sync-service.ts` → `syncStockToAllChannels()`

---

## Debugging Tips

### Check sync queue status
```bash
curl http://localhost:3000/api/sync -X GET
```

### Process pending sync jobs
```bash
curl http://localhost:3000/api/sync -X POST -d '{"limit": 10}'
```

### View all variants for product
```sql
SELECT v.*, i.*, ca.key, ca.value 
FROM product_variants v
LEFT JOIN inventory i ON i.variant_id = v.id
LEFT JOIN variant_attributes ca ON ca.variant_id = v.id
WHERE v.product_id = 'product_id';
```

### Check channel listings
```sql
SELECT cl.*, s.name, pv.sku
FROM channel_listings cl
JOIN sales_channels s ON s.id = cl.channel_id
JOIN product_variants pv ON pv.id = cl.variant_id
WHERE pv.product_id = 'product_id';
```

---

## Further Reading

- Next.js 14 App Router: https://nextjs.org/docs
- Prisma ORM: https://www.prisma.io/docs
- TypeScript: https://www.typescriptlang.org/docs
- Zod Validation: https://zod.dev
- shadcn/ui Components: https://ui.shadcn.com

---

## Contributing

When adding new features:
1. Update database schema in `/prisma/schema.prisma`
2. Create corresponding types in `/src/types/`
3. Add validation schemas in `/src/lib/validations.ts`
4. Implement server actions or API routes
5. Update UI components
6. Update relevant documentation

---

**Last Updated**: November 17, 2025
**Documentation Version**: 1.0

For questions or clarifications, refer to the specific documentation file or examine the source code directly.
