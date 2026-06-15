import { ProductCard } from "@/components/storefront/product-card"

interface ProductItem {
  id: string
  name: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
}

interface StorefrontAllItemsProps {
  products: ProductItem[]
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  isAuthenticated: boolean
}

export function StorefrontAllItems({ products, favoriteIds, onToggleFavorite }: StorefrontAllItemsProps) {
  return (
    <section className="max-w-4xl mx-auto px-4 pb-20">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Todos los artículos
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorited={favoriteIds.includes(product.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  )
}