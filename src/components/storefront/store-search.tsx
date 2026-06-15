"use client"

import * as React from "react"
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react"

interface StoreSearchProps {
  productCount: number
  onSearch: (query: string) => void
  activeFilter: string
  onFilterChange: (filter: string) => void
}

const FILTER_OPTIONS = [
  { key: "todos", label: "Todos" },
  { key: "menor-precio", label: "Menor precio" },
  { key: "mayor-precio", label: "Mayor precio" },
  { key: "descuento", label: "Con descuento" },
]

export function StoreSearch({ productCount, onSearch, activeFilter, onFilterChange }: StoreSearchProps) {
  const [searchValue, setSearchValue] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchValue(val)
    onSearch(val)
  }

  const currentFilter = FILTER_OPTIONS.find(f => f.key === activeFilter)?.label || "Todos"

  return (
    <div className="px-3 sm:px-4 py-3 space-y-3">
      {/* Search pill */}
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder={`Buscar entre los ${productCount} artículos...`}
          className="w-full h-10 pl-4 pr-10 text-sm bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between">
        {/* Filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            {currentFilter} ({activeFilter === "todos" ? productCount : "..."})
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-30 min-w-[150px]">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    onFilterChange(option.key)
                    setShowFilters(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                    activeFilter === option.key
                      ? "text-teal-600 dark:text-teal-400 font-bold"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {option.label} {option.key === "todos" ? `(${productCount})` : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings/filter icon */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
    </div>
  )
}