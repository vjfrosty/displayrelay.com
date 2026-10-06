import bcrypt from "bcrypt";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const admin = await prisma.adminUser.findUnique({ where: { email: credentials.email } });
        if (!admin || admin.status !== "active") return null;

        const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          clientId: admin.clientId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.clientId = user.clientId;
        token.isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.clientId = token.clientId;
      session.user.isSuperAdmin = token.isSuperAdmin;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
