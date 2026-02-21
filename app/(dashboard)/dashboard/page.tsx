import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Users, DollarSign, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"

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

const MOCK_METRICS = {
  totalClients: 12,
  totalContracts: 28,
  activeContracts: 8,
  totalValue: 485000,
  paidMilestones: 34,
  contractsByStatus: [
    { status: "LEAD", count: 4 },
    { status: "QUALIFICATION", count: 3 },
    { status: "PROPOSAL", count: 2 },
    { status: "CONTRACT", count: 5 },
    { status: "EXECUTION", count: 4 },
    { status: "COMPLETION", count: 3 },
    { status: "MAINTENANCE", count: 1 },
  ],
}

const RECENT_CONTRACTS = [
  { id: "contract-1", title: "Website Redesign Project", client: "Acme Corporation", status: "EXECUTION", value: 45000, updatedAt: "2024-06-15" },
  { id: "contract-2", title: "Mobile App Development", client: "TechStart Inc.", status: "PROPOSAL", value: 120000, updatedAt: "2024-06-01" },
  { id: "contract-3", title: "Annual Maintenance Contract", client: "Global Solutions Ltd", status: "MAINTENANCE", value: 24000, updatedAt: "2024-01-02" },
  { id: "contract-4", title: "Brand Identity Design", client: "Acme Corporation", status: "COMPLETION", value: 18500, updatedAt: "2024-05-20" },
  { id: "contract-5", title: "Data Analytics Platform", client: "Global Solutions Ltd", status: "CONTRACT", value: 85000, updatedAt: "2024-04-10" },
]

export default async function DashboardPage() {
  let metrics = MOCK_METRICS
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/dashboard`, {
      cache: "no-store",
    })
    if (res.ok) {
      metrics = await res.json()
    }
  } catch {
    // use mock data
  }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalContracts}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.activeContracts} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all contracts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics.totalValue / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground mt-1">Combined contract value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Milestones</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.paidMilestones}</div>
              <p className="text-xs text-muted-foreground mt-1">Milestones completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Recent Contracts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Contracts</CardTitle>
                  <Link
                    href="/contracts"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RECENT_CONTRACTS.map((contract) => (
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
                          {contract.client}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[contract.status] || "bg-gray-100 text-gray-700"}`}
                          >
                            {contract.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          ${contract.value.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Contracts by Status */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">By Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.contractsByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(count / Math.max(...metrics.contractsByStatus.map((s) => s.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
