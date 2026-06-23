"use client"

import * as React from "react"
import { ProductCard } from "@/components/storefront/product-card"
import { StoreSearch } from "@/components/storefront/store-search"
import { Search } from "lucide-react"
import { Section } from "@/lib/sections/actions"
import { getSectionProducts } from "@/lib/sections/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { toggleFavorite } from "@/lib/storefront/favorites-actions"
import { ProductDetailModal } from "@/components/landing/product-detail-modal"
import { LegalFooterLinks } from "@/components/legal/legal-footer-links"

interface MarketplaceProduct {
  id: string
  tenant_id?: string
  name: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
  category_name?: string | null
  category_id?: string | null
  description?: string | null
  tenant_name?: string | null
  tenant_slug?: string | null
}

interface MarketplaceClientProps {
  products: MarketplaceProduct[]
  tenantCount: number
  categories?: { id: string; name: string; parent_id: string | null }[]
  selectedCategoryId?: string | null
  onCategorySelect?: (id: string | null) => void
  sections?: Section[]
  initialFavoriteIds?: string[]
  isAuthenticated?: boolean
}

type Tab = string

export function MarketplaceClient({
  products,
  categories = [],
  selectedCategoryId = null,
  onCategorySelect,
  sections = [],
  initialFavoriteIds = [],
  isAuthenticated = false,
}: MarketplaceClientProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>("todos")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("todos")
  const [localSelectedCategory, setLocalSelectedCategory] = React.useState<string | null>(null)
  const [sectionProducts, setSectionProducts] = React.useState<MarketplaceProduct[]>([])
  const [fetchedSectionId, setFetchedSectionId] = React.useState<string | null>(null)
  const [prevInitialFavoriteIds, setPrevInitialFavoriteIds] = React.useState<string[]>(initialFavoriteIds || [])
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>(initialFavoriteIds || [])
  const [selectedProduct, setSelectedProduct] = React.useState<MarketplaceProduct | null>(null)
  const router = useRouter()

  if (initialFavoriteIds !== prevInitialFavoriteIds) {
    setPrevInitialFavoriteIds(initialFavoriteIds || [])
    setFavoriteIds(initialFavoriteIds || [])
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar favoritos")
      setTimeout(() => router.push("/login"), 800)
      return
    }
    const product = products.find(p => p.id === productId) || sectionProducts.find(p => p.id === productId)
    if (!product || !product.tenant_id) {
      toast.error("Error al guardar favorito")
      return
    }
    const isCurrentlyFav = favoriteIds.includes(productId)
    setFavoriteIds(prev => isCurrentlyFav ? prev.filter(id => id !== productId) : [...prev, productId])
    
    const result = await toggleFavorite(productId, product.tenant_id)
    if (!result.success) {
      setFavoriteIds(prev => isCurrentlyFav ? [...prev, productId] : prev.filter(id => id !== productId))
      toast.error(result.error || "Error al actualizar favorito")
    }
  }

  // Use external category state if provided, otherwise fall back to local
  const selectedCategory = selectedCategoryId ?? localSelectedCategory
  const handleCategorySelect = onCategorySelect ?? setLocalSelectedCategory

  // Build dynamic tabs: Todos + Sections only
  const allTabs = React.useMemo(() => {
    const tabs: { key: string; label: string }[] = [
      { key: "todos", label: "Todos" },
    ]
    for (const s of sections) {
      tabs.push({ key: s.id, label: s.name })
    }
    return tabs
  }, [sections])

  // When a section tab is selected, fetch its products
  React.useEffect(() => {
    const isSectionTab = sections.some(s => s.id === activeTab)
    if (!isSectionTab) return
    let cancelled = false
    // Reset is handled by the catch/then pattern — fetchedSectionId mismatch drives loading
    getSectionProducts(activeTab).then(result => {
      if (cancelled) return
      if (result.success && result.data) {
        setSectionProducts(result.data)
      } else {
        setSectionProducts([])
      }
      setFetchedSectionId(activeTab)
    }).catch(() => { if (!cancelled) setSectionProducts([]) })
    return () => { cancelled = true }
  }, [activeTab, sections])

  // Derive loading: section is selected but its data hasn't arrived yet
  const isSectionTab = sections.some(s => s.id === activeTab)
  const sectionLoading = isSectionTab && fetchedSectionId !== activeTab

  // Filter products by selected category (includes descendants)
  const filteredByCategory = React.useMemo(() => {
    if (!selectedCategory) return products
    const getDescendants = (catId: string, cats: typeof categories): string[] => {
      const ids = [catId]
      const children = cats.filter(c => c.parent_id === catId)
      for (const child of children) ids.push(...getDescendants(child.id, cats))
      return ids
    }
    const allowedIds = getDescendants(selectedCategory, categories)
    return products.filter(p => p.category_id && allowedIds.includes(p.category_id))
  }, [products, selectedCategory, categories])

  const filteredProducts = React.useMemo(() => {
    let result = [...filteredByCategory]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }
    switch (activeFilter) {
      case "menor-precio": result.sort((a, b) => a.price - b.price); break
      case "mayor-precio": result.sort((a, b) => b.price - a.price); break
      case "descuento": result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price); break
    }
    return result
  }, [filteredByCategory, searchQuery, activeFilter])

  // Determine which products to show based on active tab
  const displayProducts = React.useMemo(() => {
    const isSectionTab = sections.some(s => s.id === activeTab)
    if (isSectionTab) {
      // For section tabs, apply search/filter on section products
      let result = [...sectionProducts]
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        result = result.filter(p => p.name.toLowerCase().includes(q))
      }
      switch (activeFilter) {
        case "menor-precio": result.sort((a, b) => a.price - b.price); break
        case "mayor-precio": result.sort((a, b) => b.price - a.price); break
        case "descuento": result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price); break
      }
      return result
    }
    return filteredProducts
  }, [activeTab, sections, sectionProducts, filteredProducts, searchQuery, activeFilter])

  // Get the current section if a section tab is active
  const activeSection = sections.find(s => s.id === activeTab)

  return (
    <div>
      {/* Active category chip (shown in content area when category is selected) */}
      {selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
          >
            <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
            <span className="text-orange-400 dark:text-orange-500">×</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div id="marketplace-products" className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-[53px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
          {allTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "font-bold text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-100"
                  : "font-medium text-zinc-500 border-transparent hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {activeTab === "todos" && (
          <div>
            {/* Search */}
            <StoreSearch
              productCount={filteredByCategory.length}
              onSearch={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Product grid — Temu-style responsive: 2 cols mobile → 6 cols on wide desktop */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 py-3 sm:py-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorited={favoriteIds.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isAuthenticated={isAuthenticated}
                    onCardClick={() => setSelectedProduct(product)}
                    showAddToCart={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section tabs content */}
        {sections.some(s => s.id === activeTab) && (
          <div>
            {/* Section banner */}
            {activeSection && (
              <div className="px-4 pt-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-800">
                  <h2 className="font-black text-lg">{activeSection.name}</h2>
                  {activeSection.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{activeSection.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Search */}
            <StoreSearch
              productCount={sectionProducts.length}
              onSearch={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Product grid */}
            {sectionLoading ? (
              <div className="py-16 text-center">
                <p className="text-zinc-400 font-medium">Cargando productos...</p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 py-3 sm:py-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorited={favoriteIds.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isAuthenticated={isAuthenticated}
                    onCardClick={() => setSelectedProduct(product)}
                    showAddToCart={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <p className="text-xs text-zinc-400 font-medium">
            © {new Date().getFullYear()} Un producto de <a href="https://januscore.pro" target="_blank" rel="noopener noreferrer" className="hover:underline text-orange-500 font-medium">Janus Core</a>
          </p>
          <LegalFooterLinks />
        </div>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        isFavorited={selectedProduct ? favoriteIds.includes(selectedProduct.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  )
}