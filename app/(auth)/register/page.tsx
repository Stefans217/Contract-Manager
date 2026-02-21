"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FileText, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")
  const inviteEmail = searchParams.get("email") || ""
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    email: inviteEmail,
    password: "",
    confirmPassword: "",
    role: inviteToken ? "CLIENT" as "FREELANCER" | "CLIENT" : "FREELANCER" as "FREELANCER" | "CLIENT",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          ...(inviteToken && { inviteToken }),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Registration failed")
      }
      toast({ title: "Account created!", description: "Please sign in with your new account" })
      const redirectUrl = inviteToken ? `/login?callbackUrl=${encodeURIComponent(`/invite/${inviteToken}`)}` : "/login"
      router.push(redirectUrl)
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm px-4">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center">
          <FileText className="h-5 w-5 text-zinc-900" />
        </div>
        <span className="text-xl font-semibold text-white">ContractFlow</span>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white">Create account</CardTitle>
          <CardDescription className="text-zinc-400">
            Start managing your contracts today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Role selection */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">I am a</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "FREELANCER" })}
                  className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                    form.role === "FREELANCER"
                      ? "border-white bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Freelancer
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "CLIENT" })}
                  className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                    form.role === "CLIENT"
                      ? "border-white bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Client
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300" htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300" htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300" htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300" htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full bg-white text-zinc-900 hover:bg-zinc-100"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-zinc-500 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-zinc-300 hover:text-white">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
