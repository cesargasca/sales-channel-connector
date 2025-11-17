'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateProduct } from '@/actions/product-actions'
import { ProductWithDetails } from '@/types/product'
import { CategoryWithHierarchy } from '@/types/category'
import { X, Plus, Loader2 } from 'lucide-react'

interface ProductEditFormProps {
  product: ProductWithDetails
  categories: CategoryWithHierarchy[]
}

export function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    categoryId: product.categoryId,
    name: product.name,
    description: product.description || '',
    basePrice: Number(product.basePrice),
    isActive: product.isActive,
  })

  // Attributes state
  const [attributes, setAttributes] = useState(
    product.attributes.map(attr => ({ key: attr.key, value: attr.value }))
  )

  // Images state
  const [images, setImages] = useState(
    product.images.map(img => ({
      url: img.url,
      altText: img.altText || '',
      position: img.position,
      isPrimary: img.isPrimary,
    }))
  )

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }])
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const newAttributes = [...attributes]
    newAttributes[index][field] = value
    setAttributes(newAttributes)
  }

  const handleAddImage = () => {
    setImages([
      ...images,
      { url: '', altText: '', position: images.length, isPrimary: false },
    ])
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleImageChange = (
    index: number,
    field: 'url' | 'altText' | 'isPrimary',
    value: string | boolean
  ) => {
    const newImages = [...images]
    if (field === 'isPrimary' && value === true) {
      // Unset other primary images
      newImages.forEach((img, i) => {
        img.isPrimary = i === index
      })
    } else {
      newImages[index][field] = value as never
    }
    setImages(newImages)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required'
    }

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be positive'
    }

    // Validate attributes
    attributes.forEach((attr, index) => {
      if (attr.key && !attr.value) {
        newErrors[`attribute_${index}_value`] = 'Attribute value is required'
      }
      if (!attr.key && attr.value) {
        newErrors[`attribute_${index}_key`] = 'Attribute key is required'
      }
    })

    // Validate images
    images.forEach((img, index) => {
      if (img.url && !img.url.match(/^https?:\/\/.+/)) {
        newErrors[`image_${index}_url`] = 'Must be a valid URL'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Filter out empty attributes
      const validAttributes = attributes.filter(attr => attr.key && attr.value)

      // Filter out empty images and update positions
      const validImages = images
        .filter(img => img.url)
        .map((img, index) => ({ ...img, position: index }))

      const result = await updateProduct(product.id, {
        ...formData,
        attributes: validAttributes,
        images: validImages,
      })

      if (result.success) {
        router.push(`/products/${product.id}`)
        router.refresh()
      } else {
        setErrors({ submit: result.error || 'Failed to update product' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update the core product details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.parent && `${category.parent.name} / `}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basePrice">
                Base Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className={errors.basePrice ? 'border-destructive' : ''}
              />
              {errors.basePrice && (
                <p className="text-sm text-destructive">{errors.basePrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === 'true' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Product Attributes</CardTitle>
          <CardDescription>Add custom attributes for this product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attributes.map((attr, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  value={attr.key}
                  onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                  placeholder="Attribute name (e.g., material)"
                  className={errors[`attribute_${index}_key`] ? 'border-destructive' : ''}
                />
                {errors[`attribute_${index}_key`] && (
                  <p className="text-sm text-destructive">{errors[`attribute_${index}_key`]}</p>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={attr.value}
                  onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                  placeholder="Attribute value (e.g., leather)"
                  className={errors[`attribute_${index}_value`] ? 'border-destructive' : ''}
                />
                {errors[`attribute_${index}_value`] && (
                  <p className="text-sm text-destructive">{errors[`attribute_${index}_value`]}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveAttribute(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddAttribute}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Attribute
          </Button>
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
          <CardDescription>Manage product images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {images.map((img, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor={`image-url-${index}`}>Image URL</Label>
                    <Input
                      id={`image-url-${index}`}
                      value={img.url}
                      onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className={errors[`image_${index}_url`] ? 'border-destructive' : ''}
                    />
                    {errors[`image_${index}_url`] && (
                      <p className="text-sm text-destructive">{errors[`image_${index}_url`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`image-alt-${index}`}>Alt Text</Label>
                    <Input
                      id={`image-alt-${index}`}
                      value={img.altText}
                      onChange={(e) => handleImageChange(index, 'altText', e.target.value)}
                      placeholder="Image description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`image-primary-${index}`}
                      checked={img.isPrimary}
                      onChange={(e) => handleImageChange(index, 'isPrimary', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`image-primary-${index}`} className="font-normal">
                      Set as primary image
                    </Label>
                    {img.isPrimary && <Badge variant="default">Primary</Badge>}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveImage(index)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddImage}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errors.submit && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
