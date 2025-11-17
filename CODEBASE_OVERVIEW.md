# Sales Channel Connector - Comprehensive Codebase Overview

## Executive Summary
This is a **Next.js 14+ full-stack inventory management system** for managing shoe products across multiple e-commerce channels (Shopify, Mercado Libre, Amazon, SHEIN). The architecture supports:
- Multi-variant products with flexible attributes
- Per-variant channel publishing with independent pricing
- Real-time inventory synchronization
- Comprehensive audit logging
- Reliable job queue for channel syncing

---

## 1. DATABASE SCHEMA & PRODUCT STRUCTURE

### Core Product Hierarchy
```
Product
├── Category (parent-child relationships supported)
├── ProductAttribute[] (key-value pairs for product-level metadata)
├── ProductImage[] (multiple images with primary flag)
└── ProductVariant[]
    ├── VariantAttribute[] (flexible attributes: size, color, storage, etc.)
    ├── Inventory (stock tracking: available, reserved, sold)
    ├── ChannelListing[] (per-variant publication to channels)
    └── OrderItem[]
```

### Database Tables

**Products Table** (`products`)
- `id`: UUID (Primary Key)
- `categoryId`: UUID (Foreign Key)
- `name`: String (product name)
- `modelName`: String (legacy field for backward compatibility)
- `description`: String (optional)
- `basePrice`: Decimal(10, 2) (default price for variants)
- `imageUrl`: String (legacy, use ProductImage instead)
- `isActive`: Boolean
- `createdAt`, `updatedAt`: DateTime

**ProductVariant Table** (`product_variants`)
- `id`: UUID (Primary Key)
- `productId`: UUID (Foreign Key)
- `sku`: String (UNIQUE - Stock Keeping Unit)
- `barcode`: String (optional, UNIQUE)
- `size`: String (legacy field)
- `color`: String (legacy field)
- `createdAt`, `updatedAt`: DateTime

**VariantAttribute Table** (`variant_attributes`)
- `id`: UUID
- `variantId`: UUID (Foreign Key)
- `key`: String (e.g., "size", "color", "storage")
- `value`: String (e.g., "10", "Red", "256GB")
- **Unique Constraint**: (variantId, key) - one value per attribute per variant

**Inventory Table** (`inventory`)
- `variantId`: UUID (UNIQUE, 1:1 relationship with ProductVariant)
- `quantityAvailable`: Int (current stock)
- `quantityReserved`: Int (locked for pending orders)
- `quantitySold`: Int (cumulative sales)
- `minStockThreshold`: Int (alert threshold, default 5)
- `warehouseLocation`: String (optional location code)
- `lastRestockedAt`: DateTime

**ChannelListing Table** (`channel_listings`)
- `id`: UUID
- `variantId`: UUID (Foreign Key)
- `channelId`: UUID (Foreign Key)
- `externalId`: String (channel-specific product ID)
- `channelSku`: String (optional, channel-specific SKU)
- `price`: Decimal(10, 2) (per-variant, per-channel pricing)
- `isActive`: Boolean
- `lastSyncedAt`: DateTime
- **Unique Constraint**: (variantId, channelId) - one listing per variant per channel

### Key Relationships
```sql
-- A Product can have many Variants
Product.id → ProductVariant.productId (1:N)

-- A Variant can be listed on multiple Channels
ProductVariant.id → ChannelListing.variantId (1:N)
SalesChannel.id → ChannelListing.channelId (1:N)

-- Each Variant has one Inventory
ProductVariant.id → Inventory.variantId (1:1)

-- Flexible Attributes (supports any attribute type)
ProductVariant.id → VariantAttribute.variantId (1:N)
```

---

## 2. CHANNEL IMPLEMENTATION

### Sales Channels Model
```
SalesChannel
├── name: String (UNIQUE, 'shopify', 'mercadolibre', 'amazon', 'shein')
├── displayName: String
├── isActive: Boolean
├── apiCredentials: JSON (encrypted)
├── config: JSON (channel-specific settings)
├── ChannelListing[] (variants published to this channel)
└── Order[] (orders received from this channel)
```

### Channel Adapter Pattern
Located in `/src/lib/channels/`:

