import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileMenu } from "@/components/profile-menu";
import { Check, Star, Zap, Crown, Palette, Users, Infinity } from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free */}
            <Card className="relative h-full bg-gradient-to-br from-violet-500/50 via-purple-500/40 to-cyan-500/40 border-violet-400/60 hover:border-violet-300 transition-all shadow-xl shadow-violet-500/10">
              <CardHeader className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Free</CardTitle>
                </div>
                <CardDescription className="text-white">
                  Basics to get started and organize personal tasks.
                </CardDescription>
                <div className="mt-6">
                  <div className="text-4xl font-bold text-white">$0</div>
                  <div className="text-white text-sm">forever</div>
                </div>
                <div className="mt-6 space-y-3 text-white">
                  <Feature text="Access to core task management" />
                  <Feature text="Limited projects and boards" />
                  <Feature text="Basic moodboard visualization" />
                  <Feature text="Single user" />
                </div>
                <Button asChild className="mt-auto w-full bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 hover:from-pink-600 hover:via-violet-600 hover:to-cyan-600 border-0 text-white">
                  <Link href="/login" aria-label="Get started by signing in or creating an account">Get Started</Link>
                </Button>
              </CardHeader>
            </Card>

            {/* Pro Tier 2 (Popular) */}
            <Card className="relative h-full bg-gradient-to-br from-violet-500/50 via-purple-500/40 to-cyan-500/40 border-violet-400/60 hover:border-violet-300 transition-all shadow-xl shadow-violet-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 border-0 text-white">Most Popular</Badge>
              </div>
              <CardHeader className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-300" />
                    <CardTitle className="text-2xl">Pro Tier 2</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-white">
                  Everything in Free, plus enhanced AI that elevates your daily flow.
                </CardDescription>
                <div className="mt-6">
                  <div className="text-4xl font-bold text-white">$19</div>
                  <div className="text-white text-sm">per user / month</div>
                </div>
                <div className="mt-6 space-y-3 text-white">
                  <Feature text="All Free features" />
                  <Feature text="AI to arrange meetings and schedules" icon={<Zap className="w-4 h-4" />} />
                  <Feature text="Advanced task insights and suggestions" />
                  <Feature text="Priority support" />
                  <Feature text="Richer mood-aware assignments" />
                </div>
                <Button asChild className="mt-auto w-full bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 hover:from-pink-600 hover:via-violet-600 hover:to-cyan-600 border-0 text-white">
                  <Link href="/login?redirect=/billing/checkout/pro2" aria-label="Upgrade to Pro Tier 2 by signing in or creating an account">Upgrade to Pro 2</Link>
                </Button>
              </CardHeader>
            </Card>

            {/* Pro Tier 3 */}
            <Card className="relative h-full bg-gradient-to-br from-violet-500/50 via-purple-500/40 to-cyan-500/40 border-violet-400/60 hover:border-violet-300 transition-all shadow-xl shadow-violet-500/10">
              <CardHeader className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-emerald-300" />
                    <CardTitle className="text-2xl">Pro Tier 3</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-white">
                  Ultimate power for teams: limitless scale, collaboration, and AI mastery.
                </CardDescription>
                <div className="mt-6">
                  <div className="text-4xl font-bold text-white">$49</div>
                  <div className="text-white text-sm">per user / month</div>
                </div>
                <div className="mt-6 space-y-3 text-white">
                  <Feature text="Multiple accounts and roles" icon={<Users className="w-4 h-4" />} />
                  <Feature text="Unlimited files and storage" icon={<Infinity className="w-4 h-4" />} />
                  <Feature text="Highest-tier AI assistance across the app" icon={<Zap className="w-4 h-4" />} />
                  <Feature text="Create & Inspiring tools at the highest level" />
                  <Feature text="Advanced security and SSO" />
                </div>
                <Button asChild className="mt-auto w-full bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 hover:from-pink-600 hover:via-violet-600 hover:to-cyan-600 border-0 text-white">
                  <Link href="/login?redirect=/billing/checkout/pro3" aria-label="Upgrade to Pro Tier 3 by signing in or creating an account">Upgrade to Pro 3</Link>
                </Button>
                <div className="mt-3 text-sm text-white/90">
                  Need help? <a href="tel:+18005550199" className="underline hover:no-underline">+1 (800) 555‑0199</a> •
                  {" "}
                  <a href="mailto:sales@task-ette.com" className="underline hover:no-underline">sales@task-ette.com</a>
                </div>
              </CardHeader>
            </Card>
          </div>

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

function Feature({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-green-300">
        {icon ?? <Check className="w-3.5 h-3.5" />}
      </span>
      <span className="text-sm sm:text-base text-white">{text}</span>
    </div>
  );
}
