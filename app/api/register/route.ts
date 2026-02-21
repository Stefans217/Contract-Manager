import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["FREELANCER", "CLIENT"]).optional(),
  inviteToken: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, inviteToken } = registerSchema.parse(body)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // If registering via invite, validate the token and force CLIENT role
    let resolvedRole = role === "CLIENT" ? UserRole.CLIENT : UserRole.FREELANCER
    if (inviteToken) {
      const invite = await prisma.contractInvite.findUnique({
        where: { token: inviteToken },
      })
      if (invite && !invite.acceptedAt && invite.expiresAt > new Date() && invite.email === email) {
        resolvedRole = UserRole.CLIENT
      }
    }

    const hashedPassword = await bcryptjs.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: resolvedRole,
      },
    })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
