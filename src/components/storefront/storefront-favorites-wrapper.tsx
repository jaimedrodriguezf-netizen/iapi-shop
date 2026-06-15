"use client"

import * as React from "react"
import { toast } from "sonner"
import { toggleFavorite } from "@/lib/storefront/favorites-actions"
import { SellerHero } from "@/components/storefront/seller-hero"
import { StorefrontTabs } from "@/components/storefront/storefront-tabs"
import { StorefrontAllItems } from "@/components/storefront/storefront-all-items"
import { StoreSearch } from "@/components/storefront/store-search"
import { FavoritesButton } from "@/components/storefront/favorites-button"
import { StorefrontHeader } from "@/components/storefront/storefront-header"
import { Section } from "@/lib/sections/actions"

interface ProductItem {
  id: string
  name: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
  category_id?: string
}

interface FavoriteProductItem {
  id: string
  name: string
  price: number
  image_url?: string
}

interface TenantInfo {
  name: string
  whatsapp_phone?: string
  address?: string | null
  social_links?: { instagram?: string; facebook?: string; tiktok?: string } | null
  public_settings?: { show_phone?: boolean; show_address?: boolean; show_social_links?: boolean } | null
}

type CategoryData = { id: string; name: string; parent_id?: string | null }

// Get all descendant IDs of a category (including itself)
function getDescendantIds(categoryId: string, categories: CategoryData[]): string[] {
  const ids = [categoryId]
  const children = categories.filter(c => c.parent_id === categoryId)
  for (const child of children) {
    ids.push(...getDescendantIds(child.id, categories))
  }
  return ids
}

interface StorefrontFavoritesWrapperProps {
  // Seller hero
  sellerHero: {
    tenantName: string
    tenantSlug?: string
    description?: string
    address?: string | null
    logoUrl?: string | null
    bannerUrl?: string | null
    stats: { rating: string; ratingCount: string; sales: string; age: string }
    lastActive?: string
  }
  // Existing
  products: ProductItem[]
  categories?: CategoryData[]
  tenantId: string
  brandColor: string
  secondaryColor?: string
  whatsappPhone?: string
  initialFavoriteIds: string[]
  initialFavoriteProducts: FavoriteProductItem[]
  tenantName: string
  isAuthenticated: boolean
  tenantInfo?: TenantInfo
  sections?: Section[]
}

export function StorefrontFavoritesWrapper({
  sellerHero, products, categories = [], tenantId, brandColor, secondaryColor, whatsappPhone,
  initialFavoriteIds, initialFavoriteProducts, tenantName, isAuthenticated, tenantInfo, sections,
}: StorefrontFavoritesWrapperProps) {
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>(initialFavoriteIds)
  const [favoriteProducts, setFavoriteProducts] = React.useState(initialFavoriteProducts)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("todos")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  // Filter and search products
  const filteredProducts = React.useMemo(() => {
    let result = [...products]

    // Filter by selected category (includes descendants)
    if (selectedCategory) {
      const allowedIds = getDescendantIds(selectedCategory, categories)
      result = result.filter(p => p.category_id && allowedIds.includes(p.category_id))
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    // Apply sort filter
    switch (activeFilter) {
      case "menor-precio":
        result.sort((a, b) => a.price - b.price)
        break
      case "mayor-precio":
        result.sort((a, b) => b.price - a.price)
        break
      case "descuento":
        result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price)
        break
    }

    return result
  }, [products, categories, searchQuery, activeFilter, selectedCategory])

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesion para guardar favoritos")
      return
    }

    const isCurrentlyFav = favoriteIds.includes(productId)
    setFavoriteIds(prev => isCurrentlyFav ? prev.filter(id => id !== productId) : [...prev, productId])

    if (!isCurrentlyFav) {
      const product = products.find(p => p.id === productId)
      if (product) {
        setFavoriteProducts(prev => [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_urls?.[0] }])
      }
    } else {
      setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
    }

    const result = await toggleFavorite(productId, tenantId)
    if (!result.success) {
      setFavoriteIds(prev => isCurrentlyFav ? [...prev, productId] : prev.filter(id => id !== productId))
      if (!isCurrentlyFav) {
        setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
      } else {
        const product = products.find(p => p.id === productId)
        if (product) setFavoriteProducts(prev => [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_urls?.[0] }])
      }
      toast.error(result.error || "Error al actualizar favorito")
    }
  }

  // Only show categories that have products (directly or in descendant categories)
  const activeCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return []

    // Build a lookup: which category IDs have products directly assigned
    const productCategoryIds = new Set(
      products.filter(p => p.category_id).map(p => p.category_id as string)
    )

    // Include a category if:
    // 1. It has products directly assigned to it
    // 2. OR it has a descendant category that has products
    function hasProductsInTree(catId: string): boolean {
      if (productCategoryIds.has(catId)) return true
      const children = categories.filter(c => c.parent_id === catId)
      return children.some(child => hasProductsInTree(child.id))
    }

    return categories.filter(cat => hasProductsInTree(cat.id))
  }, [categories, products])

  const handleCategorySelect = React.useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }, [])

  return (
    <>
      {/* Header with category drawer */}
      <StorefrontHeader
        tenantName={tenantName}
        tenantId={tenantId}
        brandColor={brandColor}
        categories={activeCategories}
        selectedCategoryId={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Seller Hero Section */}
      <SellerHero
        tenantName={sellerHero.tenantName}
        tenantSlug={sellerHero.tenantSlug}
        description={sellerHero.description}
        address={sellerHero.address}
        logoUrl={sellerHero.logoUrl}
        stats={sellerHero.stats}
        lastActive={sellerHero.lastActive}
      />

      {/* Search bar */}
      <StoreSearch
        productCount={products.length}
        onSearch={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Tabs and Grid */}
      <StorefrontTabs
        products={filteredProducts}
        tenantId={tenantId}
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        whatsappPhone={whatsappPhone}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        isAuthenticated={isAuthenticated}
        tenantInfo={tenantInfo}
        sections={sections}
      />

      {/* All items section */}
      <StorefrontAllItems
        products={filteredProducts}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        isAuthenticated={isAuthenticated}
      />

      {/* Favorites floating button */}
      <FavoritesButton
        products={favoriteProducts}
        itemCount={favoriteProducts.length}
        whatsappPhone={whatsappPhone}
        tenantName={tenantName}
        onRemoveFavorite={handleToggleFavorite}
      />
    </>
  )
}