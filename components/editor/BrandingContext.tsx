"use client";

import { createContext, useContext } from "react";

export type ClientBranding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
};

export const DEFAULT_BRANDING: ClientBranding = {
  primaryColor: "#0f172a",
  secondaryColor: "#ffffff",
  accentColor: "#ea580c",
  fontFamily: "Segoe UI",
  logoUrl: null,
};

const BrandingContext = createContext<ClientBranding>(DEFAULT_BRANDING);

export function BrandingProvider({ branding, children }: { branding: ClientBranding; children: React.ReactNode }) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): ClientBranding {
  return useContext(BrandingContext);
}
