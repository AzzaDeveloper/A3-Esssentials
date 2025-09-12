"use client";

import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SiteNavProps {
  className?: string;
}

// Reusable top navigation bar used across pages
export function SiteNav({ className }: SiteNavProps) {
  return (
    <header
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-20",
        "bg-stone-900/80 backdrop-blur-md rounded-full px-4 md:px-6 py-2 md:py-3",
        "border border-stone-700/50 max-w-[90vw] text-white",
        className,
      )}
    >
      <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-start overflow-hidden">
        <Link
          href="/"
          aria-label="Task-ette Home"
          className="flex items-center gap-2 hover:opacity-90 cursor-pointer select-none rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold whitespace-nowrap truncate max-w-[8rem] sm:max-w-none text-white">Task-ette</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-stone-300 hover:text-white transition-colors">
            Features
          </a>
          <Link href="/help" className="text-stone-300 hover:text-white transition-colors">
            Help & Support
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 border-0"
          >
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default SiteNav;
