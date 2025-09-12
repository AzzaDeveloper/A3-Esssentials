"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBell({ hasUnread, onClick }: { hasUnread?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label="Open notifications"
      className={cn(
        "w-10 h-10 rounded-full bg-stone-800/80 hover:bg-stone-800 text-white border border-stone-700/60 cursor-pointer relative"
      )}
    >
      <Bell className="w-5 h-5" />
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-stone-900" />
      )}
    </Button>
  );
}