**BaseChannelAdapter** (Abstract Base Class)
```typescript
abstract class BaseChannelAdapter {
  abstract authenticate(): Promise<boolean>
  abstract updateStock(externalId: string, quantity: number): Promise<void>
  abstract updatePrice(externalId: string, price: number): Promise<void>
  abstract createListing(product: any): Promise<string>  // Returns externalId
  abstract deleteListing(externalId: string): Promise<void>
  abstract fetchOrders(since: Date): Promise<any[]>
  abstract handleWebhook(payload: any): Promise<void>
  async testConnection(): Promise<boolean>
}
```

**Implemented Adapters**
- `ShopifyAdapter` (149 lines)
- `MercadoLibreAdapter` (119 lines)
- `AmazonAdapter` (86 lines)
- `SheinAdapter` (51 lines)

**Adapter Factory** (`adapter-factory.ts`)
```typescript
getChannelAdapter(channelName: string, credentials?: any): BaseChannelAdapter
// Returns appropriate adapter based on channel name
// Supported: 'shopify', 'mercadolibre', 'amazon', 'shein'
```

### Publishing Flow
1. User selects channels from product detail page
2. `publishProductToChannels()` server action called
3. For each variant + channel combination:
   - Create `ChannelListing` record with base price
   - Queue sync job in `SyncQueue`
4. Background worker processes queue:
   - Calls adapter's `createListing(payload)` method
   - Updates `ChannelListing.externalId` with response
   - Moves `SyncQueue` entry to COMPLETED

---

## 3. OVERALL ARCHITECTURE

### Layer Structure
```
┌─────────────────────────────────────────────┐
│          Frontend (React + Next.js)         │
│  Pages, Components, Client-side Logic       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    API Routes & Server Actions (RSC)        │
│  /api/*, src/actions/*                      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Business Logic Layer                │
│  Services: Inventory, Channel Sync, Orders  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Integration Layer                   │
│  Channel Adapters (Factory Pattern)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    Data Layer (Prisma ORM)                  │
│    PostgreSQL Database                      │
└─────────────────────────────────────────────┘
```

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma 5.7.1
- **Database**: PostgreSQL
- **UI Components**: shadcn/ui (Radix UI based)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **State Management**: React Hooks, TanStack Query
- **Icons**: Lucide React

### Key Architectural Patterns
- **Server Actions**: Type-safe server mutations (no API routes for simple CRUD)
- **Factory Pattern**: Channel adapters instantiated via factory function
- **Adapter Pattern**: Consistent interface for different channels
- **Service Layer**: Business logic separated from routes/actions
- **Sync Queue**: Reliable job processing with retry logic
- **Transactions**: Prisma transactions for data consistency

---

## 4. API ROUTES & SERVER ACTIONS

### API Routes (Traditional REST endpoints)
Location: `/src/app/api/`

#### `GET/POST /api/products`
- **GET**: Fetch all products
- **POST**: Not implemented (use Server Actions)

#### `GET/POST /api/inventory`
- Inventory operations

#### `POST /api/sync`
- Process sync queue jobs
- **Body**: `{ limit?: number }`
- **Response**: 
  ```json
  {
    "success": true,
    "processed": 10,
    "results": [...]
  }
  ```
- **GET /api/sync**: Get sync queue status

#### `POST /api/webhooks/[channel]`
- Receive webhooks from sales channels
- Channel-specific handling via adapters

### Server Actions (Type-safe mutations)
Location: `/src/actions/`

#### Product Actions (`product-actions.ts`)
```typescript
getProducts()                              // Fetch all with relations
getProduct(id: string)                     // Single product with full details
getProductsByCategory(categoryId: string)  // Filter by category
createProduct(data: CreateProductInput)    // Create with variants/images
updateProduct(id: string, data: UpdateProductInput)
deleteProduct(id: string)

// Variant Management
createVariant(data: unknown)               // Add variant to product
updateVariant(id: string, data: {...})
deleteVariant(id: string)

// Channel Publishing
publishProductToChannels(productId: string, channelIds: string[])
  // Create listings for ALL variants on selected channels
```

#### Channel Actions (`channel-actions.ts`)
```typescript
createChannel(data: unknown)
updateChannel(id: string, data: unknown)
deleteChannel(id: string)

createChannelListing(data: unknown)        // Publish single variant
updateChannelListing(id: string, data: {...})
deleteChannelListing(id: string)

getChannels()                              // All with _count
getChannel(id: string)                     // With listings

testChannelConnection(id: string)          // Verify API credentials
processSyncQueue()                         // Manually trigger
getSyncQueueStatus()                       // Get queue state
```

