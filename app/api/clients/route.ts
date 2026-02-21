import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"

const MOCK_CLIENTS = [
  {
    id: "mock-1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+1 555-0101",
    company: "Acme Corp",
    address: "123 Business Ave, New York, NY 10001",
    notes: "Long-term client with multiple active contracts",
    userId: "mock-user",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-01"),
    _count: { contracts: 5 },
  },
  {
    id: "mock-2",
    name: "TechStart Inc.",
    email: "legal@techstart.io",
    phone: "+1 555-0202",
    company: "TechStart Inc.",
    address: "456 Innovation Blvd, San Francisco, CA 94107",
    notes: "Startup client - fast turnaround required",
    userId: "mock-user",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-05-15"),
    _count: { contracts: 3 },
  },
  {
    id: "mock-3",
    name: "Global Solutions Ltd",
    email: "contracts@globalsolutions.com",
    phone: "+1 555-0303",
    company: "Global Solutions Ltd",
    address: "789 Enterprise Way, Chicago, IL 60601",
    notes: "International contracts in multiple currencies",
    userId: "mock-user",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-06-10"),
    _count: { contracts: 7 },
  },
]

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(MOCK_CLIENTS)
    }
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { contracts: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json(MOCK_CLIENTS)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const data = createClientSchema.parse(body)
    const client = await prisma.client.create({
      data: { ...data, userId: session.user.id },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
