import * as React from "react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("shrink-0", className)}
      height="1.2em"
      viewBox="0 0 140 40" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <text 
        x="50%" 
        y="26" 
        dominantBaseline="alphabetic" 
        textAnchor="middle" 
        fill="#f97316" 
        fontWeight="900" 
        fontSize="32" 
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        TENDDY
      </text>
      <text 
        x="51%" 
        y="40" 
        dominantBaseline="alphabetic" 
        textAnchor="middle" 
        fill="#fb923c" 
        fontWeight="900" 
        fontSize="11" 
        fontFamily="ui-sans-serif, system-ui, sans-serif" 
        letterSpacing="0.1em"
      >
        SHOP
      </text>
    </svg>
  )
}
