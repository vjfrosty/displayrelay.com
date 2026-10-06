import { prisma } from "@/lib/db";
import { DEFAULT_BRANDING, type ClientBranding } from "@/components/editor/BrandingContext";

export async function getClientBranding(clientId: string): Promise<ClientBranding> {
  const row = await prisma.clientBranding.findUnique({ where: { clientId } });
  if (!row) return DEFAULT_BRANDING;
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor,
    fontFamily: row.fontFamily,
    logoUrl: row.logoUrl,
  };
}
