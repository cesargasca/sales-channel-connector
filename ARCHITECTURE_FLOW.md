# Product Variants - Architecture Flow Diagrams

## 1. Product Structure Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCT                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id, name, basePrice, description, categoryId            │  │
│  │ attributes: [{brand: "Nike"}, {model: "Air Max"}]       │  │
│  │ images: [primary.jpg, secondary.jpg, etc]               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│        ┌──────────────────┴──────────────────┐                 │
│        │                                      │                 │
│        ▼                                      ▼                 │
│   VARIANT 1 (Size 8, White)           VARIANT 2 (Size 9, White)
│   ┌─────────────────────────┐       ┌─────────────────────────┐
│   │ id, sku, barcode        │       │ id, sku, barcode        │
│   │ SKU: nike-90-8-white    │       │ SKU: nike-90-9-white    │
│   │ attributes:             │       │ attributes:             │
│   │  - size: 8              │       │  - size: 9              │
│   │  - color: white         │       │  - color: white         │
│   └─────────────────────────┘       └─────────────────────────┘
│        │                                    │
│        ├─────────────┬──────────────────────┤
│        │             │                      │
│        ▼             ▼                      ▼
│    INVENTORY    CHANNEL                CHANNEL
│    ┌────────┐   LISTING 1             LISTING 2
│    │        │   ┌──────────┐          ┌──────────┐
│    │ Qty: 5 │   │Shopify   │          │Amazon    │
│    │        │   │Price:110 │          │Price:105 │
│    │        │   └──────────┘          └──────────┘
│    └────────┘
└─────────────────────────────────────────────────────────────────┘
```

## 2. Publishing Flow - Detailed Steps

```
┌────────────────────────────────────────────────────────────────────────┐
│                      USER ACTION                                        │
│  1. Opens product detail page                                          │
│  2. Clicks "Publish to Channels" button                                │
│  3. Selects channels: Shopify, Amazon                                  │
│  4. Clicks "Publish" → Calls publishProductToChannels()               │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  Server Action: publishProductTo   │
        │  Channels(productId, channelIds)   │
        │                                    │
        │  1. Get product + all variants     │
        │  2. Get active channels            │
        │  3. For each variant:              │
        │     - Check if already listed      │
        │     - Create ChannelListing record │
        │     - Queue sync job               │
        │  4. Return results to UI           │
        └────────────┬───────────────────────┘
                     │
        ┌────────────▼───────────────────────┐
        │  Database Updates:                 │
        │                                    │
        │  ChannelListing {                  │
        │    variantId: "var_123",           │
        │    channelId: "shop_1",            │
        │    price: 110.00,                  │
        │    isActive: true,                 │
        │    externalId: null (pending)      │
        │  }                                 │
        │                                    │
        │  SyncQueue {                       │
        │    variantId: "var_123",           │
        │    channelId: "shop_1",            │
        │    action: "CREATE_LISTING",       │
        │    status: "PENDING",              │
        │    payload: {product, variant}     │
        │  }                                 │
        └────────────┬───────────────────────┘
                     │
        ┌────────────▼────────────────────────┐
        │  Background Worker                 │
        │  (triggered by cron/job queue)     │
        │                                    │
        │  POST /api/sync                    │
        │  ChannelSyncService.processSyncQueue()
        │                                    │
        │  For each PENDING job:             │
        │  1. Update status → PROCESSING     │
        │  2. Get adapter                    │
        │  3. Call adapter.createListing()   │
        │  4. Get externalId from channel    │
        │  5. Update ChannelListing          │
        │  6. Update status → COMPLETED      │
        └────────────┬───────────────────────┘
                     │
        ┌────────────▼───────────────────────┐
        │  Final State:                      │
        │                                    │
        │  ChannelListing {                  │
        │    variantId: "var_123",           │
        │    channelId: "shop_1",            │
        │    externalId: "prod_12345",       │
        │    lastSyncedAt: now()             │
        │  }                                 │
        │                                    │
        │  Product now visible on Shopify!   │
        └────────────────────────────────────┘