#### Inventory Actions (`inventory-actions.ts`)
- Stock adjustments
- Reservation management
- Min stock threshold updates

#### Order Actions (`order-actions.ts`)
- Order creation/updates from webhooks

### Data Flow Example: Publishing Product
```
User selects channels → PublishToChannels component
    ↓
publishProductToChannels(productId, channelIds) [Server Action]
    ↓
For each variant:
  - Create ChannelListing record
  - Queue sync job: SyncQueue { action: 'CREATE_LISTING', payload }
    ↓
Background worker periodically calls:
  - POST /api/sync with limit
  - ChannelSyncService.processSyncQueue(limit)
    ↓
For each pending job:
  - Get adapter via getChannelAdapter()
  - Call adapter.createListing(payload)
  - Update ChannelListing with externalId
  - Mark job as COMPLETED
```

---

## 5. UI COMPONENTS & PAGES

### Product Management Pages
Location: `/src/app/(dashboard)/`

#### `/products` - Product List
- **Component**: `src/app/(dashboard)/products/page.tsx`
- **Features**:
  - Table view of all products
  - Columns: Model Name, Base Price, Variant Count, Total Stock, Status, Actions
  - "Add Product" button
  - Link to product detail

#### `/products/new` - Create Product (placeholder)
- Form for creating product with variants and images

#### `/products/[id]` - Product Detail
- **Component**: `src/app/(dashboard)/products/[id]/page.tsx`
- **Sections**:
  1. **Product Info Card**
     - Name, description, base price
     - Total variants & stock counts
  2. **Product Attributes Card**
     - Display all product-level attributes
  3. **Product Images**
     - Grid view with primary flag badge
  4. **Variants Table**
     - SKU, Attributes (as badges), Barcode, Stock levels
     - Inventory status (In Stock, Low Stock, Out of Stock)
  5. **Channel Listings Table**
     - Shows which variants are published to which channels
     - External IDs, channel SKUs, prices, status

#### `/products/[id]/edit` - Edit Product
- **Component**: `src/app/(dashboard)/products/[id]/edit/product-edit-form.tsx`
- **Features**:
  - Edit product name, description, price
  - Manage attributes (add/remove)
  - Manage images (add/remove, set primary)
  - Display variants (read-only or minimal edit)

#### `/channels` - Sales Channels
- **Component**: `src/app/(dashboard)/channels/page.tsx`
- **Features**:
  - Card-based grid of all channels
  - Display: Name, Active status, Listing count, Order count
  - Last sync timestamp

### Reusable Components
Location: `/src/components/`

#### PublishToChannels Component
- **File**: `src/components/products/publish-to-channels.tsx`
- **Props**:
  ```typescript
  interface PublishToChannelsProps {
    productId: string
    productName: string
    availableChannels: Channel[]
    publishedChannels: PublishedChannel[]
  }
  ```
- **Features**:
  - Dialog with channel selection
  - Shows already-published channels as badges
  - Shows unpublished channels with checkboxes
  - Only publishes if variant exists
  - Uses `publishProductToChannels()` action
  - Shows loading state and success/error messages

#### UI Components (shadcn/ui)
- Button, Input, Label, Select, Textarea
- Dialog, Checkbox
- Card, Badge, Table
- Alert Dialog, Accordion, Tabs
- Toast notifications

---

## 6. SERVICES & BUSINESS LOGIC

### ChannelSyncService (`/src/services/channel-sync-service.ts`)

**Key Methods**:
```typescript
class ChannelSyncService {
  // Sync individual variant to channel
  static updateChannelStock(variantId: string, channelId: string, quantity: number)
  
  // Sync to ALL active channels for variant
  static syncStockToAllChannels(variantId: string)
  
  // Queue a job for async processing
  static queueSync(variantId: string | null, channelId: string, action: SyncAction, payload: any)
  
  // Process pending sync jobs (background worker)
  static processSyncQueue(limit = 10)
    // Handles: UPDATE_STOCK, UPDATE_PRICE, CREATE_LISTING, DELETE_LISTING
  
  // Retry failed jobs
  static retryFailedSyncs()
  
  // Get queue statistics
  static getSyncQueueStatus()
}
```

### InventoryService (`/src/services/inventory-service.ts`)

