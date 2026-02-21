import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }
    const hashedPassword = await bcryptjs.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
