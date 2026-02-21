"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, CheckCircle2, Circle, MessageSquare, GitBranch,
  FileEdit, DollarSign, Calendar, AlertTriangle, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const CONTRACT_STATUSES = [
  "LEAD", "QUALIFICATION", "PROPOSAL", "CONTRACT", "SIGNATURE",
  "PAYMENT", "EXECUTION", "REVISION", "COMPLETION", "ARCHIVAL", "MAINTENANCE",
]

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

interface Milestone {
  id: string
  title: string
  description?: string
  amount?: number
  dueDate?: string
  isPaid: boolean
  paidAt?: string
}

interface Comment {
  id: string
  content: string
  isRedline: boolean
  resolved: boolean
  author: { name?: string; email: string; image?: string }
  createdAt: string
}

interface ContractVersion {
  id: string
  version: number
  content: string
  author: { name?: string }
  createdAt: string
}

interface Contract {
  id: string
  title: string
  description?: string
  content?: string
  status: string
  value?: number
  currency?: string
  startDate?: string
  endDate?: string
  client?: { id: string; name: string; company?: string; email?: string }
  milestones: Milestone[]
  comments: Comment[]
  versions: ContractVersion[]
  createdAt: string
  updatedAt: string
}

const MOCK_CONTRACT: Contract = {
  id: "contract-1",
  title: "Website Redesign Project",
  description: "Complete redesign of corporate website with modern UI/UX",
  content: `This agreement ("Agreement") is entered into as of March 1, 2024, between Acme Corporation ("Client") and ContractFlow Services ("Provider").

## 1. Scope of Work

The Provider agrees to deliver a complete website redesign including:
- New visual design system aligned with brand guidelines
- Responsive layouts optimized for all screen sizes  
- Performance optimization targeting 95+ Lighthouse score
- SEO improvements and metadata structure

## 2. Deliverables

**Phase 1 - Design (Weeks 1-4)**
- Wireframes for all key pages
- High-fidelity mockups
- Design system documentation

**Phase 2 - Development (Weeks 5-12)**
- Frontend implementation
- CMS integration
- Testing and QA

**Phase 3 - Launch (Weeks 13-16)**
- Deployment and go-live
- 30-day post-launch support

## 3. Payment Terms

Total project value: $45,000 USD
- 30% upon contract signing: $13,500
- 40% at Phase 2 completion: $18,000  
- 30% upon final delivery: $13,500

## 4. Intellectual Property

Upon receipt of full payment, all deliverables become the exclusive property of the Client.

## 5. Confidentiality

Both parties agree to maintain strict confidentiality of all project information.`,
  status: "EXECUTION",
  value: 45000,
  currency: "USD",
  startDate: "2024-03-01",
  endDate: "2024-07-31",
  client: { id: "mock-1", name: "Acme Corporation", company: "Acme Corp", email: "contact@acme.com" },
  milestones: [
    { id: "m1", title: "Design Mockups", description: "Initial design mockups and wireframes", amount: 13500, dueDate: "2024-04-01", isPaid: true, paidAt: "2024-04-02" },
    { id: "m2", title: "Development Phase 1", description: "Core development work", amount: 18000, dueDate: "2024-05-15", isPaid: true, paidAt: "2024-05-16" },
    { id: "m3", title: "Final Delivery", description: "Final delivery and site launch", amount: 13500, dueDate: "2024-07-31", isPaid: false },
  ],
  comments: [
    {
      id: "c1",
      content: "The hero section looks great! Can we add a subtle animation to the CTA button?",
      isRedline: false,
      resolved: false,
      author: { name: "John Smith", email: "john@acme.com" },
      createdAt: "2024-04-10T10:30:00Z",
    },
    {
      id: "c2",
      content: "Section 3.2: Change 'weekly status updates' to 'bi-weekly status updates' to align with our internal process.",
      isRedline: true,
      resolved: false,
      author: { name: "Sarah Johnson", email: "sarah@acme.com" },
      createdAt: "2024-04-12T14:15:00Z",
    },
    {
      id: "c3",
      content: "Payment schedule confirmed with finance team. Proceed as agreed.",
      isRedline: false,
      resolved: true,
      author: { name: "Mike Wilson", email: "mike@acme.com" },
      createdAt: "2024-04-08T09:00:00Z",
    },
  ],
  versions: [
    { id: "v2", version: 2, content: "Revised contract with updated payment terms...", author: { name: "John Smith" }, createdAt: "2024-03-15" },
    { id: "v1", version: 1, content: "Initial contract draft...", author: { name: "John Smith" }, createdAt: "2024-03-01" },
  ],
  createdAt: "2024-03-01",
  updatedAt: "2024-06-15",
}

