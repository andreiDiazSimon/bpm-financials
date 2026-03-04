"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   // const result = await signIn("credentials", {
  //   //   email,
  //   //   password,
  //   //   redirect: true,
  //   //   callbackUrl: "/dashboard",
  //   // });

  //   const result = await fetch("/api/login", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ email, password }),
  //   });

  //   router.push("/verify-otp");

  //   console.log(result);
  //   setIsLoading(false);
  // }

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
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-[#1a1a1a] font-semibold mb-1">
              Sign in
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#8c8c8c] rounded-sm text-[#1a1a1a] placeholder-[#5c5c5c] focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors duration-200 text-sm"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0067b8] hover:bg-[#005a9e] text-white text-sm font-semibold rounded-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-[#5c5c5c]">© Crane and Trucking</p>
        </div>
      </div>
    </div>
  );
}
