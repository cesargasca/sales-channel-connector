import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Package, DollarSign, Warehouse } from 'lucide-react'
import { getProduct } from '@/actions/product-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  // Calculate total stock across all variants
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + (variant.inventory?.quantityAvailable || 0),
    0
  )

  const totalReserved = product.variants.reduce(
    (sum, variant) => sum + (variant.inventory?.quantityReserved || 0),
    0
  )

  const totalSold = product.variants.reduce(
    (sum, variant) => sum + (variant.inventory?.quantitySold || 0),
    0
  )

  // Get primary image or first image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.category.name}
              {product.category.parent && ` / ${product.category.parent.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
          <Badge variant={product.isActive ? 'default' : 'secondary'} className="px-4 py-2">
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Product Image and Basic Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Image */}
            {primaryImage && (
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={primaryImage.url}
                  alt={primaryImage.altText || product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* All Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className={`aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                      image.isPrimary ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.altText || product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="border-t my-4" />

            {/* Price */}
            <div>
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(product.basePrice))}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Summary and Attributes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
            <CardDescription>{product.variants.length} variants</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stock Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium">Available</p>
                  </div>
                  <p className="text-3xl font-bold mt-2">{totalStock}</p>
                  <p className="text-xs text-muted-foreground">units in stock</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium">Reserved</p>
                  </div>
                  <p className="text-3xl font-bold mt-2">{totalReserved}</p>
                  <p className="text-xs text-muted-foreground">units reserved</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">Sold</p>
                  </div>
                  <p className="text-3xl font-bold mt-2">{totalSold}</p>
                  <p className="text-xs text-muted-foreground">units sold</p>
                </CardContent>
              </Card>
            </div>

            {/* Product Attributes */}
            {product.attributes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Product Attributes</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {product.attributes.map((attr) => (
                    <div key={attr.id} className="flex justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium capitalize">{attr.key.replace('_', ' ')}</span>
                      <span className="text-sm text-muted-foreground">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>All size and color combinations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Channels</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {variant.attributes.map((attr) => (
                        <Badge key={attr.id} variant="outline">
                          {attr.key}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.inventory?.quantityAvailable === 0 ? 'destructive' : 'secondary'}>
                      {variant.inventory?.quantityAvailable || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>{variant.inventory?.quantityReserved || 0}</TableCell>
                  <TableCell>{variant.inventory?.quantitySold || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {variant.inventory?.warehouseLocation || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {variant.channelListings.map((listing) => (
                        <Badge key={listing.id} variant={listing.isActive ? 'default' : 'secondary'}>
                          {listing.channel.displayName}
                        </Badge>
                      ))}
                      {variant.channelListings.length === 0 && (
                        <span className="text-sm text-muted-foreground">Not listed</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
