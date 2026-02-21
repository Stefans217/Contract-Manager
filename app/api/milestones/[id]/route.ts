import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"

const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  isPaid: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== UserRole.FREELANCER) {
      return NextResponse.json({ error: "Only freelancers can edit milestones" }, { status: 403 })
    }
    const body = await request.json()
    const data = updateMilestoneSchema.parse(body)
    const milestone = await prisma.milestone.findFirst({
      where: { id },
      include: { contract: { select: { userId: true } } },
    })
    if (!milestone || milestone.contract.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidAt: data.isPaid && !milestone.isPaid ? new Date() : milestone.paidAt,
      },
    })
    return NextResponse.json(updated)
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
    if (session.user.role !== UserRole.FREELANCER) {
      return NextResponse.json({ error: "Only freelancers can delete milestones" }, { status: 403 })
    }
    const milestone = await prisma.milestone.findFirst({
      where: { id },
      include: { contract: { select: { userId: true } } },
    })
    if (!milestone || milestone.contract.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    await prisma.milestone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
