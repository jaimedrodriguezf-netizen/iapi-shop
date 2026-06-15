import Image from "next/image"
import { MapPin, Star, Heart, MessageCircle, Clock } from "lucide-react"

interface SellerHeroProps {
  tenantName: string
  tenantSlug?: string
  description?: string
  address?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  stats: {
    rating: string
    ratingCount: string
    sales: string
    age: string
  }
  lastActive?: string
}

export function SellerHero({
  tenantName, description, address, logoUrl, stats, lastActive
}: SellerHeroProps) {
  return (
    <div className="w-full">
      {/* Banner + Avatar section */}
      <div className="relative h-32 sm:h-40 w-full bg-teal-700 overflow-hidden">
        {/* Banner image or solid color */}
        <div className="absolute inset-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={tenantName}
              fill
              className="object-cover opacity-30 blur-sm scale-110"
              sizes="100vw"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-teal-700/80" />
        </div>

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10" />
        </div>

        {/* Avatar - overlapping bottom */}
        <div className="absolute -bottom-8 left-4 sm:left-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white bg-teal-600 overflow-hidden shadow-lg">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={tenantName}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white text-2xl font-black">
                {tenantName[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info section with teal background */}
      <div className="bg-teal-700 text-white px-4 sm:px-6 pt-12 pb-4 relative">
        {/* Floating action buttons - top right */}
        <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
          <button className="flex items-center gap-1.5 bg-white text-zinc-800 rounded-full px-3 py-1.5 text-xs font-bold shadow-md hover:bg-zinc-50 transition-colors">
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            <span>{stats.ratingCount}</span>
          </button>
          <button className="flex items-center justify-center bg-white text-zinc-600 rounded-full h-8 w-8 shadow-md hover:bg-zinc-50 transition-colors">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Store name */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {tenantName}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-sm text-teal-100 mt-1.5 line-clamp-2 leading-relaxed max-w-md">
            {description}
          </p>
        )}

        {/* Location and activity */}
        <div className="flex items-center gap-3 mt-2 text-xs text-teal-200">
          {address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {address}
            </span>
          )}
          {lastActive && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastActive}
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-teal-600/50 text-xs text-teal-200">
          <span className="flex items-center gap-1 font-medium">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {stats.rating} <span className="text-teal-300">({stats.ratingCount})</span>
          </span>
          <span className="text-teal-400">|</span>
          <span className="font-medium">{stats.sales} ventas</span>
          <span className="text-teal-400">|</span>
          <span className="font-medium">{stats.age}</span>
        </div>
      </div>
    </div>
  )
}