"use client"

import { useEffect, useState, type ComponentType } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, Users, Settings, LogOut, CreditCard, HelpCircle, Palette, X, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { clearServerSession } from "@/lib/session"
import { signOutUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notifications/bell-button"
import { NotificationsDrawer } from "@/components/notifications/drawer"
import { useNotifications, useUnreadNotifications } from "@/hooks/use-notifications"

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const name = user?.displayName || user?.email?.split("@")[0] || "Guest"
  const email = user?.email || ""

  function openMenu() {
    setIsOpen(true)
    // allow mount before activating transition
    requestAnimationFrame(() => setIsActive(true))
  }

  function closeMenu() {
    setIsActive(false)
    // wait for transition to finish before unmount
    setTimeout(() => setIsOpen(false), 200)
  }

  function toggleMenu() {
    if (isOpen) closeMenu(); else openMenu();
  }

  function openNotif() { setIsNotifOpen(true) }
  function closeNotif() { setIsNotifOpen(false) }

  function toggleNotif() {
    if (isNotifOpen) closeNotif(); else openNotif();
  }

  async function handleSignOut() {
    try {
      await clearServerSession()
    } catch {}
    try {
      await signOutUser()
    } catch {}
    closeMenu()
    router.push("/login")
  }

  const menuItems: { label: string; icon: ComponentType<{ className?: string }>; href?: string }[] = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Profile", icon: User, href: "/profile" },
    { label: "Teams", icon: Users, href: "/teams" },
    { label: "Billing & Plans", icon: CreditCard, href: "/billing" },
    { label: "Account Settings", icon: Settings, href: "/settings" },
    { label: "Help & Support", icon: HelpCircle, href: "/help" },
  ]

  // Live unread indicator via hook
  const unread = useUnreadNotifications(user?.uid)
  const { items: notifs, loading: loadingNotifs } = useNotifications(user?.uid, 10, isNotifOpen)
  useEffect(() => { setHasUnread(!!unread) }, [unread])

  return (
    <>
      {/* Floating action buttons (Notifications + Profile) */}
      <div className="fixed top-6 right-6 z-30 flex items-center gap-3">
        {user && <NotificationBell hasUnread={hasUnread} onClick={toggleNotif} />}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 p-0 border-0 cursor-pointer"
        >
          <User className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Sidebar - completely independent positioning */}
      {isOpen && (
        <>
          {/* Close (X) button at same spot as trigger */}
          <div className="fixed top-6 right-6 z-[60]">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMenu}
              aria-label="Close profile menu"
              className="w-10 h-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div
            className={cn(
              "fixed inset-0 z-40 transition-opacity duration-200",
              "backdrop-blur-sm bg-black/20",
              isActive ? "opacity-100" : "opacity-0",
              cn("", "cursor-pointer")
            )}
            onClick={closeMenu}
            role="button"
            aria-label="Close overlay"
          />

          <Card
            className={cn(
              "fixed top-0 right-0 h-full z-50 overflow-y-auto",
              // mobile full-width, desktop fixed width
              "w-full sm:w-80",
              "bg-stone-900/95 backdrop-blur-md border-l border-stone-700/50 rounded-none",
              "transition-transform transition-opacity duration-200",
              isActive ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            )}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-stone-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{name}</h3>
                  {email ? (
                    <p className="text-stone-400 text-sm">{email}</p>
                  ) : (
                    <p className="text-stone-500 text-xs">Not signed in</p>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {menuItems.map(({ label, icon: Icon, href }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                    onClick={() => {
                      if (href) {
                        closeMenu()
                        router.push(href)
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-6 h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />

              {/* Auth action */}
              {user ? (
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12",
                    "text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer",
                  )}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    closeMenu();
                    router.push("/login");
                  }}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12",
                    "text-cyan-300 hover:text-white hover:bg-stone-800/50 cursor-pointer",
                  )}
                >
                  <User className="w-5 h-5 mr-3" />
                  Sign In
                </Button>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6">
                <div className="mb-4 h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />
                <Link href="/" className="flex items-center gap-2 mb-2 group">
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded flex items-center justify-center">
                    <Palette className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white font-semibold text-sm group-hover:underline">Task-ette</span>
                </Link>
                <p className="text-stone-400 text-xs">Making work colorful, one task at a time</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {user && (
        <NotificationsDrawer
          open={isNotifOpen}
          items={notifs as any}
          loading={loadingNotifs}
          onClose={closeNotif}
          onMarkAll={async () => {
            try { await fetch('/api/users/me/notifications/mark-all-read', { method: 'POST' }) } catch {}
            setHasUnread(false)
            closeNotif()
          }}
          onMarkRead={async (id: string) => {
            try { await fetch(`/api/users/me/notifications/${id}`, { method: 'PATCH' }) } catch {}
          }}
        />
      )}
    </>
  )
}
