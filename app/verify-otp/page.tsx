"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function VerifyOtpPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // 1️⃣ Verify OTP with backend
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })

    if (!res.ok) {
      alert("Invalid or expired code")
      setLoading(false)
      return
    }

    // 2️⃣ Now complete login using NextAuth
    await signIn("credentials", {
      email,
      password: "dummy", // we bypass because password already verified earlier
      redirect: true,
      callbackUrl: "/dashboard",
    })

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-[#1a1a1a] font-semibold mb-1">
              Verify OTP
            </h1>
            <p className="text-sm text-[#5c5c5c]">
              Enter the verification code sent to your email
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#8c8c8c] rounded-sm text-[#1a1a1a] placeholder-[#5c5c5c] focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors duration-200 text-sm"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Enter OTP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#8c8c8c] rounded-sm text-[#1a1a1a] placeholder-[#5c5c5c] focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors duration-200 text-sm"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0067b8] hover:bg-[#005a9e] text-white text-sm font-semibold rounded-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-[#5c5c5c]">© Crane and Trucking</p>
        </div>
      </div>
    </div>
  )
}
