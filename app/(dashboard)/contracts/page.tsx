"use client"

import { useState, useEffect } from "react"
import { Plus, FileText, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

const CONTRACT_STATUSES = [
  "LEAD", "QUALIFICATION", "PROPOSAL", "CONTRACT", "SIGNATURE",
  "PAYMENT", "EXECUTION", "REVISION", "COMPLETION", "ARCHIVAL", "MAINTENANCE",
]

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700 border-slate-200",
  QUALIFICATION: "bg-blue-100 text-blue-700 border-blue-200",
  PROPOSAL: "bg-violet-100 text-violet-700 border-violet-200",
  CONTRACT: "bg-amber-100 text-amber-700 border-amber-200",
  SIGNATURE: "bg-orange-100 text-orange-700 border-orange-200",
  PAYMENT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EXECUTION: "bg-green-100 text-green-700 border-green-200",
  REVISION: "bg-red-100 text-red-700 border-red-200",
  COMPLETION: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ARCHIVAL: "bg-gray-100 text-gray-700 border-gray-200",
  MAINTENANCE: "bg-teal-100 text-teal-700 border-teal-200",
}

interface Contract {
  id: string
  title: string
  status: string
  value?: number
  currency?: string
  startDate?: string
  endDate?: string
  clientId: string
  client?: { name: string; company?: string }
  createdAt: string
}

interface Client {
  id: string
  name: string
  company?: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: "",
    status: "LEAD",
    value: "",
    currency: "USD",
    startDate: "",
    endDate: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchContracts()
    fetchClients()
  }, [])

  async function fetchContracts() {
    setLoading(true)
    try {
      const res = await fetch("/api/contracts")
      const data = await res.json()
      setContracts(data)
    } catch {
      toast({ title: "Error", description: "Failed to load contracts", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      await fetchContracts()
      setDialogOpen(false)
      setForm({ title: "", description: "", clientId: "", status: "LEAD", value: "", currency: "USD", startDate: "", endDate: "" })
      toast({ title: "Success", description: "Contract created" })
    } catch {
      toast({ title: "Error", description: "Failed to create contract", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
        <h1 className="text-lg font-semibold hidden lg:block">Contracts</h1>
        <div className="flex-1 lg:flex-none" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Contract</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Website Redesign Project"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientId">Client *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.company ? ` — ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="value">Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="value"
                      type="number"
                      placeholder="50000"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.clientId}>
                  {submitting ? "Creating..." : "Create Contract"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {CONTRACT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading contracts...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No contracts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="font-medium hover:underline text-sm"
                        >
                          {contract.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.client?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[contract.status] || ""}`}>
                          {contract.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.value
                          ? `${contract.currency || "USD"} ${contract.value.toLocaleString()}`
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
