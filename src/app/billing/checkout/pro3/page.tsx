"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/profile-menu";

type Method = "visa" | "mastercard" | "paypal";

export default function Pro3CheckoutPage() {
  const [method, setMethod] = useState<Method>("visa");
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Stub: after collecting details, proceed. Here we just return home.
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white overflow-hidden">
      <ProfileMenu />

      <header className="relative pt-20 pb-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-slate-900" />
        <div className="container mx-auto relative text-center">
          <h1 className="text-4xl font-bold">Pro Tier 3 • Checkout</h1>
          <p className="text-white/90 mt-2">Enterprise power with concierge support</p>
        </div>
      </header>

      <main className="relative px-4 pb-24">
        <div className="container mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-cyan-500/20 border-violet-400/60">
              <CardHeader>
                <CardTitle className="text-white">Billing Details</CardTitle>
                <CardDescription className="text-white">$49 per user / month • Unlimited scale</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <Label className="text-white">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <ToggleOption selected={method === "visa"} onClick={() => setMethod("visa")}>Visa</ToggleOption>
                      <ToggleOption selected={method === "mastercard"} onClick={() => setMethod("mastercard")}>MasterCard</ToggleOption>
                      <ToggleOption selected={method === "paypal"} onClick={() => setMethod("paypal")}>PayPal</ToggleOption>
                    </div>
                  </div>

                  {method !== "paypal" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name" className="text-white">Name on card</Label>
                        <Input id="name" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" placeholder="Alex Johnson" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="card" className="text-white">Card number</Label>
                        <Input id="card" inputMode="numeric" pattern="[0-9\s]*" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" placeholder="4242 4242 4242 4242" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp" className="text-white">Expiry</Label>
                        <Input id="exp" placeholder="MM/YY" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc" className="text-white">CVC</Label>
                        <Input id="cvc" inputMode="numeric" pattern="[0-9]*" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" placeholder="123" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-white">Address</Label>
                        <Input id="address" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" placeholder="123 Main St" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postcode" className="text-white">Post code</Label>
                        <Input id="postcode" required className="bg-stone-800 border-stone-600 text-white placeholder:text-stone-400" placeholder="90210" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-white">You selected PayPal. You’ll be redirected to complete your payment.</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-white/80 text-sm">Secured payment • Cancel anytime</p>
                    {method === "paypal" ? (
                      <Button type="submit" className="bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 border-0 text-white">
                        Continue to PayPal
                      </Button>
                    ) : (
                      <Button type="submit" className="bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 border-0 text-white">
                        Start Pro Tier 3
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <aside>
            <Card className="bg-stone-800/70 border-stone-600">
              <CardHeader>
                <CardTitle className="text-white">Talk to Sales</CardTitle>
                <CardDescription className="text-white">We’ll help you tailor a plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-white">
                <p>
                  Hotline: <a className="underline hover:no-underline" href="tel:+18005550199">+1 (800) 555‑0199</a>
                </p>
                <p>
                  Email: <a className="underline hover:no-underline" href="mailto:sales@task-ette.com">sales@task-ette.com</a>
                </p>
                <p className="text-sm text-white/80">Mon–Fri, 9am–6pm (your local time)</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ToggleOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-10 rounded-md border px-3 text-sm transition-colors " +
        (selected
          ? "bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 text-white border-transparent"
          : "bg-stone-800 text-white border-stone-600 hover:bg-stone-700")
      }
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

