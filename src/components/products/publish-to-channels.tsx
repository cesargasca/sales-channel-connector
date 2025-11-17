'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { publishProductToChannels } from '@/actions/product-actions'
import { Share2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Channel {
  id: string
  name: string
  isActive: boolean
}

interface PublishedChannel {
  channelId: string
  channelName: string
}

interface PublishToChannelsProps {
  productId: string
  productName: string
  availableChannels: Channel[]
  publishedChannels: PublishedChannel[]
}

export function PublishToChannels({
  productId,
  productName,
  availableChannels,
  publishedChannels,
}: PublishToChannelsProps) {
  const [open, setOpen] = useState(false)
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Get channels that are not yet published
  const publishedChannelIds = new Set(publishedChannels.map((pc) => pc.channelId))
  const unpublishedChannels = availableChannels.filter(
    (channel) => channel.isActive && !publishedChannelIds.has(channel.id)
  )

  const handleToggleChannel = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handlePublish = () => {
    if (selectedChannelIds.length === 0) {
      setError('Please select at least one channel')
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await publishProductToChannels(productId, selectedChannelIds)

      if (result.success) {
        setSuccess(result.message || 'Product published successfully')
        setSelectedChannelIds([])
        router.refresh()
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
        }, 2000)
      } else {
        setError(result.error || 'Failed to publish product')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Share2 className="mr-2 h-4 w-4" />
          Publish to Channels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish Product to Channels</DialogTitle>
          <DialogDescription>
            Select the channels where you want to publish "{productName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Currently Published Channels */}
          {publishedChannels.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Currently Published On:</h4>
              <div className="flex flex-wrap gap-2">
                {publishedChannels.map((pc) => (
                  <Badge key={pc.channelId} variant="success">
                    {pc.channelName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Channels */}
          {unpublishedChannels.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Select Channels to Publish:</h4>
              <div className="space-y-3">
                {unpublishedChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`channel-${channel.id}`}
                      checked={selectedChannelIds.includes(channel.id)}
                      onCheckedChange={() => handleToggleChannel(channel.id)}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor={`channel-${channel.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {channel.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {availableChannels.length === 0
                  ? 'No channels available. Please create channels first.'
                  : 'This product is already published to all available channels.'}
              </p>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPending || unpublishedChannels.length === 0}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
