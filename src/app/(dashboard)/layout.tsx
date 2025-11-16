import Link from 'next/link'
import { Package, ShoppingCart, Warehouse, Store, LayoutDashboard } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Shoe Inventory</h1>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Package className="h-4 w-4" />
            Products
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Warehouse className="h-4 w-4" />
            Inventory
          </Link>
          <Link
            href="/channels"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Store className="h-4 w-4" />
            Channels
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            Orders
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
