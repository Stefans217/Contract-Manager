import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ContractStatus } from "@prisma/client"

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clientId: z.string().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const contract = await prisma.contract.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: true,
        milestones: { orderBy: { dueDate: "asc" } },
        comments: {
          include: { author: { select: { name: true, email: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        versions: {
          include: { author: { select: { name: true } } },
          orderBy: { version: "desc" },
        },
      },
    })
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(contract)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const data = updateContractSchema.parse(body)

    // Save version if content changed
    if (data.content) {
      const current = await prisma.contract.findFirst({ where: { id, userId: session.user.id } })
      if (current && current.content !== data.content) {
        const latestVersion = await prisma.contractVersion.findFirst({
          where: { contractId: id },
          orderBy: { version: "desc" },
        })
        await prisma.contractVersion.create({
          data: {
            content: data.content,
            version: (latestVersion?.version ?? 0) + 1,
            contractId: id,
            authorId: session.user.id,
          },
        })
      }
    }

    const contract = await prisma.contract.updateMany({
      where: { id, userId: session.user.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status as ContractStatus }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.currency !== undefined && { currency: data.currency }),
        // Preserve existing value when not provided; pass null to explicitly clear
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
    })
    if (contract.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    await prisma.contract.deleteMany({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
