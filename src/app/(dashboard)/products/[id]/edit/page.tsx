import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getProduct } from '@/actions/product-actions'
import { getCategories } from '@/actions/category-actions'
import { Button } from '@/components/ui/button'
import { ProductEditForm } from './product-edit-form'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/products/${product.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">
            Update information for {product.name}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <ProductEditForm product={product} categories={categories} />
    </div>
  )
}
