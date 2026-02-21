import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCommentSchema = z.object({
  content: z.string().min(1),
  isRedline: z.boolean().optional(),
  contractId: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get("contractId")
    if (!contractId) return NextResponse.json({ error: "contractId required" }, { status: 400 })
    const comments = await prisma.comment.findMany({
      where: { contractId, contract: { userId: session.user.id } },
      include: { author: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(comments)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const data = createCommentSchema.parse(body)
    const contract = await prisma.contract.findFirst({
      where: { id: data.contractId, userId: session.user.id },
    })
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    const comment = await prisma.comment.create({
      data: { ...data, authorId: session.user.id },
      include: { author: { select: { name: true, email: true, image: true } } },
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
