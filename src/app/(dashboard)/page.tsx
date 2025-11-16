import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { Package, AlertCircle, ShoppingCart, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getDashboardStats() {
  const [
    totalProducts,
    totalVariants,
    lowStockCount,
    totalOrders,
    pendingOrders,
    revenueData,
    activeChannels,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.inventory.count({
      where: {
        quantityAvailable: {
          lte: prisma.inventory.fields.minStockThreshold,
        },
      },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({
      where: {
        status: {
          in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.salesChannel.count({ where: { isActive: true } }),
  ])

  return {
    totalProducts,
    totalVariants,
    lowStockItems: lowStockCount,
    totalOrders,
    pendingOrders,
    totalRevenue: revenueData._sum.totalAmount || 0,
    activeChannels,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your shoe inventory management system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVariants} total variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.totalRevenue))}
            </div>
            <p className="text-xs text-muted-foreground">
              From confirmed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <a
            href="/products/new"
            className="rounded-lg border p-3 hover:bg-accent transition-colors"
          >
            <div className="font-medium">Add New Product</div>
            <div className="text-sm text-muted-foreground">
              Create a new shoe model with variants
            </div>
          </a>
          <a
            href="/inventory"
            className="rounded-lg border p-3 hover:bg-accent transition-colors"
          >
            <div className="font-medium">Manage Inventory</div>
            <div className="text-sm text-muted-foreground">
              Adjust stock levels and view low stock items
            </div>
          </a>
          <a
            href="/channels"
            className="rounded-lg border p-3 hover:bg-accent transition-colors"
          >
            <div className="font-medium">Configure Channels</div>
            <div className="text-sm text-muted-foreground">
              Manage sales channel integrations
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
