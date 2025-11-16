import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getChannels } from '@/actions/channel-actions'
import { Store, Package, ShoppingCart } from 'lucide-react'

export default async function ChannelsPage() {
  const channels = await getChannels()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Channels</h1>
        <p className="text-muted-foreground">
          Manage your e-commerce channel integrations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  <CardTitle className="text-lg">{channel.displayName}</CardTitle>
                </div>
                <Badge variant={channel.isActive ? 'success' : 'secondary'}>
                  {channel.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Listings
                </span>
                <span className="font-medium">{channel._count.listings}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  Orders
                </span>
                <span className="font-medium">{channel._count.orders}</span>
              </div>
              {channel.lastSyncedAt && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Last synced: {new Date(channel.lastSyncedAt).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {channels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No sales channels configured yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
