"use client"

import * as React from "react"
import { MarketplaceHeader } from "@/components/landing/marketplace-header"
import { MarketplaceClient } from "@/components/landing/marketplace-client"
import { PromoCarousel } from "@/components/landing/promo-carousel"
import { Section } from "@/lib/sections/actions"

interface Banner {
  id: string
  title: string
  subtitle?: string | null
  cta_text?: string | null
  cta_href?: string | null
  image_url?: string | null
  bg_color: string
}

interface MarketplaceProduct {
  id: string
  name: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
  category_name?: string | null
  category_id?: string | null
}

interface Category {
  id: string
  name: string
  parent_id: string | null
}

interface MarketplacePageProps {
  siteLogo: string | null
  siteName: string
  banners: Banner[]
  products: MarketplaceProduct[]
  tenantCount: number
  categories: Category[]
  sections: Section[]
  isAuthenticated: boolean
  hasTenant: boolean
  userEmail?: string
  canCreateStore?: boolean
  tenantSlug?: string
  avatarUrl?: string | null
}

export function MarketplacePage({ siteLogo, siteName, banners, products, tenantCount, categories, sections, isAuthenticated, hasTenant, userEmail, canCreateStore, tenantSlug, avatarUrl }: MarketplacePageProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [country, setCountry] = React.useState("EC")

  return (
    <>
      <MarketplaceHeader
        siteLogo={siteLogo}
        siteName={siteName}
        categories={categories}
        selectedCategoryId={selectedCategory}
        onCategorySelect={setSelectedCategory}
        isAuthenticated={isAuthenticated}
        hasTenant={hasTenant}
        favoriteCount={0}
        country={country}
        onCountryChange={setCountry}
        userEmail={userEmail || ""}
        canCreateStore={canCreateStore || false}
        tenantSlug={tenantSlug}
        avatarUrl={avatarUrl}
      />
      <PromoCarousel banners={banners} />
      <MarketplaceClient
        products={products}
        tenantCount={tenantCount}
        categories={categories}
        selectedCategoryId={selectedCategory}
        onCategorySelect={setSelectedCategory}
        sections={sections}
      />
    </>
  )
}