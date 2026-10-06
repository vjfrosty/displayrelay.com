import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      clientId: string | null;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    clientId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    clientId: string | null;
    isSuperAdmin: boolean;
  }
}
