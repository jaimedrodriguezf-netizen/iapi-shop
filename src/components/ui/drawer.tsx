"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Drawer({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root {...props} />
}

function DrawerTrigger({ 
  render,
  ...props 
}: SheetPrimitive.Trigger.Props & { render?: React.ReactNode }) {
  return <SheetPrimitive.Trigger data-slot="drawer-trigger" render={render} {...props} />
}

function DrawerClose({ 
  render,
  ...props 
}: SheetPrimitive.Close.Props & { render?: React.ReactNode }) {
  return <SheetPrimitive.Close data-slot="drawer-close" render={render} {...props} />
}

function DrawerPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  side = "bottom",
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <SheetPrimitive.Popup
        data-slot="drawer-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col bg-background transition-transform duration-200 ease-in-out data-[ending-style]:data-[side=bottom]:translate-y-full data-[ending-style]:data-[side=left]:-translate-x-full data-[ending-style]:data-[side=right]:translate-x-full data-[ending-style]:data-[side=top]:-translate-y-full data-[starting-style]:data-[side=bottom]:translate-y-full data-[starting-style]:data-[side=left]:-translate-x-full data-[starting-style]:data-[side=right]:translate-x-full data-[starting-style]:data-[side=top]:-translate-y-full",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto max-h-[80vh] rounded-t-3xl border-t",
          side === "top" &&
            "inset-x-0 top-0 h-auto max-h-[80vh] rounded-b-3xl border-b",
          side === "left" && "inset-y-0 left-0 h-full w-80 rounded-r-3xl border-r",
          side === "right" &&
            "inset-y-0 right-0 h-full w-80 rounded-l-3xl border-l",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute right-4 top-4 rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          render={<Button variant="ghost" size="icon" />}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("grid gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-6", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
