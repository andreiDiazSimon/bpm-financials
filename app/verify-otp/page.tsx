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
  <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
    {/* Animated Background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-2xl" />
    </div>

    {/* Grid Overlay */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }}
    />

    <div className="w-full max-w-md relative z-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Verify OTP
        </h1>
        <p className="text-sm text-slate-400">
          Enter the verification code sent to your email
        </p>
      </div>

      {/* Card */}
      <div className="relative">
        {/* Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Top Accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

          <div className="p-8">
            <form onSubmit={handleVerify} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 
                  focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
                  transition-all duration-300"
                  required
                />
              </div>

              {/* OTP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  One-Time Password
                </label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 
                  focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
                  transition-all duration-300 tracking-widest text-center"
                  required
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3.5 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
                text-white font-semibold rounded-xl transition-all duration-300 
                shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 
                disabled:opacity-70 disabled:cursor-not-allowed
                overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? "Verifying..." : "Verify OTP"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Crane & Trucking
        </p>
      </div>
    </div>
  </div>
);
}
