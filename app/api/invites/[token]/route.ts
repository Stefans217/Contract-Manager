import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/generated/prisma"

// POST /api/invites/[token]/accept — Accept an invite and link ClientProfile to User
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await auth()
    const { token } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invite = await prisma.contractInvite.findUnique({
      where: { token },
      include: {
        contract: {
          select: { id: true, title: true, userId: true, clientId: true },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 })
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    // Verify the logged-in user's email matches the invite email
    if (session.user.email !== invite.email) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      )
    }

    // Don't let the freelancer accept their own invite
    if (invite.contract.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot accept your own invite" },
        { status: 400 }
      )
    }

    // Check if ClientProfile is already linked to this user
    const client = await prisma.client.findUnique({
      where: { id: invite.contract.clientId },
    })

    if (client?.linkedUserId === session.user.id) {
      // Already linked — just mark invite as accepted
      await prisma.contractInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      })
      return NextResponse.json({
        message: "Already linked to this contract",
        contractId: invite.contractId,
        contractTitle: invite.contract.title,
      })
    }

    // Link ClientProfile to User, mark invite accepted, ensure role is CLIENT,
    // and create ContractParty for signing/party tracking — all atomically
    await prisma.$transaction([
      // Step 5: ClientProfile links to User
      prisma.client.update({
        where: { id: invite.contract.clientId },
        data: { linkedUserId: session.user.id },
      }),
      // Mark invite as accepted
      prisma.contractInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
      // Ensure user role is CLIENT (step 6: permissions enforced via role)
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: UserRole.CLIENT },
      }),
      // Create ContractParty for signing/party tracking
      prisma.contractParty.upsert({
        where: {
          contractId_userId: {
            contractId: invite.contractId,
            userId: session.user.id,
          },
        },
        create: {
          contractId: invite.contractId,
          userId: session.user.id,
          role: "client",
        },
        update: {},
      }),
    ])

    return NextResponse.json({
      message: "Successfully linked to contract",
      contractId: invite.contractId,
      contractTitle: invite.contract.title,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/invites/[token] — Get invite details (for the accept page)
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const invite = await prisma.contractInvite.findUnique({
      where: { token },
      include: {
        contract: { select: { id: true, title: true, description: true } },
        sender: { select: { name: true } },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      contractTitle: invite.contract.title,
      contractDescription: invite.contract.description,
      senderName: invite.sender.name,
      accepted: !!invite.acceptedAt,
      expired: invite.expiresAt < new Date(),
      expiresAt: invite.expiresAt,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
