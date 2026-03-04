import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, code } = await req.json()

  const otp = await prisma.otpCode.findFirst({
    where: { email, code },
  })

  if (!otp) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  if (otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 })
  }

  // Delete used OTP
  await prisma.otpCode.deleteMany({ where: { email } })

  // 🔥 Return success WITH user data
  const user = await prisma.user.findUnique({
    where: { email },
  })

  return NextResponse.json({
    success: true,
    user: {
      id: user?.id,
      email: user?.email,
    },
  })
}