**Stock Management**:
```typescript
class InventoryService {
  // Reserve stock when order placed
  static reserveStock(variantId: string, quantity: number, orderId: string)
  
  // Confirm sale (reserved → sold)
  static confirmSale(variantId: string, quantity: number, orderId: string)
  
  // Release reservation (order cancelled)
  static releaseReservation(variantId: string, quantity: number, orderId: string)
  
  // Record restock
  static recordRestock(variantId: string, quantity: number, location?: string)
  
  // Adjust inventory (manual correction)
  static adjustStock(variantId: string, quantityChange: number, reason: string)
  
  // Get variants below threshold
  static getLowStockVariants(threshold?: number)
}
```

### OrderService (`/src/services/order-service.ts`)
- Create orders from webhook payloads
- Update order status
- Sync orders back to channels

---

## 7. VALIDATION SCHEMAS (Zod)

Location: `/src/lib/validations.ts`

```typescript
// Product Validation
productSchema = {
  categoryId: UUID,
  name: string (min 1),
  description: string (optional),
  basePrice: positive number,
  imageUrl: valid URL (optional),
  isActive: boolean,
  attributes: AttributeSchema[],
  images: ProductImageSchema[]
}

// Variant Validation
createVariantSchema = {
  productId: UUID,
  sku: string,
  barcode: string (optional),
  attributes: AttributeSchema[],
  inventory: InventorySchema (optional)
}

// Channel Validation
channelSchema = {
  name: string,
  displayName: string,
  isActive: boolean,
  apiCredentials: Record<string, any> (optional),
  config: Record<string, any> (optional)
}

// Channel Listing Validation
channelListingSchema = {
  variantId: UUID,
  channelId: UUID,
  price: positive number,
  isActive: boolean
}

// Attribute Validation
attributeSchema = {
  key: string (min 1),
  value: string (min 1)
}
```

---

## 8. TYPE DEFINITIONS

Location: `/src/types/`

### Product Types (`product.ts`)
```typescript
// Interfaces
Product                           // Base product
ProductWithCategory              // + category info
ProductWithDetails               // Full product with variants, images, attributes
ProductWithVariants              // + all variants
ProductVariant                   // Base variant
ProductVariantWithAttributes     // + attributes
ProductVariantWithInventory      // + inventory data
ProductVariantWithDetails        // + everything

// Input Types
CreateProductInput
UpdateProductInput
ProductVariantInput
VariantAttributeInput
ProductImageInput
```

### Index Types (`index.ts`)
```typescript
ProductWithVariants              // Product + variants + inventory
ProductVariantWithDetails        // Variant + product + inventory + channelListings
ChannelListingWithChannel        // Listing + channel data
OrderWithDetails                 // Order + items + variants + products
DashboardStats                   // Aggregate statistics
SyncQueueItem                    // Queue job info
```

---

## 9. KEY FILE LOCATIONS

```
/home/user/sales-channel-connector/
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Sample data
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                    # Product list
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx               # Product detail
│   │   │   │   │   └── edit/product-edit-form.tsx
│   │   │   │   └── new/                       # Create product
│   │   │   ├── channels/page.tsx              # Channel list
│   │   │   ├── inventory/page.tsx             # Inventory management
│   │   │   ├── orders/page.tsx                # Orders
│   │   │   └── page.tsx                       # Dashboard
│   │   └── api/
│   │       ├── products/route.ts
│   │       ├── inventory/route.ts
│   │       ├── sync/route.ts
│   │       └── webhooks/[channel]/route.ts
│   ├── actions/
│   │   ├── product-actions.ts
│   │   ├── channel-actions.ts
│   │   ├── inventory-actions.ts
│   │   └── order-actions.ts
│   ├── services/
│   │   ├── channel-sync-service.ts
│   │   ├── inventory-service.ts
│   │   └── order-service.ts
│   ├── lib/
│   │   ├── channels/
│   │   │   ├── base-adapter.ts
│   │   │   ├── adapter-factory.ts
│   │   │   ├── shopify-adapter.ts
│   │   │   ├── mercadolibre-adapter.ts
│   │   │   ├── amazon-adapter.ts
│   │   │   └── shein-adapter.ts
│   │   ├── prisma.ts
│   │   ├── validations.ts
│   │   ├── product-helpers.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── products/
│   │   │   └── publish-to-channels.tsx
│   │   └── ui/
│   └── types/
│       ├── product.ts
│       ├── category.ts
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── docker-compose.yml
```

---

## 10. DATA FLOW EXAMPLES

