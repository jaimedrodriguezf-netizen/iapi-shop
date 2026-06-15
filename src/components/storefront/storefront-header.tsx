"use client"

import * as React from "react"
import { Menu, Search, User, ShoppingBag, ChevronRight, ChevronDown } from "lucide-react"
import { useCart } from "@/lib/storefront/cart-store"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type CategoryData = { id: string; name: string; parent_id?: string | null }

function buildCategoryTree(categories: CategoryData[]) {
  const roots = categories.filter(c => !c.parent_id)
  return { roots }
}

function CategoryItem({ 
  category, depth, allCategories, selectedId, onSelect 
}: { 
  category: CategoryData
  depth: number
  allCategories: CategoryData[]
  selectedId: string | null
  onSelect: (id: string | null) => void 
}) {
  const [expanded, setExpanded] = React.useState(false)
  const children = allCategories.filter(c => c.parent_id === category.id)
  const hasChildren = children.length > 0
  const isSelected = selectedId === category.id

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    } else {
      onSelect(category.id)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${
          isSelected ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <span>{category.name}</span>
        {hasChildren && (
          expanded 
            ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            : <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>
      {expanded && children.map(child => (
        <CategoryItem 
          key={child.id}
          category={child} 
          depth={depth + 1}
          allCategories={allCategories}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface StorefrontHeaderProps {
  tenantName: string
  tenantId: string
  brandColor?: string
  categories?: CategoryData[]
  selectedCategoryId?: string | null
  onCategorySelect?: (categoryId: string | null) => void
}

export function StorefrontHeader({ tenantName, tenantId, brandColor = "#f97316", categories = [], selectedCategoryId = null, onCategorySelect }: StorefrontHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const getTenantItems = useCart((state) => state.getTenantItems)
  const itemCount = getTenantItems(tenantId).length

  const { roots } = React.useMemo(() => buildCategoryTree(categories), [categories])

  const handleCategorySelect = React.useCallback((id: string | null) => {
    onCategorySelect?.(id)
    setMenuOpen(false)
  }, [onCategorySelect])

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center gap-3">
          {/* Hamburger menu */}
          <button 
            aria-label="Menu" 
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          </button>

          {/* Logo / Store name */}
          <Link href={`/${tenantId}`} className="font-black text-base tracking-tight flex-shrink-0" style={{ color: brandColor }}>
            {tenantName}
          </Link>

          {/* Search bar - expansive */}
          <div className="flex-1 flex items-center gap-0 min-w-0">
            <div className={`flex items-center flex-1 transition-all duration-300 ${searchOpen ? 'flex' : 'hidden sm:flex'}`}>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full h-9 px-3 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-l-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-400 min-w-0"
              />
              <button 
                className="h-9 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-r-lg flex items-center justify-center flex-shrink-0 transition-colors"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            {/* Mobile search toggle */}
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-auto"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          {/* User icon */}
          <Link href="/login" className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
            <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>

          {/* Cart icon with badge */}
          <div className="relative flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Category drawer */}
      <Sheet open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-zinc-100 dark:border-zinc-800">
            <SheetTitle>Categorías</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                selectedCategoryId === null ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Todo
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
            {roots.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                depth={0}
                allCategories={categories}
                selectedId={selectedCategoryId}
                onSelect={handleCategorySelect}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}