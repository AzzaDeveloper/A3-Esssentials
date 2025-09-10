"use client";
import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInEmail, signInWithGooglePopup } from "@/lib/auth";
import { createServerSessionFromUser } from "@/lib/session";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingEmail(true);
    try {
      await signInEmail(email, password);
      await createServerSessionFromUser(remember);
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign in");
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
      <div className="absolute top-20 left-20 w-32 h-32 bg-stone-800/30 rounded-full blur-xl" />
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-stone-700/20 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-stone-600/10 rounded-full blur-lg" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-stone-100 mb-2">
                Task-
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent [&]:text-pink-400">
                  ette
                </span>
              </h1>
            </Link>
            <p className="text-stone-400">Welcome back to your mood-driven workspace</p>
          </div>

          <Card className="bg-stone-900/80 border-stone-700 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-stone-100">Sign in</CardTitle>
              <CardDescription className="text-stone-400">Enter your credentials to access your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-500 text-sm" role="alert">{error}</div>
              )}
              <form className="space-y-4" onSubmit={handleSignIn} aria-busy={loadingEmail || loadingGoogle}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-purple-400 focus:ring-purple-400/20"
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
                  className="bg-stone-800 border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-purple-400 focus:ring-purple-400/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loadingEmail || loadingGoogle}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="rounded border-stone-600 bg-stone-800 text-purple-400 focus:ring-purple-400/20"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loadingEmail || loadingGoogle}
                  />
                  <Label htmlFor="remember" className="text-sm text-stone-400">
                    Remember me
                  </Label>
                </div>
                <Link href="#" className="text-sm text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" disabled={loadingEmail || loadingGoogle} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium cursor-pointer disabled:cursor-not-allowed">
                {loadingEmail ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</span>
                ) : (
                  "Sign in"
                )}
              </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-stone-900 px-2 text-stone-500">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-stone-100 hover:border-stone-500 cursor-pointer disabled:cursor-not-allowed"
                onClick={handleGoogle}
                disabled={loadingEmail || loadingGoogle}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loadingGoogle ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</span>
                ) : (
                  "Continue with Google"
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-stone-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🔥</span>
              </div>
              <p className="text-xs text-stone-500">Urgent</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🧠</span>
              </div>
              <p className="text-xs text-stone-500">Analytical</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">✨</span>
              </div>
              <p className="text-xs text-stone-500">Creative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