export default function ContractDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [editingContent, setEditingContent] = useState(false)
  const [contentDraft, setContentDraft] = useState("")
  const [savingContent, setSavingContent] = useState(false)
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [commentDialog, setCommentDialog] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", amount: "", dueDate: "" })
  const [commentForm, setCommentForm] = useState({ content: "", isRedline: false })
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [params.id])

  async function fetchContract() {
    try {
      const res = await fetch(`/api/contracts/${params.id}`)
      if (!res.ok) {
        setContract(MOCK_CONTRACT)
        setContentDraft(MOCK_CONTRACT.content || "")
        return
      }
      const data = await res.json()
      setContract(data)
      setContentDraft(data.content || "")
    } catch {
      setContract(MOCK_CONTRACT)
      setContentDraft(MOCK_CONTRACT.content || "")
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusUpdating(true)
    try {
      const res = await fetch(`/api/contracts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setContract((c) => c ? { ...c, status: newStatus } : c)
      toast({ title: "Status updated", description: `Moved to ${newStatus}` })
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleSaveContent() {
    setSavingContent(true)
    try {
      await fetch(`/api/contracts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentDraft }),
      })
      setContract((c) => c ? { ...c, content: contentDraft } : c)
      setEditingContent(false)
      toast({ title: "Saved", description: "Contract content updated" })
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    } finally {
      setSavingContent(false)
    }
  }

  async function handleMarkPaid(milestoneId: string, isPaid: boolean) {
    try {
      await fetch(`/api/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      })
      setContract((c) =>
        c ? {
          ...c,
          milestones: c.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isPaid, paidAt: isPaid ? new Date().toISOString() : undefined } : m
          ),
        } : c
      )
      toast({ title: isPaid ? "Marked as paid" : "Marked as unpaid" })
    } catch {
      toast({ title: "Error", description: "Failed to update milestone", variant: "destructive" })
    }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...milestoneForm,
          amount: milestoneForm.amount ? parseFloat(milestoneForm.amount) : undefined,
          contractId: params.id,
        }),
      })
      if (!res.ok) throw new Error()
      const newMilestone = await res.json()
      setContract((c) => c ? { ...c, milestones: [...c.milestones, newMilestone] } : c)
      setMilestoneDialog(false)
      setMilestoneForm({ title: "", description: "", amount: "", dueDate: "" })
      toast({ title: "Milestone added" })
    } catch {
      toast({ title: "Error", description: "Failed to add milestone", variant: "destructive" })
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...commentForm, contractId: params.id }),
      })
      if (!res.ok) throw new Error()
      const newComment = await res.json()
      setContract((c) => c ? { ...c, comments: [newComment, ...c.comments] } : c)
      setCommentDialog(false)
      setCommentForm({ content: "", isRedline: false })
      toast({ title: "Comment added" })
    } catch {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" })
    }
  }

  if (!contract) return <div className="p-6 text-muted-foreground">Loading...</div>

  const currentStatusIdx = CONTRACT_STATUSES.indexOf(contract.status)
  const paidAmount = contract.milestones.filter((m) => m.isPaid).reduce((s, m) => s + (m.amount || 0), 0)
  const totalAmount = contract.milestones.reduce((s, m) => s + (m.amount || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6">
        <Link href="/contracts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{contract.title}</h1>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[contract.status] || ""}`}>
          {contract.status}
        </span>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Contract Value</span>
              </div>
              <p className="text-xl font-semibold">
                {contract.value ? `$${contract.value.toLocaleString()}` : "—"}
              </p>
              {totalAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${paidAmount.toLocaleString()} paid
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Timeline</span>
              </div>
              <p className="text-sm font-medium">
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "—"}
                {" → "}
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-xs">Client</span>
              </div>
              {contract.client ? (
                <Link href={`/clients/${contract.client.id}`} className="hover:underline">
                  <p className="text-sm font-medium">{contract.client.name}</p>
                  {contract.client.company && (
                    <p className="text-xs text-muted-foreground">{contract.client.company}</p>
                  )}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifecycle Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {CONTRACT_STATUSES.map((status, idx) => {
                const isActive = status === contract.status
                const isPast = idx < currentStatusIdx
                return (
                  <div key={status} className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStatusChange(status)}
                      disabled={statusUpdating}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? `${STATUS_COLORS[status]} ring-2 ring-offset-1 ring-current`
                          : isPast
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {status}
                    </button>
                    {idx < CONTRACT_STATUSES.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">
              <FileEdit className="h-3.5 w-3.5 mr-1.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="milestones">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Milestones ({contract.milestones.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Comments ({contract.comments.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <GitBranch className="h-3.5 w-3.5 mr-1.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Contract Content */}
          <TabsContent value="content" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Contract Document</CardTitle>
                  {editingContent ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingContent(false); setContentDraft(contract.content || "") }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveContent} disabled={savingContent}>
                        {savingContent ? "Saving..." : "Save Version"}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditingContent(true)}>
                      <FileEdit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingContent ? (
                  <Textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="Enter contract text here..."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground p-4 bg-muted/30 rounded-md">
                      {contract.content || "No contract content yet. Click Edit to add content."}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones */}
          <TabsContent value="milestones" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Milestones</CardTitle>
                  <Dialog open={milestoneDialog} onOpenChange={setMilestoneDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add Milestone
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Milestone</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddMilestone} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Title *</Label>
                          <Input
                            placeholder="Phase 1 Completion"
                            value={milestoneForm.title}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Amount ($)</Label>
                            <Input
                              type="number"
                              placeholder="5000"
                              value={milestoneForm.amount}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Due Date</Label>
                            <Input
                              type="date"
                              value={milestoneForm.dueDate}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe this milestone..."
                            value={milestoneForm.description}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setMilestoneDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Add Milestone</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones yet. Add one to track payments.</p>
                ) : (
                  contract.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        milestone.isPaid ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {milestone.isPaid ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                          )}
                          {milestone.dueDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              {milestone.isPaid && milestone.paidAt && (
                                <span className="text-emerald-600 ml-2">
                                  • Paid {new Date(milestone.paidAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {milestone.amount && (
                          <span className="text-sm font-semibold">${milestone.amount.toLocaleString()}</span>
                        )}
                        <Button
                          size="sm"
                          variant={milestone.isPaid ? "outline" : "default"}
                          className="text-xs h-7"
                          onClick={() => handleMarkPaid(milestone.id, !milestone.isPaid)}
                        >
                          {milestone.isPaid ? "Unmark" : "Mark Paid"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {totalAmount > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground">
                        {contract.milestones.filter((m) => m.isPaid).length}/{contract.milestones.length} milestones paid
                      </span>
                      <span className="font-medium">
                        ${paidAmount.toLocaleString()} / ${totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments / Redlines */}
          <TabsContent value="comments" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Comments & Redlines</CardTitle>
                  <Dialog open={commentDialog} onOpenChange={setCommentDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add Comment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddComment} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Comment *</Label>
                          <Textarea
                            placeholder="Add your comment or suggested change..."
                            value={commentForm.content}
                            onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-md border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                          <input
                            type="checkbox"
                            id="isRedline"
                            checked={commentForm.isRedline}
                            onChange={(e) => setCommentForm({ ...commentForm, isRedline: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <div>
                            <label htmlFor="isRedline" className="text-sm font-medium text-red-700 dark:text-red-400 cursor-pointer">
                              Mark as Redline
                            </label>
                            <p className="text-xs text-muted-foreground">Track changes suggesting contract modifications</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setCommentDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Add Comment</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  contract.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-lg border ${
                        comment.isRedline
                          ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                          : comment.resolved
                          ? "border-border bg-muted/30 opacity-60"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-7 w-7 mt-0.5">
                            <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700">
                              {(comment.author.name || comment.author.email)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium">
                                {comment.author.name || comment.author.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                              {comment.isRedline && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="h-3 w-3" />
                                  Redline
                                </span>
                              )}
                              {comment.resolved && (
                                <span className="text-xs text-emerald-600">✓ Resolved</span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${comment.isRedline ? "text-red-800 dark:text-red-200" : ""}`}>
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Version History */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Version History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No versions saved yet. Editing the content creates a new version.</p>
                ) : (
                  contract.versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          v{version.version}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Version {version.version}</p>
                          <p className="text-xs text-muted-foreground">
                            by {version.author.name || "Unknown"} •{" "}
                            {new Date(version.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setContentDraft(version.content)
                          setEditingContent(true)
                          toast({ title: "Version loaded", description: `v${version.version} loaded for editing` })
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
