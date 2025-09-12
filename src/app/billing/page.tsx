import { Badge } from "@/components/ui/badge";
import { ProfileMenu } from "@/components/profile-menu";
import { Palette } from "lucide-react";
import { PricingToggleGrid } from "@/components/pricing-toggle-grid";

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-stone-900 text-white overflow-hidden">
      <ProfileMenu />

      <header className="relative pt-20 pb-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-slate-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-stone-700/50 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-stone-600/40 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-stone-700/60 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Task-ette</span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-gradient-to-r from-orange-500/30 to-yellow-500/30 text-white border-orange-400/40">Flexible Plans</Badge>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Pricing</span>
              <br />
              <span className="text-white">That Grows With You</span>
            </h1>
            <p className="mt-4 text-white text-lg">
              Start free, then unlock AI superpowers, collaboration at scale, and unlimited creativity when you’re ready.
            </p>
          </div>
        </div>
      </header>

      <main className="relative px-4 pb-24">
        <div className="container mx-auto relative">
          <PricingToggleGrid />

          {/* FAQ / Notes */}
          <div className="max-w-3xl mx-auto mt-16 text-center">
            <p className="text-white text-sm">
              Prices in USD. Cancel anytime. Team discounts available on annual plans.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-700/50 bg-stone-800/60 backdrop-blur-sm py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Task-ette</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-700/50 text-center text-sm text-white">
            © 2025 Task-ette. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
