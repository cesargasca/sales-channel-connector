# Product Variants Implementation Guide

## Quick Reference: Current vs. Enhanced Architecture

### Current State (Already Implemented)
```
Database & Business Logic:
✓ ProductVariant model with flexible attributes
✓ ChannelListing table (unique per variant per channel)
✓ Independent pricing per variant per channel
✓ Inventory tied to variants
✓ publishProductToChannels() publishes ALL variants to channels
✓ ChannelSyncService.syncStockToAllChannels()

What Needs Enhancement:
✗ UI for selecting specific variants to publish
✗ Variant-level pricing overrides in UI
✗ Bulk variant creation wizard
✗ Variant comparison/matrix view
✗ Variant-specific channel status tracking UI
```

## Key Architecture Decisions Explained

### 1. Why Per-Variant Channel Publishing?
Current schema supports:
```
ProductVariant.sku = "nike-air-90-9-white"
↓
ChannelListing {
  variantId,
  channelId,
  price: 120.00,  // Shopify price
  externalId: "prod_12345"
}
↓
ChannelListing {
  variantId,
  channelId: amazon,
  price: 115.00,  // Amazon price (lower)
  externalId: "ASIN_67890"
}
```

**Benefits**:
- Different channels may have different pricing strategies
- Some variants may be exclusive to certain channels
- Variant-specific inventory syncing
- Per-channel variant status management

### 2. Inventory Architecture
```
Inventory {
  variantId (1:1),
  quantityAvailable: 50,    // Can sell
  quantityReserved: 10,     // Locked by orders
  quantitySold: 100,        // Historical
  minStockThreshold: 5      // Alert level
}

InventoryTransaction (audit log)
- Records every change
- Links to orders/adjustments
- Allows rollback capability
```

**Why this design**:
- Prevents overselling
- Provides complete audit trail
- Supports returns/cancellations
- Enables low-stock alerts

### 3. Sync Queue Pattern
```
User Action (publish/price change)
    ↓
Create SyncQueue job immediately
    ↓
Return success to user immediately
    ↓
Background worker processes asynchronously
    ↓
Handles failures with retry logic
    ↓
Updates ChannelListing with results
```

**Benefits**:
- Non-blocking UX
- Handles network failures
- Retry mechanism
- Complete audit trail (SyncQueue table)

## File Reading Reference

### To Understand Product Structure
1. `/home/user/sales-channel-connector/prisma/schema.prisma` - Database schema (lines 31-125)
2. `/home/user/sales-channel-connector/src/types/product.ts` - TypeScript interfaces
3. `/home/user/sales-channel-connector/src/actions/product-actions.ts` - CRUD operations

### To Understand Channel Publishing
1. `/home/user/sales-channel-connector/src/actions/product-actions.ts` - publishProductToChannels() (lines 490-636)
2. `/home/user/sales-channel-connector/src/components/products/publish-to-channels.tsx` - UI component
3. `/home/user/sales-channel-connector/src/lib/channels/adapter-factory.ts` - Channel adapter pattern

### To Understand Inventory Management
1. `/home/user/sales-channel-connector/src/services/inventory-service.ts` - Stock management
2. `/home/user/sales-channel-connector/src/services/channel-sync-service.ts` - Sync logic
3. `/home/user/sales-channel-connector/prisma/schema.prisma` (lines 127-143) - Inventory table

### To Understand UI Architecture
1. `/home/user/sales-channel-connector/src/app/(dashboard)/products/[id]/page.tsx` - Product detail layout
2. `/home/user/sales-channel-connector/src/app/(dashboard)/products/[id]/edit/product-edit-form.tsx` - Form patterns
3. `/home/user/sales-channel-connector/src/components/products/publish-to-channels.tsx` - Dialog pattern

## Data Model Deep Dive

