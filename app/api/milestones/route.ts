import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  contractId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const data = createMilestoneSchema.parse(body)
    // Verify the user owns the contract
    const contract = await prisma.contract.findFirst({
      where: { id: data.contractId, userId: session.user.id },
    })
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
