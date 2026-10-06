import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { deleteFile } from "@/lib/storage";

type Params = { clientId: string; assetId: string };

export const DELETE = withClientAuth<Params>(async (_req: NextRequest, { clientId, assetId }) => {
  const asset = await scopedPrisma(clientId).mediaAsset.findFirst({ where: { id: assetId } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  await deleteFile(asset.objectKey);
  await scopedPrisma(clientId).mediaAsset.deleteMany({ where: { id: assetId } });

  return new NextResponse(null, { status: 204 });
});
