"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search, User, Bell, Heart, ShoppingBag, ChevronRight, ChevronDown } from "lucide-react"
import { NotificationBell } from "@/components/landing/notification-bell"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/lib/storefront/cart-store"
import { ProfilePopover } from "@/components/landing/profile-popover"

export const COUNTRIES = [
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
]

interface Category {
  id: string
  name: string
  parent_id?: string | null
}

function CategoryItem({ category, depth, categories, selectedId, onSelect, onClose }: {
  category: Category
  depth: number
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
}) {
  const children = categories.filter(c => c.parent_id === category.id)
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          else { onSelect(category.id); onClose() }
        }}
        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${
          selectedId === category.id ? 'text-orange-500 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <span className="truncate">{category.name}</span>
        {hasChildren && (expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />)}
      </button>
      {expanded && children.map(child => (
        <CategoryItem key={child.id} category={child} depth={depth + 1} categories={categories} selectedId={selectedId} onSelect={onSelect} onClose={onClose} />
      ))}
    </div>
  )
}

interface MarketplaceHeaderProps {
  siteLogo: string | null
  siteName: string
  categories: Category[]
  selectedCategoryId: string | null
  onCategorySelect: (id: string | null) => void
  isAuthenticated: boolean
  hasTenant: boolean
  favoriteCount: number
  country: string
  onCountryChange: (code: string) => void
  userEmail: string
  canCreateStore: boolean
  tenantSlug?: string
  avatarUrl?: string | null
}

export function MarketplaceHeader({
  siteLogo, siteName, categories, selectedCategoryId, onCategorySelect,
  isAuthenticated, hasTenant, favoriteCount, country, onCountryChange,
  userEmail, canCreateStore, tenantSlug, avatarUrl
}: MarketplaceHeaderProps) {
  const [catOpen, setCatOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [countryOpen, setCountryOpen] = React.useState(false)

  const carts = useCart(s => s.carts)
  const totalCartItems = Object.values(carts).reduce((sum, items) => sum + items.reduce((s, i) => s + i.quantity, 0), 0)

  const currentCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]
  const rootCategories = categories.filter(c => !c.parent_id)

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center gap-2.5">
        {/* ☰ Categorías */}
        <button onClick={() => setCatOpen(true)} className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} aria-label="Categorías">
          <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {/* Logo — hide on mobile when search open */}
        <Link href="/" className={`shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`}>
          {siteLogo ? (
            <Image src={siteLogo} alt={siteName} width={32} height={32} className="h-8 w-auto rounded" />
          ) : (
            <span className="leading-none text-center">
              <span className="block font-black text-lg text-orange-500">IAPI</span>
              <span className="block font-black text-[8px] text-orange-400 tracking-[0.2em] uppercase text-center -mt-1">shop</span>
            </span>
          )}
        </Link>

        {/* 🇪🇨 Ecuador */}
        <span className={`text-lg leading-none shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} title="Ecuador">🇪🇨</span>

        {/* 🔍 Buscador */}
        <div className="flex-1 flex items-center gap-0 min-w-0">
          <div className={`flex items-center flex-1 ${searchOpen ? 'flex' : 'hidden sm:flex'}`}>
            <input type="text" placeholder="Buscar productos..." className="w-full h-10 px-3 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-l-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-400 min-w-0" />
            <button className="h-10 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-r-lg shrink-0" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
          </div>
          {/* Mobile search toggle — hidden when search is open */}
          <button onClick={() => setSearchOpen(true)} className={`sm:hidden p-1.5 ml-auto shrink-0 ${searchOpen ? 'hidden' : ''}`} aria-label="Buscar">
            <Search className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </button>
          {/* Close search button — only on mobile when open */}
          {searchOpen && (
            <button onClick={() => setSearchOpen(false)} className="sm:hidden p-1.5 ml-1 shrink-0 text-zinc-500 dark:text-zinc-400" aria-label="Cerrar búsqueda">
              ✕
            </button>
          )}
        </div>

        {/* 🔔 Notificaciones */}
        {isAuthenticated ? (
          <NotificationBell className={`shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} />
        ) : (
          <Link href="/login" className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} title="Iniciar sesión">
            <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
        )}

        {/* 👤 Perfil */}
        {isAuthenticated ? (
          <ProfilePopover
            email={userEmail}
            hasTenant={hasTenant}
            canCreateStore={canCreateStore}
            tenantSlug={tenantSlug}
            avatarUrl={avatarUrl}
            className={`shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`}
          />
        ) : (
          <Link href="/login" className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} title="Iniciar sesión">
            <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
        )}

        {/* ❤️ Favoritos */}
        <Link href={isAuthenticated ? "/perfil" : "/login"} className={`relative p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`} title="Favoritos">
          <Heart className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {favoriteCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{favoriteCount > 9 ? "9+" : favoriteCount}</span>
          )}
        </Link>

        {/* 🛒 Carrito */}
        <div className={`relative p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${searchOpen ? 'hidden sm:block' : ''}`}>
          <ShoppingBag className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {totalCartItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">{totalCartItems > 9 ? "9+" : totalCartItems}</span>
          )}
        </div>
      </div>

      {/* Category Sheet */}
      <Sheet open={catOpen} onOpenChange={setCatOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b dark:border-zinc-800"><SheetTitle className="text-lg font-black">Categorías</SheetTitle></SheetHeader>
          <div className="py-2 max-h-[80vh] overflow-y-auto">
            <button onClick={() => { onCategorySelect(null); setCatOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm font-bold border-b dark:border-zinc-800 ${!selectedCategoryId ? 'text-orange-500' : 'text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
              🏷️ Todo
            </button>
            {rootCategories.map(cat => (
              <CategoryItem key={cat.id} category={cat} depth={0} categories={categories} selectedId={selectedCategoryId} onSelect={onCategorySelect} onClose={() => setCatOpen(false)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}