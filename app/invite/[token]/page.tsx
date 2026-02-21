"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { use } from "react"
import Link from "next/link"
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface InviteDetails {
  id: string
  email: string
  contractTitle: string
  contractDescription: string | null
  senderName: string | null
  accepted: boolean
  expired: boolean
  expiresAt: string
}

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const { toast } = useToast()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "Invite not found")
          return
        }
        const data = await res.json()
        setInvite(data)
      } catch {
        setError("Failed to load invite")
      } finally {
        setLoading(false)
      }
    }
    fetchInvite()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to accept invite",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Contract linked!",
        description: `You now have access to "${data.contractTitle || "the contract"}"`,
      })
      router.push(`/contracts/${data.contractId}`)
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
          <CardHeader className="items-center text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-2" />
            <CardTitle className="text-white">Invalid Invite</CardTitle>
            <CardDescription className="text-zinc-400">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (invite?.accepted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
          <CardHeader className="items-center text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <CardTitle className="text-white">Already Accepted</CardTitle>
            <CardDescription className="text-zinc-400">This invite has already been used.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link href="/contracts">View Contracts</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (invite?.expired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
          <CardHeader className="items-center text-center">
            <Clock className="h-12 w-12 text-yellow-500 mb-2" />
            <CardTitle className="text-white">Invite Expired</CardTitle>
            <CardDescription className="text-zinc-400">
              This invite expired on {new Date(invite.expiresAt).toLocaleDateString()}. Ask the freelancer to send a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Not logged in — redirect to register/login
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
          <CardHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-zinc-900" />
            </div>
            <CardTitle className="text-white">Contract Invite</CardTitle>
            <CardDescription className="text-zinc-400">
              <strong className="text-zinc-300">{invite?.senderName || "A freelancer"}</strong> has invited you to view
              {invite?.contractTitle && <> &ldquo;<span className="text-zinc-300">{invite.contractTitle}</span>&rdquo;</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-zinc-500">
            {invite?.contractDescription && <p className="mb-4">{invite.contractDescription}</p>}
            <p>Sign in or create an account to accept this invite.</p>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100" asChild>
              <Link href={`/register?invite=${token}&email=${encodeURIComponent(invite?.email || "")}`}>
                Create Account
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
                Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Logged in — show accept button
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
        <CardHeader className="items-center text-center">
          <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-2">
            <FileText className="h-6 w-6 text-zinc-900" />
          </div>
          <CardTitle className="text-white">Accept Contract Invite</CardTitle>
          <CardDescription className="text-zinc-400">
            <strong className="text-zinc-300">{invite?.senderName || "A freelancer"}</strong> has invited you to
            {invite?.contractTitle && <> &ldquo;<span className="text-zinc-300">{invite.contractTitle}</span>&rdquo;</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          {invite?.contractDescription && <p>{invite.contractDescription}</p>}
          <div className="p-3 rounded-md bg-zinc-800/50 border border-zinc-700">
            <p className="text-xs text-zinc-500">Signed in as</p>
            <p className="text-zinc-300">{session?.user?.email}</p>
          </div>
          {session?.user?.email !== invite?.email && (
            <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs text-yellow-400">
                This invite was sent to <strong>{invite?.email}</strong> but you&apos;re signed in as <strong>{session?.user?.email}</strong>. You need to sign in with the invited email.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-white text-zinc-900 hover:bg-zinc-100"
            onClick={handleAccept}
            disabled={accepting || session?.user?.email !== invite?.email}
          >
            {accepting ? "Accepting..." : "Accept Invite"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
