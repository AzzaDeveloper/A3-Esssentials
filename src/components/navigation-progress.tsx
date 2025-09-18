"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const TRICKLE_STEPS = [15, 35, 55, 75, 85];
const TRICKLE_INTERVAL = 180;
const AUTO_COMPLETE_DELAY = 10000;

export function NavigationProgress() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const autoCompleteRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (autoCompleteRef.current !== null) {
      window.clearTimeout(autoCompleteRef.current);
      autoCompleteRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    clearTimers();
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    setProgress(100);
    finishTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      finishTimerRef.current = null;
    }, 220);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    setVisible(true);
    setProgress(0);
    rafRef.current = window.requestAnimationFrame(() => {
      setProgress(8);
    });
    TRICKLE_STEPS.forEach((value, index) => {
      const timer = window.setTimeout(() => {
        setProgress((current) => (current < value ? value : current));
      }, (index + 1) * TRICKLE_INTERVAL);
      timersRef.current.push(timer);
    });
    autoCompleteRef.current = window.setTimeout(() => {
      complete();
    }, AUTO_COMPLETE_DELAY);
  }, [clearTimers, complete]);

  useEffect(() => {
    const routerInstance = router as typeof router &
      Record<string, (...args: unknown[]) => unknown>;
    const methods: Array<keyof typeof routerInstance> = [
      "push",
      "replace",
      "back",
      "forward",
      "refresh",
    ];
    const originals = new Map<string, (...args: unknown[]) => unknown>();
    methods.forEach((method) => {
      const original = routerInstance[method];
      if (typeof original !== "function") {
        return;
      }
      originals.set(method, original);
      routerInstance[method] = ((...args: unknown[]) => {
        start();
        return original.apply(routerInstance, args);
      }) as typeof original;
    });
    return () => {
      methods.forEach((method) => {
        const original = originals.get(method);
        if (original) {
          routerInstance[method] = original;
        }
      });
    };
  }, [router, start]);

  useEffect(() => {
    const handlePopState = () => start();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [start]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    complete();
  }, [pathname, search, complete]);

  useEffect(
    () => () => {
      clearTimers();
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    },
    [clearTimers]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className={cn(
          "h-full w-full origin-left bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500",
          "transition-opacity duration-150 ease-out",
          "transform-gpu transition-transform"
        )}
        style={{
          opacity: visible ? 1 : 0,
          transform: `scaleX(${progress / 100})`,
        }}
      />
    </div>
  );
}

export default NavigationProgress;
