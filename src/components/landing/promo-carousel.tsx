"use client"

import * as React from "react"
import Link from "next/link"
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

  const ctaHref = banner.cta_href || "#"
  const isInternal = ctaHref.startsWith("/")

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "240px" }}>
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

      {/* Content — Temu-style: oversized typography, full feel */}
      <div className="relative px-6 sm:px-12 lg:px-20 py-12 sm:py-20 lg:py-24 flex flex-col justify-center min-h-[240px] sm:min-h-[360px] lg:min-h-[440px] max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 drop-shadow-md max-w-2xl">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="text-base sm:text-xl lg:text-2xl text-white/90 mb-6 max-w-xl drop-shadow-sm">
            {banner.subtitle}
          </p>
        )}
        {banner.cta_text && isInternal && (
          <Link
            href={ctaHref}
            className="inline-flex items-center bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl text-base sm:text-lg hover:bg-orange-600 transition-colors w-fit shadow-xl"
          >
            {banner.cta_text}
          </Link>
        )}
        {banner.cta_text && !isInternal && (
          <a
            href={ctaHref}
            className="inline-flex items-center bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl text-base sm:text-lg hover:bg-orange-600 transition-colors w-fit shadow-xl"
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