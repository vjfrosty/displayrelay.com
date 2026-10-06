import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export function isAdmin(session: Session | null): boolean {
  return session?.user != null;
}

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.isSuperAdmin === true;
}
