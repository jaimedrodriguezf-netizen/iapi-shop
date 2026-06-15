"use client"

import * as React from "react"
import { StorefrontProductGrid } from "@/components/storefront/storefront-product-grid"
import { Section, getSectionProducts } from "@/lib/sections/actions"

interface TenantInfo {
  name: string
  whatsapp_phone?: string
  address?: string | null
  social_links?: { instagram?: string; facebook?: string; tiktok?: string } | null
  public_settings?: { show_phone?: boolean; show_address?: boolean; show_social_links?: boolean } | null
}

interface StorefrontTabsProps {
  products: Array<{ id: string; name: string; price: number; compare_at_price?: number | null; image_urls?: string[]; category_id?: string }>
  tenantId: string
  brandColor: string
  secondaryColor?: string
  whatsappPhone?: string
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  isAuthenticated: boolean
  tenantInfo?: TenantInfo
  sections?: Section[]
}

export function StorefrontTabs({ 
  products, tenantId, brandColor, secondaryColor,
  favoriteIds, onToggleFavorite, isAuthenticated, tenantInfo, sections
}: StorefrontTabsProps) {
  const [activeTab, setActiveTab] = React.useState<string>("todos")
  const [sectionProducts, setSectionProducts] = React.useState<Array<{ id: string; name: string; price: number; compare_at_price?: number | null; image_urls?: string[]; category_id?: string }>>([])
  const [loadingSection, setLoadingSection] = React.useState(false)

  // Build tabs: "Todos" + dynamic sections + "Info"
  const allTabs = React.useMemo(() => {
    const tabs: { key: string; label: string }[] = [
      { key: "todos", label: "Artículos" },
    ]
    
    if (sections) {
      for (const s of sections) {
        tabs.push({ key: s.id, label: s.name })
      }
    }
    
    tabs.push({ key: "info", label: "Info" })
    return tabs
  }, [sections])

  // Fetch section products when a section tab is selected
  React.useEffect(() => {
    if (!activeTab || activeTab === "todos" || activeTab === "info") {
      return
    }
    
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag before async fetch is the standard pattern
    setLoadingSection(true)
    getSectionProducts(activeTab).then(result => {
      if (cancelled) return
      if (result.success && result.data) {
        setSectionProducts(
          result.data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            compare_at_price: p.compare_at_price,
            image_urls: p.image_urls,
            category_id: undefined,
          }))
        )
      }
      setLoadingSection(false)
    })
    return () => { cancelled = true }
  }, [activeTab])

  // Determine which products to show
  const displayProducts = activeTab === "todos" || activeTab === "info" 
    ? products 
    : sectionProducts

  return (
    <div>
      {/* Tab buttons */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-[53px] z-20">
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {allTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm transition-all border-b-2 ${
                activeTab === tab.key
                  ? "font-bold text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-100"
                  : "font-medium text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto">
        {/* Section banner */}
        {activeTab !== "todos" && activeTab !== "info" && sections && (
          (() => {
            const section = sections.find(s => s.id === activeTab)
            if (!section) return null
            return (
              <div className="px-4 pt-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-800">
                  <h3 className="font-black text-lg">{section.name}</h3>
                  {section.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{section.description}</p>
                  )}
                </div>
              </div>
            )
          })()
        )}

        {/* Loading spinner */}
        {loadingSection && (
          <div className="py-12 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        )}

        {activeTab === "todos" && (
          <StorefrontProductGrid
            products={displayProducts}
            tenantId={tenantId}
            brandColor={brandColor}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            isAuthenticated={isAuthenticated}
          />
        )}

        {activeTab === "info" && tenantInfo && (
          <div className="p-4 space-y-4">
            {tenantInfo.whatsapp_phone && (
              <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">WhatsApp</p>
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{tenantInfo.whatsapp_phone}</p>
              </div>
            )}
            {tenantInfo.address && (
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Dirección</p>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {typeof tenantInfo.address === 'string' ? tenantInfo.address : JSON.stringify(tenantInfo.address)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section products (dynamic tabs) */}
        {activeTab !== "todos" && activeTab !== "info" && !loadingSection && (
          <StorefrontProductGrid
            products={displayProducts}
            tenantId={tenantId}
            brandColor={brandColor}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  )
}