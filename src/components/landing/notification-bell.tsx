"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from "@/lib/notifications/actions"

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false)
  const [unread, setUnread] = React.useState(0)
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  const fetchData = React.useCallback(async () => {
    const [countResult, notifs] = await Promise.all([getUnreadCount(), getNotifications()])
    setUnread(countResult)
    if (notifs.success && notifs.data) setNotifications(notifs.data)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [countResult, notifs] = await Promise.all([getUnreadCount(), getNotifications()])
      if (cancelled) return
      setUnread(countResult)
      if (notifs.success && notifs.data) setNotifications(notifs.data)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setUnread(prev => Math.max(0, prev - 1))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchData() }}
        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl shadow-xl z-50 overflow-hidden max-w-lg mx-auto sm:mx-0">
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
              <h3 className="font-black text-sm">Notificaciones</h3>
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-bold text-orange-500 hover:text-orange-600">
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-zinc-800 last:border-0 ${
                      !n.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-orange-500' : 'bg-transparent'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return "ahora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}