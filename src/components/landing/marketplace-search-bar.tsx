"use client"

import * as React from "react"
import { Search } from "lucide-react"

export function MarketplaceSearchBar() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex-1 flex items-center justify-center gap-0 max-w-md mx-3">
      <div className={`flex items-center flex-1 transition-all duration-300 ${open ? 'flex' : 'hidden sm:flex'}`}>
        <input
          type="text"
          placeholder="Buscar productos..."
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
        onClick={() => setOpen(!open)}
        className="sm:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5 text-zinc-500" />
      </button>
    </div>
  )
}
