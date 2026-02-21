import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ContractStatus } from "@prisma/client"

const MOCK_CONTRACTS = [
  {
    id: "contract-1",
    title: "Website Redesign Project",
    description: "Complete redesign of corporate website with modern UI/UX",
    content: "This agreement is entered into between Acme Corporation and the service provider...\n\n## Scope of Work\n\nThe service provider agrees to deliver a complete website redesign including:\n- New visual design system\n- Responsive layouts for all screen sizes\n- Performance optimization\n- SEO improvements\n\n## Payment Terms\n\nTotal project value: $45,000\n- 30% upfront: $13,500\n- 40% at midpoint: $18,000\n- 30% on completion: $13,500",
    status: "EXECUTION",
    value: 45000,
    currency: "USD",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-07-31"),
    clientId: "mock-1",
    userId: "mock-user",
    client: { id: "mock-1", name: "Acme Corporation", company: "Acme Corp", email: "contact@acme.com" },
    milestones: [
      { id: "m1", title: "Design Mockups", amount: 13500, dueDate: new Date("2024-04-01"), isPaid: true, paidAt: new Date("2024-04-02"), contractId: "contract-1", description: "Initial design mockups and wireframes", createdAt: new Date(), updatedAt: new Date() },
      { id: "m2", title: "Development Phase 1", amount: 18000, dueDate: new Date("2024-05-15"), isPaid: true, paidAt: new Date("2024-05-16"), contractId: "contract-1", description: "Core development work", createdAt: new Date(), updatedAt: new Date() },
      { id: "m3", title: "Final Delivery", amount: 13500, dueDate: new Date("2024-07-31"), isPaid: false, paidAt: null, contractId: "contract-1", description: "Final delivery and launch", createdAt: new Date(), updatedAt: new Date() },
    ],
    comments: [
      { id: "c1", content: "The hero section needs to be more impactful. Consider using a video background.", isRedline: false, resolved: false, contractId: "contract-1", authorId: "mock-user", author: { name: "John Smith", email: "john@acme.com", image: null }, createdAt: new Date("2024-04-10"), updatedAt: new Date("2024-04-10") },
      { id: "c2", content: "Section 3.2: Change 'weekly updates' to 'bi-weekly updates'", isRedline: true, resolved: false, contractId: "contract-1", authorId: "mock-user", author: { name: "Sarah Johnson", email: "sarah@acme.com", image: null }, createdAt: new Date("2024-04-12"), updatedAt: new Date("2024-04-12") },
    ],
    versions: [
      { id: "v1", version: 1, content: "Initial contract draft...", contractId: "contract-1", authorId: "mock-user", author: { name: "John Smith" }, createdAt: new Date("2024-03-01") },
    ],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-06-15"),
  },
  {
    id: "contract-2",
    title: "Mobile App Development",
    description: "iOS and Android app for customer portal",
    content: "Mobile application development agreement...",
    status: "PROPOSAL",
    value: 120000,
    currency: "USD",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-12-31"),
    clientId: "mock-2",
    userId: "mock-user",
    client: { id: "mock-2", name: "TechStart Inc.", company: "TechStart Inc.", email: "legal@techstart.io" },
    milestones: [],
    comments: [],
    versions: [],
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "contract-3",
    title: "Annual Maintenance Contract",
    description: "Ongoing support and maintenance services",
    content: "Annual maintenance agreement...",
    status: "MAINTENANCE",
    value: 24000,
    currency: "USD",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    clientId: "mock-3",
    userId: "mock-user",
    client: { id: "mock-3", name: "Global Solutions Ltd", company: "Global Solutions Ltd", email: "contracts@globalsolutions.com" },
    milestones: [],
    comments: [],
    versions: [],
    createdAt: new Date("2023-12-15"),
    updatedAt: new Date("2024-01-02"),
  },
]

const createContractSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clientId: z.string().min(1),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(MOCK_CONTRACTS)
    }
    const contracts = await prisma.contract.findMany({
      where: { userId: session.user.id },
      include: {
        client: { select: { name: true, company: true, email: true } },
        milestones: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(contracts)
  } catch {
    return NextResponse.json(MOCK_CONTRACTS)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const data = createContractSchema.parse(body)
    const contract = await prisma.contract.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        status: (data.status as ContractStatus) || ContractStatus.LEAD,
        value: data.value,
        currency: data.currency || "USD",
        clientId: data.clientId,
        userId: session.user.id,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
