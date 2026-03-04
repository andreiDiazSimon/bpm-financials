import { prisma } from "@/lib/prisma"
import { sendOtpEmail } from "@/lib/mailer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Delete old OTPs
  await prisma.otpCode.deleteMany({ where: { email } })

  // Save new OTP
  await prisma.otpCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  })

  await sendOtpEmail(email, code)

  return NextResponse.json({ requiresOtp: true })
}