### Product Hierarchy Example
```
Product: Nike Air Max 90
├─ basePrice: 100.00 (base for all variants)
├─ category: Shoes > Running Shoes
├─ attributes:
│  ├─ brand: Nike
│  └─ model: Air Max 90
├─ images: [url1, url2, url3]
└─ variants:
   ├─ Variant 1: Size 8, White
   │  ├─ sku: "nike-air-90-8-white"
   │  ├─ attributes: [{size: 8}, {color: White}]
   │  ├─ inventory: {available: 5, reserved: 2}
   │  └─ listings:
   │     ├─ Shopify: {price: 110.00, externalId: "prod_123"}
   │     ├─ Amazon: {price: 105.00, externalId: "ASIN_456"}
   │     └─ MercadoLibre: {price: 120.00, externalId: "MLB_789"}
   │
   ├─ Variant 2: Size 9, White
   │  ├─ sku: "nike-air-90-9-white"
   │  ├─ attributes: [{size: 9}, {color: White}]
   │  ├─ inventory: {available: 10, reserved: 0}
   │  └─ listings:
   │     ├─ Shopify: {price: 110.00, externalId: "prod_124"}
   │     └─ Amazon: (not published)
   │
   └─ Variant 3: Size 8, Red
      ├─ sku: "nike-air-90-8-red"
      ├─ attributes: [{size: 8}, {color: Red}]
      ├─ inventory: {available: 0}  // Out of stock
      └─ listings: (none - exclusive to Shopify)
```

## Key Server Actions Overview

### Publishing
```typescript
publishProductToChannels(productId, channelIds: ["shopify", "amazon"])
├─ Gets product with all variants
├─ For each variant:
│  ├─ Check if already listed on channel
│  ├─ Create ChannelListing
│  └─ Queue CreateListing sync job
└─ Return results
```

### Inventory Update
```typescript
InventoryService.adjustStock(variantId, quantity, reason)
├─ Update Inventory record (transaction)
├─ Create InventoryTransaction (audit)
├─ Trigger syncStockToAllChannels()
└─ Queue UPDATE_STOCK jobs for all active channels
```

## Critical Database Constraints

1. **SKU Uniqueness**: Each variant must have unique SKU
   ```sql
   CREATE UNIQUE INDEX idx_sku ON product_variants(sku)
   ```

2. **One Listing Per Variant Per Channel**:
   ```sql
   CREATE UNIQUE INDEX idx_variant_channel ON channel_listings(variant_id, channel_id)
   ```
   → Can't publish same variant twice to same channel

3. **Variant Attributes**:
   ```sql
   CREATE UNIQUE INDEX idx_variant_attr_key ON variant_attributes(variant_id, key)
   ```
   → Only one value per attribute per variant (no "size: small" AND "size: medium")

## Important Notes for Implementation

1. **When publishing a product**, ALL variants get published to selected channels
   - To publish only specific variants, call `createChannelListing()` directly

2. **When deleting a variant**, cascades to:
   - VariantAttribute records
   - Inventory record
   - ChannelListing records
   - OrderItem references (should handle!)

3. **Inventory calculations**:
   - Available = quantity available for sale
   - Reserved = locked by pending orders
   - Sold = fulfilled orders
   - Total Stock = Available + Reserved + Sold

4. **Channel syncing**:
   - All stock updates go through SyncQueue
   - Max retries: 5 (after that, manual intervention needed)
   - Should implement cron job to process queue periodically

5. **Flexible Attributes**:
   - Not limited to size/color
   - Can be any key-value pair (storage: "256GB", warranty: "2-year", etc.)
   - Keys must be unique per variant (enforced by DB)

## Next Steps for Enhancement

1. **Variant Selection Component**
   - Enhance PublishToChannels to allow variant selection
   - Only publish specific variants to specific channels

2. **Variant Detail Page**
   - Per-variant view
   - Channel listing management
   - Price overrides
   - Inventory adjustments

3. **Bulk Operations**
   - Bulk variant creation
   - Bulk price updates across channels
   - Bulk inventory adjustments

4. **Reporting**
   - Variant sales by channel
   - Inventory levels by variant
   - Channel-specific performance metrics
