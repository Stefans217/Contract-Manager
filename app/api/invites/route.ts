import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"
import crypto from "crypto"

const createInviteSchema = z.object({
  contractId: z.string().min(1),
  email: z.string().email().optional(),
})

// POST /api/invites — Freelancer creates an invite link for a client
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== UserRole.FREELANCER) {
      return NextResponse.json({ error: "Only freelancers can send invites" }, { status: 403 })
    }

    const body = await request.json()
    const { contractId, email: explicitEmail } = createInviteSchema.parse(body)

    // Verify the freelancer owns this contract and get the linked ClientProfile
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
      include: { client: { select: { email: true } } },
    })
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Use the ClientProfile email if no explicit email provided
    const email = explicitEmail || contract.client.email
    if (!email) {
      return NextResponse.json(
        { error: "No email provided and the client profile has no email. Add an email to the client profile first." },
        { status: 400 }
      )
    }

    // Check if there's already a pending invite for this email + contract
    const existing = await prisma.contractInvite.findFirst({
      where: { contractId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    })
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        token: existing.token,
        inviteUrl: `/invite/${existing.token}`,
        message: "Invite already exists",
      })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const invite = await prisma.contractInvite.create({
      data: {
        token,
        contractId,
        email,
        senderId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return NextResponse.json({
      id: invite.id,
      token: invite.token,
      inviteUrl: `/invite/${invite.token}`,
      expiresAt: invite.expiresAt,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/invites?contractId=xxx — List invites for a contract
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get("contractId")
    if (!contractId) {
      return NextResponse.json({ error: "contractId required" }, { status: 400 })
    }

    // Verify ownership
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
    })
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    const invites = await prisma.contractInvite.findMany({
      where: { contractId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        email: true,
        acceptedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(invites)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