### Publishing a Product to Channels
```
1. User navigates to /products/[id]
2. Clicks "Publish to Channels" button
3. PublishToChannels dialog opens
4. User selects channels (e.g., Shopify, Amazon)
5. User clicks "Publish"

6. publishProductToChannels(productId, ["shopify-id", "amazon-id"])
   └─ Server Action calls:
      ├─ Get product with all variants
      ├─ Get selected channels
      └─ For each variant:
         ├─ Check if listing exists (skip if yes)
         ├─ Create ChannelListing record
         └─ Queue sync job:
            {
              variantId,
              channelId,
              action: 'CREATE_LISTING',
              payload: { product, variant, listingId }
            }

7. Background worker (triggered by POST /api/sync or cron job):
   ├─ Fetch pending sync jobs (limit 10)
   ├─ For each job:
   │  ├─ Update status to PROCESSING
   │  ├─ Get channel adapter (factory)
   │  ├─ Call adapter.createListing(payload)
   │  ├─ Update ChannelListing.externalId
   │  └─ Update status to COMPLETED
   └─ Return results

8. User sees success message
9. Product/variant appears on external channel
```

### Updating Stock Across Channels
```
1. User adjusts inventory for variant
   └─ InventoryService.adjustStock(variantId, +100, "Restock")
      ├─ Update Inventory table
      └─ Create InventoryTransaction log

2. System calls:
   └─ ChannelSyncService.syncStockToAllChannels(variantId)
      ├─ Get variant's Inventory
      ├─ Find all ChannelListings for variant (isActive=true)
      └─ Queue UPDATE_STOCK job for each channel:
         {
           variantId,
           channelId,
           action: 'UPDATE_STOCK',
           payload: { externalId, quantity: 100 }
         }

3. Background worker processes jobs:
   └─ For each UPDATE_STOCK job:
      ├─ Get adapter for channel
      ├─ Call adapter.updateStock(externalId, 100)
      └─ Update lastSyncedAt on ChannelListing
```

### Receiving Order from Channel
```
1. External channel sends webhook to /api/webhooks/[channel]
   ├─ POST /api/webhooks/shopify with order payload

2. Webhook handler:
   ├─ Verify webhook signature (idempotency)
   ├─ Get adapter: getChannelAdapter('shopify', credentials)
   ├─ Call adapter.handleWebhook(payload)
   │  └─ Adapter parses order and returns normalized data
   ├─ Create Order record
   ├─ Create OrderItem records for each line item
   └─ For each OrderItem:
      ├─ InventoryService.reserveStock(variantId, quantity, orderId)
      │  └─ Decrement quantityAvailable
      │  └─ Increment quantityReserved
      │  └─ Log InventoryTransaction
      └─ Queue UPDATE_STOCK sync to all channels

3. Order stored in database
4. Inventory reflected across all channels automatically
```

---

## 11. PRODUCT VARIANTS IMPLEMENTATION CONSIDERATIONS

### Current Capabilities
✓ Flexible attributes (not just size/color)  
✓ Per-variant pricing on different channels  
✓ Per-variant inventory tracking  
✓ Per-variant channel listing status  
✓ Multiple images at product level  

### For Implementing Product Variants UI Enhancement
**Recommended Approach**:
1. Create new component: `VariantManager` component for bulk variant creation
2. Add variant selection UI to publish dialog for fine-grained control
3. Add variant-level publishing (not just product-level)
4. Add variant-level pricing override on channel listings
5. Create variant inventory matrix view
6. Add variant comparison table

**Database already supports**:
- Creating multiple variants per product
- Different prices per variant per channel
- Different attributes per variant
- Publishing only specific variants to specific channels

**Code locations to extend**:
- `/src/components/products/` - Add variant management UI
- `/src/app/(dashboard)/products/[id]/` - Add variant detail pages
- `/src/actions/product-actions.ts` - Already has `createVariant()`, `updateVariant()`
- `/src/lib/validations.ts` - Already has variant schemas

---

## Summary

This codebase has a **well-architected multi-channel system** with:
- Flexible product/variant/attribute structure
- Factory-based channel adapter pattern
- Reliable sync queue for background jobs
- Complete audit trail for inventory
- Server-side type safety with TypeScript + Zod
- Responsive React UI with shadcn/ui

**The foundation for product variants is already in place** - the database and business logic support per-variant channel publishing. The UI layer can be enhanced with more sophisticated variant management and selection flows.

