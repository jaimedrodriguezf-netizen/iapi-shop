"use client"

import * as React from "react"
import { Menu, ChevronRight, ChevronDown } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface Category {
  id: string
  name: string
  parent_id?: string | null
}

interface CategoryItemProps {
  category: Category
  depth: number
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
}

function CategoryItem({ category, depth, categories, selectedId, onSelect, onClose }: CategoryItemProps) {
  const children = categories.filter(c => c.parent_id === category.id)
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded)
          } else {
            onSelect(category.id)
            onClose()
          }
        }}
        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${
          selectedId === category.id ? 'text-orange-500 font-bold' : 'text-zinc-700 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <span className="truncate">{category.name}</span>
        {hasChildren && (
          expanded 
            ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        )}
      </button>
      {expanded && children.map(child => (
        <CategoryItem
          key={child.id}
          category={child}
          depth={depth + 1}
          categories={categories}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

interface MarketplaceHamburgerProps {
  categories: Category[]
  selectedCategoryId: string | null
  onCategorySelect: (id: string | null) => void
}

export function MarketplaceHamburger({ categories, selectedCategoryId, onCategorySelect }: MarketplaceHamburgerProps) {
  const [open, setOpen] = React.useState(false)

  const rootCategories = categories.filter(c => !c.parent_id)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 -ml-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        aria-label="Categorías"
      >
        <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg font-black">Categorías</SheetTitle>
          </SheetHeader>
          <div className="py-2 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => { onCategorySelect(null); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm font-bold border-b transition-colors ${
                !selectedCategoryId ? 'text-orange-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              🏷️ Todo
            </button>
            {rootCategories.map(cat => (
              <CategoryItem
                key={cat.id}
                category={cat}
                depth={0}
                categories={categories}
                selectedId={selectedCategoryId}
                onSelect={onCategorySelect}
                onClose={() => setOpen(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
