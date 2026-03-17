"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/verify-otp");
    } else {
      alert("Invalid credentials");
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950">
      {/* LEFT SIDE - IMAGE / BRANDING */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1539269071019-8bc6d57b0205?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Crane and trucking operations"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative z-10 text-center px-12 text-white max-w-lg">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
              <Building2 className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Crane & Trucking Financials
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN */}
      <div className="flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-2xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Logo / Branding - Mobile Only */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Crane & Trucking Financials
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Crane and Trucking Management System
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="relative">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />

            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Card Header Accent */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div
                      className={`relative group transition-all duration-300 ${
                        focusedField === "email" ? "transform scale-[1.02]" : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${
                          focusedField === "email"
                            ? "text-blue-400"
                            : "text-slate-500"
                        }`}
                      >
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 
                          focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
                          transition-all duration-300 hover:border-slate-500/50"
                        required
                      />
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                          focusedField === "email" ? "opacity-100" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <div
                      className={`relative group transition-all duration-300 ${
                        focusedField === "password"
                          ? "transform scale-[1.02]"
                          : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${
                          focusedField === "password"
                            ? "text-blue-400"
                            : "text-slate-500"
                        }`}
                      >
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 
                          focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
                          transition-all duration-300 hover:border-slate-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                          focusedField === "password" ? "opacity-100" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full py-3.5 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
                      text-white font-semibold rounded-xl transition-all duration-300 
                      shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 
                      disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none
                      overflow-hidden"
                  >
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Financials: Crane and Trucking
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
