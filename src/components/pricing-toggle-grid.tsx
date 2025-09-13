"use client"

import { useMemo, useState, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

type BillingCycle = "monthly" | "yearly"

interface Plan {
  id: string
  name: string
  tagline?: string
  icon?: ComponentType<{ className?: string }>
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
  const { user } = useAuth()
  const router = useRouter()
  const [openPlan, setOpenPlan] = useState<Plan | null>(null)

  // Payment form state
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [address, setAddress] = useState("")

  function handleSelect(plan: Plan) {
    const isFree = (isYearly ? plan.yearly : plan.monthly) === 0
    if (isFree) {
      // Free: send unauthenticated users to login; authenticated straight to app
      if (!user) router.push("/login")
      else router.push("/")
      return
    }
    // Paid: require login first
    if (!user) {
      router.push("/login")
      return
    }
    setOpenPlan(plan)
  }

  function resetForm() {
    setCardName("")
    setCardNumber("")
    setExpiry("")
    setCvc("")
    setAddress("")
  }

  function closeDialog() {
    setOpenPlan(null)
    resetForm()
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    // Placeholder: integrate real checkout here
    console.log("submit payment", {
      plan: openPlan?.id,
      cycle,
      cardName,
      cardNumber: `•••• ${cardNumber.slice(-4)}`,
      expiry,
      cvc: "***",
      address,
    })
    closeDialog()
  }

  return (
    <section className="max-w-6xl mx-auto">
      {/* Cycle toggle with floating 'Save 2 months' tab aligned to Yearly */}
      <div className="relative z-20 flex items-center justify-center gap-3 mb-8">
        <Button
          type="button"
          variant={isYearly ? "ghost" : "secondary"}
          onClick={() => setCycle("monthly")}
          className={cn(
            "cursor-pointer min-w-[110px]",
            !isYearly && "bg-stone-800 text-white hover:bg-stone-700"
          )}
        >
          Monthly
        </Button>
        <div className="relative pt-4">
          <Button
            type="button"
            variant={isYearly ? "secondary" : "ghost"}
            onClick={() => setCycle("yearly")}
            className={cn(
              "cursor-pointer min-w-[110px]",
              isYearly && "bg-stone-800 text-white hover:bg-stone-700"
            )}
          >
            Yearly
          </Button>
          <Badge
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 z-30",
              "rounded-full px-2.5 py-0.5 text-xs shadow-lg",
              "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400/40 text-white"
            )}
          >
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
                  onClick={() => handleSelect(plan)}
                >
                  {isFree ? (!user ? "Sign in to continue" : "Start using Free") : plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Dialog open={!!openPlan} onOpenChange={(o) => (!o ? closeDialog() : void 0)}>
        <DialogContent className="bg-stone-900/90 border-stone-700/60 text-white">
          <DialogHeader>
            <DialogTitle>
              {openPlan ? `Subscribe to ${openPlan.name} (${isYearly ? "Yearly" : "Monthly"})` : "Checkout"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitPayment}>
            <div className="space-y-2">
              <Label htmlFor="cardName" className="text-stone-300">Name on Card</Label>
              <Input
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-stone-300">Card Number</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                pattern="[0-9\s]{12,19}"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9\s]/g, ""))}
                required
                placeholder="4242 4242 4242 4242"
                className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-stone-300">Expiry (MM/YY)</Label>
                <Input
                  id="expiry"
                  inputMode="numeric"
                  pattern="(0[1-9]|1[0-2])\/(\d{2})"
                  placeholder="12/27"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-stone-300">CVC</Label>
                <Input
                  id="cvc"
                  inputMode="numeric"
                  pattern="\d{3,4}"
                  maxLength={4}
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-stone-300">Postal code</Label>
                <Input
                  id="zip"
                  placeholder="10001"
                  className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-stone-300">Billing Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="123 Main St, City, State"
                className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={closeDialog} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white hover:opacity-90 cursor-pointer"
              >
                Pay & Subscribe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default PricingToggleGrid
