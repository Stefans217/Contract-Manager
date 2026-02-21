import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    { status: "SIGNATURE", count: 1 },
    { status: "PAYMENT", count: 2 },
    { status: "EXECUTION", count: 4 },
    { status: "REVISION", count: 2 },
    { status: "COMPLETION", count: 3 },
    { status: "ARCHIVAL", count: 1 },
    { status: "MAINTENANCE", count: 1 },
  ],
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(MOCK_METRICS)
    }
    const userId = session.user.id
    const [totalClients, totalContracts, contracts, paidMilestones] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.contract.count({ where: { userId } }),
      prisma.contract.findMany({
        where: { userId },
        select: { status: true, value: true },
      }),
      prisma.milestone.count({
        where: { contract: { userId }, isPaid: true },
      }),
    ])
    const activeStatuses = ["EXECUTION", "REVISION", "CONTRACT", "SIGNATURE", "PAYMENT"]
    const activeContracts = contracts.filter((c) => activeStatuses.includes(c.status)).length
    const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0)
    const statusCounts = contracts.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const contractsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }))
    return NextResponse.json({
      totalClients,
      totalContracts,
      activeContracts,
      totalValue,
      paidMilestones,
      contractsByStatus,
    })
  } catch {
    return NextResponse.json(MOCK_METRICS)
  }
}
