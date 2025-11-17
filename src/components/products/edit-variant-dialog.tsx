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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { updateVariant } from '@/actions/product-actions'
import { Edit, Loader2, X, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface VariantAttribute {
  id: string
  key: string
  value: string
}

interface Inventory {
  id: string
  quantityAvailable: number
  quantityReserved: number
  quantitySold: number
  minStockThreshold: number
  warehouseLocation?: string | null
}

interface EditVariantDialogProps {
  variant: {
    id: string
    sku: string
    barcode?: string | null
    attributes: VariantAttribute[]
    inventory?: Inventory | null
  }
  productId: string
}

export function EditVariantDialog({ variant, productId }: EditVariantDialogProps) {
  const [open, setOpen] = useState(false)
  const [sku, setSku] = useState(variant.sku)
  const [barcode, setBarcode] = useState(variant.barcode || '')
  const [attributes, setAttributes] = useState(variant.attributes)
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrValue, setNewAttrValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrValue.trim()) {
      setError('Both attribute key and value are required')
      return
    }

    // Check for duplicate keys
    if (attributes.some((attr) => attr.key.toLowerCase() === newAttrKey.toLowerCase())) {
      setError('Attribute key already exists')
      return
    }

    setAttributes([
      ...attributes,
      {
        id: `new-${Date.now()}`,
        key: newAttrKey.trim(),
        value: newAttrValue.trim(),
      },
    ])
    setNewAttrKey('')
    setNewAttrValue('')
    setError(null)
  }

  const handleRemoveAttribute = (attrId: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== attrId))
  }

  const handleUpdateAttribute = (attrId: string, field: 'key' | 'value', newValue: string) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === attrId ? { ...attr, [field]: newValue } : attr
      )
    )
  }

  const handleSave = () => {
    if (!sku.trim()) {
      setError('SKU is required')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await updateVariant(variant.id, {
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        attributes: attributes.map((attr) => ({
          key: attr.key,
          value: attr.value,
        })),
      })

      if (result.success) {
        router.refresh()
        setOpen(false)
      } else {
        setError(result.error || 'Failed to update variant')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>
            Update variant details, attributes, and inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Enter SKU"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter barcode (optional)"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Attributes</h4>

            {attributes.length > 0 && (
              <div className="space-y-2">
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex gap-2 items-center">
                    <Input
                      value={attr.key}
                      onChange={(e) => handleUpdateAttribute(attr.id, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1"
                      disabled={isPending}
                    />
                    <Input
                      value={attr.value}
                      onChange={(e) => handleUpdateAttribute(attr.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                      disabled={isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="New attribute key"
                className="flex-1"
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAttribute()
                  }
                }}
              />
              <Input
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                placeholder="Value"
                className="flex-1"
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAttribute()
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAttribute}
                disabled={isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Inventory Info (Read-only) */}
          {variant.inventory && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Inventory Information</h4>
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">{variant.inventory.quantityAvailable}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reserved:</span>
                  <span className="font-medium">{variant.inventory.quantityReserved}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sold:</span>
                  <span className="font-medium">{variant.inventory.quantitySold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Threshold:</span>
                  <span className="font-medium">{variant.inventory.minStockThreshold}</span>
                </div>
                {variant.inventory.warehouseLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{variant.inventory.warehouseLocation}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Inventory management is handled separately through the inventory module.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
