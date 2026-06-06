"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TurnstileObject {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

interface CustomWindow extends Window {
  turnstile?: TurnstileObject;
}

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
}

export function Turnstile({ siteKey, onSuccess }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const renderTurnstile = () => {
      const customWindow = window as CustomWindow;
      if (customWindow.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          const id = customWindow.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onSuccess,
            "expired-callback": () => onSuccess(""),
            "error-callback": () => onSuccess(""),
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error("Turnstile render error:", err);
        }
      }
    };

    const customWindow = window as CustomWindow;
    if (customWindow.turnstile) {
      renderTurnstile();
    }

    return () => {
      const innerCustomWindow = window as CustomWindow;
      if (widgetIdRef.current && innerCustomWindow.turnstile) {
        try {
          innerCustomWindow.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (err) {
          console.error("Turnstile clean error:", err);
        }
      }
    };
  }, [siteKey, onSuccess]);

  return (
    <div className="flex justify-center my-4">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        onLoad={() => {
          if (typeof window !== "undefined") {
            const customWindow = window as CustomWindow;
            if (customWindow.turnstile && containerRef.current && !widgetIdRef.current) {
              try {
                const id = customWindow.turnstile.render(containerRef.current, {
                  sitekey: siteKey,
                  callback: onSuccess,
                  "expired-callback": () => onSuccess(""),
                  "error-callback": () => onSuccess(""),
                });
                widgetIdRef.current = id;
              } catch (err) {
                console.error("Turnstile load render error:", err);
              }
            }
          }
        }}
      />
      <div ref={containerRef} />
    </div>
  );
}