```

## 3. Inventory Sync Flow

```
┌────────────────────────────────────────────────┐
│        USER ADJUSTS INVENTORY                  │
│  Variant: nike-90-8-white                      │
│  Adjustment: +100 units                        │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  InventoryService.adjustStock()                │
│                                                │
│  In Transaction:                               │
│  1. Update Inventory                           │
│     quantityAvailable: 50 → 150               │
│  2. Create InventoryTransaction (audit log)    │
│     type: RESTOCK, change: +100               │
│                                                │
│  Then:                                         │
│  3. Call syncStockToAllChannels()              │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  ChannelSyncService.syncStockToAllChannels()   │
│                                                │
│  1. Get Inventory for variant                  │
│  2. Find all active ChannelListings:           │
│     - Shopify: {externalId: prod_123}         │
│     - Amazon: {externalId: ASIN_456}          │
│                                                │
│  3. For each listing, queue sync job:          │
│     ├─ UPDATE_STOCK to Shopify                │
│     │  {externalId: prod_123, qty: 150}       │
│     │                                          │
│     └─ UPDATE_STOCK to Amazon                 │
│        {externalId: ASIN_456, qty: 150}       │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  Background Worker Processes Jobs              │
│                                                │
│  For Shopify job:                              │
│  ├─ Get ShopifyAdapter                        │
│  ├─ Call updateStock(prod_123, 150)           │
│  ├─ ShopifyAdapter makes API call             │
│  └─ Mark job COMPLETED                        │
│                                                │
│  For Amazon job:                               │
│  ├─ Get AmazonAdapter                         │
│  ├─ Call updateStock(ASIN_456, 150)           │
│  ├─ AmazonAdapter makes API call              │
│  └─ Mark job COMPLETED                        │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│         FINAL STATE                            │
│                                                │
│  Database:                                     │
│  ├─ Inventory: quantityAvailable = 150        │
│  ├─ InventoryTransaction: audit trail         │
│  └─ ChannelListing: lastSyncedAt = now()      │
│                                                │
│  External Channels:                            │
│  ├─ Shopify product stock: 150 units          │
│  └─ Amazon product stock: 150 units           │
└────────────────────────────────────────────────┘
```

## 4. Order Flow - Channel to Database

```
┌────────────────────────────────────────────────┐
│  EXTERNAL CHANNEL (e.g., Shopify)              │
│  Customer places order for variant:            │
│  - nike-90-8-white (qty: 2)                   │
│  - nike-90-9-white (qty: 1)                   │
└────────────┬───────────────────────────────────┘
             │
             │ Webhook POST
             ▼
┌────────────────────────────────────────────────┐
│  POST /api/webhooks/shopify                    │
│                                                │
│  Handler:                                      │
│  1. Verify webhook signature                   │
│  2. Check ProcessedWebhook (idempotency)      │
│  3. Get ShopifyAdapter                         │
│  4. Call adapter.handleWebhook(payload)        │
│     → Returns normalized order data            │
│  5. Extract items, customer info               │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  Create Order Record                           │
│                                                │
│  Order {                                       │
│    id: "order_xyz",                            │
│    channelId: "shopify_1",                     │
│    externalOrderId: "shop_ord_123",            │
│    status: "PENDING",                          │
│    totalAmount: 250.00,                        │
│    customerInfo: {...}                         │
│  }                                             │
│                                                │
│  OrderItem {                                   │
│    orderId: "order_xyz",                       │
│    variantId: "var_123" (nike-90-8-white),    │
│    quantity: 2,                                │
│    unitPrice: 110.00                           │
│  }                                             │
│                                                │
│  OrderItem {                                   │
│    orderId: "order_xyz",                       │
│    variantId: "var_124" (nike-90-9-white),    │
│    quantity: 1,                                │
│    unitPrice: 110.00                           │
│  }                                             │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  Reserve Stock for Each Item                   │
│                                                │
│  InventoryService.reserveStock(var_123, 2)   │
│  ├─ Get inventory record                       │
│  ├─ Check availability (5 >= 2) ✓             │
│  ├─ Update inventory:                          │
│  │  quantityAvailable: 5 → 3                  │
│  │  quantityReserved: 2 → 4                   │
│  └─ Log InventoryTransaction                   │
│                                                │
│  InventoryService.reserveStock(var_124, 1)   │
│  ├─ Get inventory record                       │
│  ├─ Check availability (10 >= 1) ✓            │
│  ├─ Update inventory:                          │
│  │  quantityAvailable: 10 → 9                 │
│  │  quantityReserved: 0 → 1                   │
│  └─ Log InventoryTransaction                   │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│  Queue Stock Sync to All Channels              │
│                                                │
│  For var_123:                                  │
│  ├─ SyncQueue job → Shopify UPDATE_STOCK      │
│  ├─ SyncQueue job → Amazon UPDATE_STOCK       │
│  └─ SyncQueue job → MercadoLibre UPDATE_STOCK │
│                                                │
│  For var_124:                                  │
│  ├─ SyncQueue job → Shopify UPDATE_STOCK      │
│  └─ SyncQueue job → Amazon UPDATE_STOCK       │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│         FINAL STATE                            │
│                                                │
│  Inventory (var_123):                          │
│  ├─ quantityAvailable: 3 (was 5)              │
│  ├─ quantityReserved: 4 (was 2)               │
│  └─ Prevents overselling on other channels    │
│                                                │
│  Order stored in database with full           │
│  audit trail and stock is now reserved         │
│  on all other channels automatically           │
└────────────────────────────────────────────────┘
```

## 5. Channel Adapter Pattern - Isolation

```
┌────────────────────────────────────────────────────────────┐
│                   ChannelSyncService                       │
│  (unified interface for all channels)                     │
└────────────┬────────────────────────────────┬──────────────┘
             │                                │
             ├─────────────────┬──────────────┤
             │                 │              │
             ▼                 ▼              ▼
        ┌─────────┐       ┌────────┐    ┌────────┐
        │Shopify  │       │Amazon  │    │Mercado │
        │Adapter  │       │Adapter │    │Libre   │
        │         │       │        │    │Adapter │
        │createLis│       │createLi│    │createLi│
        │ting()   │       │sting()  │    │sting()  │
        │         │       │        │    │        │
        │API Key: │       │API Key:│    │API Key:│
        │abc123   │       │xyz789  │    │pqr456  │
        └────┬────┘       └───┬────┘    └───┬────┘
             │                │            │
             │ HTTP API calls │            │
             │                │            │
             ▼                ▼            ▼
        Shopify API       Amazon API   Mercado Libre API
        /products         /items       /items
        /inventory        /prices      /quantities
