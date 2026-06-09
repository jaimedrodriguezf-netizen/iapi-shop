"use client"

import * as React from "react"
import Image from "next/image"
import { MapPin, Phone, Share2, Info, BadgeCheck, MessageCircle, Store, ShieldCheck } from "lucide-react"
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import type { Tenant } from "@/lib/tenants/actions"

// Helper component for social icons (Instagram, Facebook, TikTok)
const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "instagram":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 8H7v3h2v9h3v-9h3.6L16 8h-3V6.7C13 5.8 13.3 5 14.5 5H16V2h-2.5C10.5 2 9 3.5 9 6.7V8z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86.95 2 1.63 3.25 1.95v3.91c-1.34-.14-2.61-.69-3.62-1.57-.65-.54-1.16-1.24-1.5-2.02v6.62c.03 2.07-.63 4.14-1.92 5.76-1.54 2-3.96 3.12-6.49 3.09-2.92.07-5.74-1.63-7.01-4.27-1.46-2.85-.98-6.47 1.17-8.8 1.83-2.05 4.7-2.88 7.33-2.12v4.02c-1.28-.46-2.73-.25-3.81.56-.99.71-1.53 1.93-1.4 3.15.11 1.48 1.22 2.76 2.7 2.99 1.52.27 3.09-.59 3.63-2.01.21-.51.29-1.07.28-1.62V.02z"/>
        </svg>
      );
    default:
      return <Share2 className="h-5 w-5" />;
  }
};

interface StorefrontHeaderProps {
  tenant: Tenant;
  formattedAddress: string | null;
  whatsappUrl: string;
}

