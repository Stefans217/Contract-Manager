"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  QUALIFICATION: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-violet-100 text-violet-700",
  CONTRACT: "bg-amber-100 text-amber-700",
  SIGNATURE: "bg-orange-100 text-orange-700",
  PAYMENT: "bg-yellow-100 text-yellow-700",
  EXECUTION: "bg-green-100 text-green-700",
  REVISION: "bg-red-100 text-red-700",
  COMPLETION: "bg-emerald-100 text-emerald-700",
  ARCHIVAL: "bg-gray-100 text-gray-700",
  MAINTENANCE: "bg-teal-100 text-teal-700",
}

interface Contract {
  id: string
  title: string
  status: string
  value?: number
  currency?: string
  createdAt: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  contracts: Contract[]
  createdAt: string
}

const MOCK_CLIENT: Client = {
  id: "mock-1",
  name: "Acme Corporation",
  email: "contact@acme.com",
  phone: "+1 555-0101",
  company: "Acme Corp",
  address: "123 Business Ave, New York, NY 10001",
  notes: "Long-term client with multiple active contracts",
  contracts: [
    { id: "contract-1", title: "Website Redesign Project", status: "EXECUTION", value: 45000, currency: "USD", createdAt: "2024-03-01" },
    { id: "contract-4", title: "Brand Identity Design", status: "COMPLETION", value: 18500, currency: "USD", createdAt: "2024-02-15" },
  ],
  createdAt: "2024-01-15",
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClient()
  }, [params.id])

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${params.id}`)
      if (!res.ok) {
        setClient(MOCK_CLIENT)
        setForm(MOCK_CLIENT)
        return
      }
      const data = await res.json()
      setClient(data)
      setForm(data)
    } catch {
      setClient(MOCK_CLIENT)
      setForm(MOCK_CLIENT)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      await fetchClient()
      setEditing(false)
      toast({ title: "Saved", description: "Client updated successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!client) return <div className="p-6 text-muted-foreground">Loading...</div>

  return (
    <div>
      <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">{client.name}</h1>
        <div className="flex-1" />
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm(client) }}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
      </div>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              {editing ? (
                <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              ) : (
                <p className="text-sm">{client.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              {editing ? (
                <Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              ) : (
                <p className="text-sm flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.company || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              {editing ? (
                <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              ) : (
                <p className="text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.email || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              {editing ? (
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              ) : (
                <p className="text-sm flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.phone || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Address</Label>
              {editing ? (
                <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              ) : (
                <p className="text-sm flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.address || <span className="text-muted-foreground">—</span>}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Notes</Label>
              {editing ? (
                <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              ) : (
                <p className="text-sm text-muted-foreground">{client.notes || "—"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contracts ({client.contracts?.length || 0})</CardTitle>
              <Link href={`/contracts?clientId=${client.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.contracts?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contracts yet</p>
            ) : (
              client.contracts?.map((contract) => (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{contract.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {contract.value && (
                        <span className="text-sm font-medium">${contract.value.toLocaleString()}</span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[contract.status] || ""}`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
