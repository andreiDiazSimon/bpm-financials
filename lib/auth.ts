import { prisma } from "@/lib/prisma";
// import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
  if (!credentials) return null

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  })

  if (!user) return null

  return {
    id: user.id.toString(),
    email: user.email,
  }
},
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};