```

## 6. Data Consistency & Transactions

```
┌──────────────────────────────────────────────────┐
│  Problem: Race Conditions & Data Loss            │
└──────────────┬───────────────────────────────────┘
               │
        ┌──────▼──────┐
        │ Solution:   │
        │ Prisma      │
        │Transaction  │
        │ (Atomic)    │
        └──────┬──────┘
               │
        ┌──────▼──────────────────────────────────┐
        │  $transaction(async (tx) => {           │
        │    1. Check inventory                   │
        │    2. Update available qty              │
        │    3. Increment reserved qty            │
        │    4. Log transaction                   │
        │    5. Commit all or rollback all        │
        │  })                                     │
        └──────┬──────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────┐
        │  Benefits:                              │
        │  ✓ Prevents overselling                 │
        │  ✓ All-or-nothing updates               │
        │  ✓ No orphaned records                  │
        │  ✓ Consistent state guaranteed          │
        └──────────────────────────────────────────┘
```

## 7. Component Hierarchy (Frontend)

```
ProductPage ([id]/page.tsx)
│
├── ProductInfo Card
│   └─ Name, description, price
│
├── ProductAttributes Card
│   └─ Key-value pairs
│
├── ProductImages
│   └─ Grid with primary flag
│
├── VariantsTable
│   └─ SKU, Attributes, Inventory, Status
│
├── ChannelListingsTable
│   └─ Variant → Channel mappings
│
└── PublishToChannels Dialog
    ├─ Show already-published channels
    ├─ Select new channels to publish
    └─ Call publishProductToChannels()
       └─ Server Action
          └─ Database updates
             └─ SyncQueue jobs
```

## 8. Performance Considerations

```
┌────────────────────────────────────────────┐
│  Query Optimization                        │
├────────────────────────────────────────────┤
│                                            │
│  Problem: N+1 queries                      │
│  Product page loads:                       │
│  - Product (1 query)                       │
│  - Variants (N queries)                    │
│  - Inventory for each (N queries)          │
│  - ChannelListings for each (N queries)    │
│  Total: 3N+1 queries!                      │
│                                            │
│  Solution: Eager Loading with Prisma       │
│  include: {                                │
│    variants: {                             │
│      include: {                            │
│        attributes: true,                   │
│        inventory: true,                    │
│        channelListings: {                  │
│          include: {                        │
│            channel: true                   │
│          }                                 │
│        }                                   │
│      }                                     │
│    }                                       │
│  }                                         │
│  Total: 1 query with all relations!        │
│                                            │
├────────────────────────────────────────────┤
│  Indexing Strategy                         │
├────────────────────────────────────────────┤
│                                            │
│  Key Indexes:                              │
│  - product_variants(sku) → UNIQUE          │
│  - channel_listings(variant_id, channel_id)│
│  - inventory(variant_id) → 1:1 relation    │
│  - variant_attributes(variant_id, key)     │
│  - product_variants(product_id)            │
│                                            │
└────────────────────────────────────────────┘
```

## 9. Error Handling & Retry Strategy

```
┌──────────────────────────────────┐
│  SyncQueue Job Processing         │
└──────────────┬───────────────────┘
               │
        ┌──────▼──────────┐
        │ Try to sync     │
        │ to channel API  │
        └──┬──────────┬───┘
           │          │
        Success    Failure
           │          │
           ▼          ▼
        Mark      Increment
      COMPLETED  retryCount
           │          │
           │          ▼
           │      retryCount < 5?
           │          │
           │      Yes  │  No
           │      ▼    ▼
           │    PEND  FAILED
           │    ING   (manual
           │         review)
           │
           └─ Update
              ChannelListing
              with results
```

