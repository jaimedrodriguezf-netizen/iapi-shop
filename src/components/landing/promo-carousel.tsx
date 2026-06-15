"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface Banner {
  id: string
  title: string
  subtitle?: string | null
  cta_text?: string | null
  cta_href?: string | null
  image_url?: string | null
  bg_color: string
}

interface PromoCarouselProps {
  banners: Banner[]
}

export function PromoCarousel({ banners }: PromoCarouselProps) {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (banners.length === 0) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (banners.length === 0) return null

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length)
  const next = () => setCurrent(c => (c + 1) % banners.length)
  const banner = banners[current]

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "200px" }}>
      {/* Background color */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: banner.bg_color }}
      />

      {/* Background image */}
      {banner.image_url && (
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover opacity-40"
          sizes="100vw"
          priority
        />
      )}

      {/* Content */}
      <div className="relative px-6 sm:px-12 py-10 sm:py-16 flex flex-col justify-center min-h-[200px] sm:min-h-[280px] max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 drop-shadow-sm">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="text-sm sm:text-lg text-white/85 mb-5 max-w-lg drop-shadow-sm">
            {banner.subtitle}
          </p>
        )}
        {banner.cta_text && (
          <a
            href={banner.cta_href || "#"}
            className="inline-flex items-center bg-white text-zinc-800 font-bold px-6 py-3 rounded-full text-sm hover:bg-zinc-50 transition-colors w-fit shadow-lg"
          >
            {banner.cta_text}
          </a>
        )}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current ? "w-7 bg-white" : "w-2.5 bg-white/50"
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}