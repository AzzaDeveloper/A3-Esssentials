"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type BillingCycle = "monthly" | "yearly"

interface Plan {
  id: string
  name: string
  tagline?: string
  icon?: React.ComponentType<{ className?: string }>
  monthly: number
  yearly: number
  features: string[]
  cta: string
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For personal tasks",
    icon: Sparkles,
    monthly: 0,
    yearly: 0,
    features: [
      "Unlimited tasks",
      "Basic moodboard",
      "1 workspace",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "AI superpowers",
    icon: Sparkles,
    monthly: 12,
    yearly: 120,
    features: [
      "AI-assisted planning",
      "Mood-aware assignments",
      "Advanced filters",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    tagline: "Collaborate at scale",
    icon: Users,
    monthly: 29,
    yearly: 290,
    features: [
      "All Pro features",
      "Team dashboards",
      "Shared moodboard",
      "Role-based access",
    ],
    cta: "Start Team Trial",
  },
]

export function PricingToggleGrid() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const isYearly = cycle === "yearly"

  const plans = useMemo(() => PLANS, [])

  return (
    <section className="max-w-6xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Button
          type="button"
          variant={isYearly ? "ghost" : "secondary"}
          onClick={() => setCycle("monthly")}
          className={cn(
            "cursor-pointer",
            !isYearly && "bg-stone-800 text-white hover:bg-stone-700"
          )}
        >
          Monthly
        </Button>
        <div className="relative">
          <Button
            type="button"
            variant={isYearly ? "secondary" : "ghost"}
            onClick={() => setCycle("yearly")}
            className={cn(
              "cursor-pointer",
              isYearly && "bg-stone-800 text-white hover:bg-stone-700"
            )}
          >
            Yearly
          </Button>
          <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400/40 text-white">
            Save 2 months
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = isYearly ? plan.yearly : plan.monthly
          const per = isYearly ? "/year" : "/mo"
          const Icon = plan.icon
          const isFree = price === 0

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden border-stone-700/60 bg-stone-900/60 backdrop-blur",
                plan.highlighted && "ring-1 ring-pink-400/30"
              )}
            >
              {plan.highlighted && (
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-pink-500/0 via-pink-500/60 to-pink-500/0" />
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Icon ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    ) : null}
                    <div>
                      <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                      {plan.tagline && (
                        <p className="text-stone-400 text-sm">{plan.tagline}</p>
                      )}
                    </div>
                  </div>
                  {plan.highlighted && (
                    <Badge className="bg-gradient-to-r from-pink-500/30 to-cyan-500/30 border-pink-400/40 text-white">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-white text-4xl font-bold">
                    {isFree ? "$0" : `$${price}`}
                  </span>
                  <span className="text-stone-400 ml-2">{per}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-stone-300">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-400" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  className={cn(
                    "w-full cursor-pointer",
                    plan.highlighted
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white hover:opacity-90"
                      : "bg-stone-800 text-white hover:bg-stone-700"
                  )}
                  onClick={() => {
                    // Placeholder click handlers. Wire up to checkout later.
                    // eslint-disable-next-line no-console
                    console.log("select plan", { plan: plan.id, cycle })
                  }}
                >
                  {isFree ? "Continue Free" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default PricingToggleGrid

