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
import { Input } from '@/components/ui/input'
import { publishVariantsToChannels } from '@/actions/product-actions'
import { Share2, Loader2, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Channel {
  id: string
  name: string
  isActive: boolean
}

interface VariantWithDetails {
  id: string
  sku: string
  attributes: Array<{ key: string; value: string }>
  inventory?: {
    quantityAvailable: number
  } | null
  channelListings?: Array<{
    channelId: string
    channel: {
      id: string
      name: string
    }
  }>
}

interface PublishVariantsToChannelsProps {
  productId: string
  productName: string
  basePrice: number
  variants: VariantWithDetails[]
  availableChannels: Channel[]
}

interface VariantChannelSelection {
  variantId: string
  channelId: string
  price: number
}

export function PublishVariantsToChannels({
  productId,
  productName,
  basePrice,
  variants,
  availableChannels,
}: PublishVariantsToChannelsProps) {
  const [open, setOpen] = useState(false)
  const [selections, setSelections] = useState<VariantChannelSelection[]>([])
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const activeChannels = availableChannels.filter((ch) => ch.isActive)

  // Helper to check if variant is already published to a channel
  const isVariantPublishedToChannel = (variantId: string, channelId: string) => {
    const variant = variants.find((v) => v.id === variantId)
    return variant?.channelListings?.some((cl) => cl.channelId === channelId) || false
  }

  // Helper to check if variant-channel combination is selected
  const isSelected = (variantId: string, channelId: string) => {
    return selections.some(
      (s) => s.variantId === variantId && s.channelId === channelId
    )
  }

  // Get price for variant-channel combination
  const getPrice = (variantId: string, channelId: string) => {
    const key = `${variantId}-${channelId}`
    return customPrices[key] ?? basePrice
  }

  // Toggle selection for a variant-channel combination
  const toggleSelection = (variantId: string, channelId: string) => {
    const key = `${variantId}-${channelId}`

    if (isSelected(variantId, channelId)) {
      setSelections(selections.filter(
        (s) => !(s.variantId === variantId && s.channelId === channelId)
      ))
      // Remove custom price
      const newPrices = { ...customPrices }
      delete newPrices[key]
      setCustomPrices(newPrices)
    } else {
      setSelections([
        ...selections,
        {
          variantId,
          channelId,
          price: getPrice(variantId, channelId),
        },
      ])
    }
  }

  // Update price for a variant-channel combination
  const updatePrice = (variantId: string, channelId: string, price: number) => {
    const key = `${variantId}-${channelId}`
    setCustomPrices({ ...customPrices, [key]: price })

    // Update selection if it exists
    setSelections(
      selections.map((s) =>
        s.variantId === variantId && s.channelId === channelId
          ? { ...s, price }
          : s
      )
    )
  }

  // Select all variants for a channel
  const selectAllForChannel = (channelId: string) => {
    const newSelections = [...selections]
    variants.forEach((variant) => {
      if (
        !isVariantPublishedToChannel(variant.id, channelId) &&
        !isSelected(variant.id, channelId)
      ) {
        newSelections.push({
          variantId: variant.id,
          channelId,
          price: getPrice(variant.id, channelId),
        })
      }
    })
    setSelections(newSelections)
  }

  // Deselect all variants for a channel
  const deselectAllForChannel = (channelId: string) => {
    setSelections(selections.filter((s) => s.channelId !== channelId))
  }

  // Select all channels for a variant
  const selectAllForVariant = (variantId: string) => {
    const newSelections = [...selections]
    activeChannels.forEach((channel) => {
      if (
        !isVariantPublishedToChannel(variantId, channel.id) &&
        !isSelected(variantId, channel.id)
      ) {
        newSelections.push({
          variantId,
          channelId: channel.id,
          price: getPrice(variantId, channel.id),
        })
      }
    })
    setSelections(newSelections)
  }

  // Deselect all channels for a variant
  const deselectAllForVariant = (variantId: string) => {
    setSelections(selections.filter((s) => s.variantId !== variantId))
  }

  const handlePublish = () => {
    if (selections.length === 0) {
      setError('Please select at least one variant-channel combination')
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await publishVariantsToChannels(selections)

      if (result.success) {
        setSuccess(
          result.message || `Successfully queued ${selections.length} publishing jobs`
        )
        setSelections([])
        setCustomPrices({})
        router.refresh()
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
        }, 2000)
      } else {
        setError(result.error || 'Failed to publish variants')
      }
    })
  }

  const formatAttributes = (attributes: Array<{ key: string; value: string }>) => {
    return attributes.map((attr) => `${attr.key}: ${attr.value}`).join(', ')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Share2 className="mr-2 h-4 w-4" />
          Publish to Channels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Product Variants to Channels</DialogTitle>
          <DialogDescription>
            Select which variants of "{productName}" to publish to which channels, and set custom pricing per channel
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {activeChannels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No active channels available. Please create and activate channels first.
              </p>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No variants available. Please create variants first.
              </p>
            </div>
          ) : (
            <>
              {/* Selection Summary */}
              <div className="mb-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Selected: {selections.length} variant-channel combination(s)
                </p>
              </div>

              {/* Variant-Channel Matrix */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Variant</th>
                        <th className="text-left p-3 text-sm font-medium">Stock</th>
                        {activeChannels.map((channel) => (
                          <th key={channel.id} className="text-center p-3 text-sm font-medium min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <span>{channel.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => selectAllForChannel(channel.id)}
                                >
                                  All
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => deselectAllForChannel(channel.id)}
                                >
                                  None
                                </Button>
                              </div>
                            </div>
                          </th>
                        ))}
                        <th className="text-center p-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => (
                        <tr key={variant.id} className="border-t">
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-sm font-medium">{variant.sku}</span>
                              {variant.attributes.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatAttributes(variant.attributes)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {variant.inventory?.quantityAvailable || 0}
                              </span>
                            </div>
                          </td>
                          {activeChannels.map((channel) => {
                            const published = isVariantPublishedToChannel(variant.id, channel.id)
                            const selected = isSelected(variant.id, channel.id)

                            return (
                              <td key={`${variant.id}-${channel.id}`} className="p-3">
                                <div className="flex flex-col items-center gap-2">
                                  {published ? (
                                    <Badge variant="success" className="text-xs">
                                      Published
                                    </Badge>
                                  ) : (
                                    <>
                                      <Checkbox
                                        checked={selected}
                                        onCheckedChange={() =>
                                          toggleSelection(variant.id, channel.id)
                                        }
                                        disabled={isPending}
                                      />
                                      {selected && (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={getPrice(variant.id, channel.id)}
                                          onChange={(e) =>
                                            updatePrice(
                                              variant.id,
                                              channel.id,
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-24 h-8 text-xs"
                                          placeholder="Price"
                                          disabled={isPending}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          <td className="p-3">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => selectAllForVariant(variant.id)}
                              >
                                Select All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => deselectAllForVariant(variant.id)}
                              >
                                Clear
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Info */}
              <div className="mt-3 text-xs text-muted-foreground">
                Base price: {formatCurrency(basePrice)} • Custom prices can be set per variant per channel
              </div>
            </>
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPending || selections.length === 0}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Publishing...' : `Publish ${selections.length} Selection(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
