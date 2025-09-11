"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { UserNotification } from "@/lib/types";

export function NotificationsDrawer({
  open,
  items,
  loading,
  onClose,
  onMarkRead,
  onMarkAll,
}: {
  open: boolean;
  items: UserNotification[];
  loading?: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void> | void;
  onMarkAll: () => Promise<void> | void;
}) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let t: any;
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setActive(true));
    } else {
      setActive(false);
      t = setTimeout(() => setMounted(false), 120);
    }
    return () => { if (t) clearTimeout(t); };
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {/* Click-away overlay (transparent) */}
      <div
        className={cn(
          "fixed inset-0 z-40",
          active ? "opacity-100" : "opacity-0",
          "cursor-pointer"
        )}
        onClick={onClose}
        role="button"
        aria-label="Close notifications"
      />

      <Card
        className={cn(
          "fixed z-50 overflow-visible",
          // positioned slightly below the bell (bell bottom at 4rem)
          "top-[4.6rem] right-6 w-80 sm:w-96 max-h-[70vh]",
          "bg-stone-900/95 backdrop-blur-md border border-stone-700/50 rounded-lg shadow-xl",
          "transition-all duration-100 origin-top-right",
          active ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95",
        )}
      >
        {/* Arrow pointing to the bell */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 right-16 w-4 h-4 rotate-45 bg-stone-900/95 border-t border-l border-stone-700/50 shadow-[0_0_0_1px_rgba(28,25,23,0.5)]"
        />

        <div className="p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-700/50">
            <div className="flex items-center gap-2 text-white">
              <Bell className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Notifications</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-stone-300 hover:text-white hover:bg-stone-800/50 cursor-pointer"
                onClick={onMarkAll}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                className="text-stone-300 hover:text-white hover:bg-stone-800/50"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '50vh' }}>
            {loading && (
              <p className="text-stone-400 text-sm">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="text-stone-400 text-sm">You're all caught up.</p>
            )}
            {items.map((n) => (
              <div key={n.id} className="p-3 rounded-md bg-stone-800/50 border border-stone-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-stone-400 text-xs mt-1">{n.body}</p>}
                    <p className="text-stone-500 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.readAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-cyan-300 hover:text-white hover:bg-stone-700/50 cursor-pointer"
                      onClick={() => onMarkRead(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              className="text-cyan-300 hover:text-white hover:bg-stone-800/50 cursor-pointer"
              onClick={() => { onClose(); router.push('/notifications'); }}
            >
              View all
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
