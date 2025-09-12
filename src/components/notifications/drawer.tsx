"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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

  function levelBar(level?: string) {
    const cls =
      level === "success"
        ? "from-emerald-500 to-green-500"
        : level === "warning"
          ? "from-amber-500 to-orange-500"
          : level === "error"
            ? "from-rose-500 to-red-500"
            : "from-sky-500 to-cyan-500";
    return <span className={cn("absolute left-0 top-0 h-full w-1.5 rounded-l-sm bg-gradient-to-b", cls)} />
  }

  function levelBadge(level?: string) {
    if (!level) return null;
    const cls =
      level === "success"
        ? "bg-emerald-600/25 text-emerald-200 border-emerald-700/60"
        : level === "warning"
          ? "bg-amber-600/25 text-amber-200 border-amber-700/60"
          : level === "error"
            ? "bg-red-600/25 text-red-200 border-red-700/60"
            : "bg-stone-700/40 text-stone-200 border-stone-600/60";
    return (
      <Badge variant="outline" className={cn("text-[10px] capitalize", cls)}>
        {level}
      </Badge>
    );
  }

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

          <ScrollArea className="pr-1" style={{ maxHeight: '50vh' }}>
            <div className="space-y-2">
            {loading && (
              <p className="text-stone-400 text-sm">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="text-stone-400 text-sm">You're all caught up.</p>
            )}
            {items.map((n) => (
              <div key={n.id} className="p-3 rounded-md bg-stone-800/50 border border-stone-700/50 overflow-hidden">
                <div className="relative flex items-start justify-between pl-3">
                  {levelBar(n.level)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{n.title}</p>
                      {levelBadge(n.level)}
                      {!n.readAt && (
                        <Badge className="text-[10px] bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0">New</Badge>
                      )}
                    </div>
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
          </ScrollArea>

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
