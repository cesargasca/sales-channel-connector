import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getOrders } from '@/actions/order-actions'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function OrdersPage() {
  const result = await getOrders({ limit: 50 })
  const orders = result.success ? result.orders : []

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning'
      case 'CONFIRMED':
        return 'default'
      case 'SHIPPED':
        return 'default'
      case 'DELIVERED':
        return 'success'
      case 'CANCELLED':
        return 'destructive'
      case 'RETURNED':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          View and manage orders from all channels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.externalOrderId}
                    </TableCell>
                    <TableCell>{order.channel.displayName}</TableCell>
                    <TableCell>
                      {order.customerInfo && typeof order.customerInfo === 'object' && 'name' in order.customerInfo
                        ? String(order.customerInfo.name)
                        : '-'}
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
