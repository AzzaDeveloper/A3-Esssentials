"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, Settings, LogOut, Bell, CreditCard, HelpCircle, Palette, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { clearServerSession } from "@/lib/session"
import { signOutUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
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

  return (
    <>
      {/* Profile Icon - positioned absolutely to separate from container */}
      <div className="fixed top-6 right-6 z-30">
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
            )}
            onClick={closeMenu}
            role="button"
            aria-label="Close overlay"
            className={cn("", "cursor-pointer")}
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
                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <Palette className="w-5 h-5 mr-3" />
                  Mood Preferences
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Billing & Plans
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Account Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/50 h-12 cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  Help & Support
                </Button>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-stone-700/50" />

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
              <div className="mt-8 pt-6 border-t border-stone-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded flex items-center justify-center">
                    <Palette className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white font-semibold text-sm">Task-ette</span>
                </div>
                <p className="text-stone-400 text-xs">Making work colorful, one task at a time</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
