import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InventoryService } from '@/services/inventory-service'
import { AlertCircle } from 'lucide-react'

export default async function InventoryPage() {
  const inventory = await InventoryService.getAllInventory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          Manage stock levels across all variants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No inventory found.
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => {
                  const isLowStock = item.quantityAvailable <= item.minStockThreshold

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.variant.product.modelName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.variant.sku}
                      </TableCell>
                      <TableCell>{item.variant.size}</TableCell>
                      <TableCell>{item.variant.color}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.quantityAvailable}
                          {isLowStock && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantityReserved}</TableCell>
                      <TableCell>{item.quantitySold}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.warehouseLocation || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? 'warning' : 'success'}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
