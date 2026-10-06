"use client";

import { useBranding } from "@/components/editor/BrandingContext";

export function LogoBlock() {
  const branding = useBranding();

  if (!branding.logoUrl) {
    return <div className="editor-block-logo">LOGO</div>;
  }

  // eslint-disable-next-line @next/next/no-img-element -- canvas preview, not a Next-optimized asset
  return <img className="editor-block-logo-image" src={branding.logoUrl} alt="" draggable={false} />;
}
