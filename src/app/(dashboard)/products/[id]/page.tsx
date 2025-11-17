import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getProduct } from '@/actions/product-actions'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Package, Warehouse } from 'lucide-react'

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  // Calculate total stock across all variants
  const totalStock = product.variants.reduce(
    (sum, v) => sum + (v.inventory?.quantityAvailable || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.category.parent && `${product.category.parent.name} / `}
              {product.category.name}
            </p>
          </div>
        </div>
        <Badge variant={product.isActive ? 'success' : 'secondary'} className="h-8 px-4">
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Product Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Product Name</div>
              <div className="text-lg font-medium">{product.name}</div>
            </div>

            {product.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="text-sm">{product.description}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground">Base Price</div>
              <div className="text-2xl font-bold">{formatCurrency(Number(product.basePrice))}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Variants</div>
                <div className="text-lg font-medium">{product.variants.length}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Stock</div>
                <div className="text-lg font-medium">{totalStock}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Attributes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Product Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            {product.attributes.length > 0 ? (
              <div className="space-y-3">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {attr.key}
                    </span>
                    <span className="text-sm font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No product attributes defined.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Images */}
      {product.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image) => (
                <div key={image.id} className="relative aspect-square border rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="w-full h-full object-cover"
                  />
                  {image.isPrimary && (
                    <Badge className="absolute top-2 right-2" variant="default">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.variants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.map((variant) => {
                  const inventory = variant.inventory
                  const isLowStock = inventory && inventory.quantityAvailable <= inventory.minStockThreshold
                  const isOutOfStock = inventory && inventory.quantityAvailable === 0

                  return (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variant.attributes.map((attr) => (
                            <Badge key={attr.id} variant="outline" className="text-xs">
                              {attr.key}: {attr.value}
                            </Badge>
                          ))}
                          {variant.attributes.length === 0 && (
                            <span className="text-sm text-muted-foreground">No attributes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {variant.barcode || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <span className={isOutOfStock ? 'text-destructive font-medium' : ''}>
                            {inventory?.quantityAvailable || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{inventory?.quantityReserved || 0}</TableCell>
                      <TableCell>{inventory?.quantitySold || 0}</TableCell>
                      <TableCell className="text-sm">
                        {inventory?.warehouseLocation || '-'}
                      </TableCell>
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="secondary">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No variants found for this product.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Channel Listings (if any variant has channel listings) */}
      {product.variants.some(v => v.channelListings && v.channelListings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Channel Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant SKU</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Channel SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.flatMap((variant) =>
                  (variant.channelListings || []).map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{listing.channel.name}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{listing.externalId}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {listing.externalSKU || '-'}
                      </TableCell>
                      <TableCell>
                        {listing.price ? formatCurrency(Number(listing.price)) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={listing.isActive ? 'success' : 'secondary'}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