export function StorefrontHeader({ tenant, formattedAddress, whatsappUrl }: StorefrontHeaderProps) {
  const brandColor = tenant.brand_color || "#7c3aed";
  
  // Privacy configuration with default value fallback (true)
  const showPhone = tenant.public_settings?.show_phone !== false;
  const showAddress = tenant.public_settings?.show_address !== false;
  const showSocialLinks = tenant.public_settings?.show_social_links !== false;

  return (
    <div className="bg-white dark:bg-zinc-900 border-b sticky top-0 z-30 shadow-sm transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left/Center Info: Logo + Name + Verified Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-sm relative shrink-0 flex items-center justify-center font-black"
            style={{ color: brandColor }}
          >
            {tenant.logo_url ? (
              <Image 
                src={tenant.logo_url} 
                alt={tenant.name} 
                fill 
                sizes="40px" 
                priority={true} 
                className="object-cover" 
              />
            ) : (
              tenant.name[0]
            )}
          </div>
          <div className="min-w-0 flex items-center gap-1.5">
            <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {tenant.name}
            </h1>
            <span title="Verificado" className="inline-flex items-center">
              <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            </span>
          </div>
        </div>

        {/* Right Info: Info Button opening the Seller Drawer */}
        <Drawer>
          <DrawerTrigger render={
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 active:scale-95 transition-all shadow-xs hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] cursor-pointer select-none"
              style={{ "--brand-color": brandColor } as React.CSSProperties}
              aria-label="Información del vendedor"
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span>Info Tienda</span>
            </button>
          } />
          
          <DrawerContent className="rounded-t-3xl max-h-[85vh] p-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto w-full max-w-md">
              {/* Verified Ribbon Banner */}
              <div className="w-full bg-emerald-500/10 dark:bg-emerald-500/5 border-b border-emerald-500/20 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 rounded-t-3xl">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Comercio Verificado • Compra Segura</span>
              </div>

              <DrawerHeader className="border-b dark:border-zinc-800/80 pb-5 text-center relative overflow-hidden bg-gradient-to-b from-[var(--brand-color)]/5 to-transparent pt-6" style={{ "--brand-color": brandColor } as React.CSSProperties}>
                <div 
                  className="mx-auto h-16 w-16 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-md relative flex items-center justify-center text-xl font-black mb-2"
                  style={{ color: brandColor }}
                >
                  {tenant.logo_url ? (
                    <Image 
                      src={tenant.logo_url} 
                      alt={tenant.name} 
                      fill 
                      sizes="64px" 
                      className="object-cover" 
                    />
                  ) : (
                    tenant.name[0]
                  )}
                </div>
                <DrawerTitle className="text-xl font-black flex items-center justify-center gap-1.5 text-zinc-900 dark:text-zinc-50">
                  {tenant.name}
                  <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                </DrawerTitle>
                <DrawerDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Datos de contacto y ubicación oficial
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-6 space-y-5">
                {/* 1. Contact phone / WhatsApp card if enabled */}
                {showPhone && tenant.whatsapp_phone && (
                  <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Contacto Directo
                      </h4>
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        {tenant.whatsapp_phone}
                      </span>
                    </div>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full rounded-xl text-white font-black px-6 py-3 shadow-md hover:brightness-105 active:scale-[0.98] inline-flex items-center justify-center gap-2 transition-all text-sm cursor-pointer select-none hover:shadow-lg"
                      style={{ backgroundColor: brandColor }}
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" /> 
                      <span>Chatear por WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* 2. Physical Address card if enabled */}
                {showAddress && formattedAddress && (
                  <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 space-y-2.5 shadow-xs">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Ubicación de la Sucursal
                    </h4>
                    <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 shrink-0 shadow-xs">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="leading-relaxed font-semibold">{formattedAddress}</span>
                    </div>
                  </div>
                )}

                {/* 3. Social Media Links grid if enabled */}
                {showSocialLinks && tenant.social_links && (tenant.social_links.instagram || tenant.social_links.facebook || tenant.social_links.tiktok) && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
                      Nuestras Redes
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      {tenant.social_links.instagram && (
                        <a 
                          href={tenant.social_links.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-pink-100 dark:border-pink-950/20 bg-pink-50/10 hover:bg-pink-50/30 dark:hover:bg-pink-950/10 text-pink-600 dark:text-pink-400 transition-all hover:scale-102 hover:shadow-xs group/social cursor-pointer"
                        >
                          <SocialIcon platform="instagram" />
                          <span className="text-[9px] font-bold mt-1.5 uppercase tracking-wider opacity-85 group-hover/social:opacity-100">Instagram</span>
                        </a>
                      )}
                      {tenant.social_links.facebook && (
                        <a 
                          href={tenant.social_links.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-blue-100 dark:border-blue-950/20 bg-blue-50/10 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 text-blue-600 dark:text-blue-400 transition-all hover:scale-102 hover:shadow-xs group/social cursor-pointer"
                        >
                          <SocialIcon platform="facebook" />
                          <span className="text-[9px] font-bold mt-1.5 uppercase tracking-wider opacity-85 group-hover/social:opacity-100">Facebook</span>
                        </a>
                      )}
                      {tenant.social_links.tiktok && (
                        <a 
                          href={tenant.social_links.tiktok} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 transition-all hover:scale-102 hover:shadow-xs group/social cursor-pointer"
                        >
                          <SocialIcon platform="tiktok" />
                          <span className="text-[9px] font-bold mt-1.5 uppercase tracking-wider opacity-85 group-hover/social:opacity-100">TikTok</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Fallback if all options are disabled/missing */}
                {(!showPhone || !tenant.whatsapp_phone) && (!showAddress || !formattedAddress) && (!showSocialLinks || !tenant.social_links || (!tenant.social_links.instagram && !tenant.social_links.facebook && !tenant.social_links.tiktok)) && (
                  <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 italic font-medium">
                      No hay información pública disponible de este vendedor.
                    </p>
                  </div>
                )}
              </div>

              <DrawerFooter className="border-t dark:border-zinc-850 p-6 bg-zinc-50/50 dark:bg-zinc-900/10">
                <DrawerClose render={
                  <Button variant="ghost" className="w-full rounded-xl font-black text-zinc-500 dark:text-zinc-400 py-6 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    Cerrar
                  </Button>
                } />
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
