"use client";
import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signUpEmail, signInWithGooglePopup } from "@/lib/auth";
import { createServerSessionFromUser } from "@/lib/session";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptTerms) return setError("You must accept the terms");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoadingEmail(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await signUpEmail(email, password, displayName || undefined);
      await createServerSessionFromUser(true);
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create account");
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGooglePopup();
      await createServerSessionFromUser(true);
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed");
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/50 to-stone-950" />
      <div className="absolute top-32 right-20 w-40 h-40 bg-stone-800/30 rounded-full blur-xl" />
      <div className="absolute bottom-20 left-32 w-56 h-56 bg-stone-700/20 rounded-full blur-2xl" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-stone-600/10 rounded-full blur-lg" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-stone-100 mb-2">
                Task-
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ette
                </span>
              </h1>
            </Link>
            <p className="text-stone-400">Create your mood-driven workspace</p>
          </div>

          <Card className="bg-stone-900/80 border-stone-700 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-stone-100">Create account</CardTitle>
              <CardDescription className="text-stone-400">
                Join Task-ette and start organizing with moods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-500 text-sm" role="alert">{error}</div>
              )}
              <form className="space-y-4" onSubmit={handleRegister} aria-busy={loadingEmail || loadingGoogle}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-stone-300">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loadingEmail || loadingGoogle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-stone-300">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loadingEmail || loadingGoogle}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loadingEmail || loadingGoogle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loadingEmail || loadingGoogle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-stone-300">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loadingEmail || loadingGoogle}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="rounded border-stone-600 bg-stone-800 text-cyan-400 focus:ring-cyan-400/20"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={loadingEmail || loadingGoogle}
                />
                <Label htmlFor="terms" className="text-sm text-stone-400">
                  I agree to the{" "}
                  <Link href="#" className="text-cyan-400 hover:text-cyan-300">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-cyan-400 hover:text-cyan-300">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button type="submit" disabled={loadingEmail || loadingGoogle} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium cursor-pointer disabled:cursor-not-allowed">
                {loadingEmail ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</span>
                ) : (
                  "Create account"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={loadingEmail || loadingGoogle}
                className="w-full bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-stone-100 hover:border-stone-500 cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingGoogle ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</span>
                ) : (
                  "Continue with Google"
                )}
              </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-stone-400">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="bg-stone-900/40 rounded-lg p-4 border border-stone-700/50">
            <p className="text-center text-stone-300 text-sm mb-3">Start organizing with moods</p>
            <div className="flex justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-xs text-stone-400">Productive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
                <span className="text-xs text-stone-400">Energetic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎯</span>
                </div>
                <span className="text-xs text-stone-400">Focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
