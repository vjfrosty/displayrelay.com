import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { getSetting } from "@/lib/settings";
import { checkStorageQuota } from "@/lib/usage";
import { getPublicUrl, upload } from "@/lib/storage";
import { mediaQuerySchema } from "@/lib/validation/media";

const PAGE_SIZE = 50;

function serializeAsset<T extends { sizeBytes: bigint }>(asset: T) {
  return { ...asset, sizeBytes: Number(asset.sizeBytes) };
}

export const GET = withClientAuth(async (req: NextRequest, { clientId }) => {
  const parsed = mediaQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { folder, search, sort, page } = parsed.data;

  const where = {
    ...(folder ? { folderId: folder } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [assets, total] = await Promise.all([
    scopedPrisma(clientId).mediaAsset.findMany({
      where,
      orderBy: { [sort]: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    scopedPrisma(clientId).mediaAsset.count({ where }),
  ]);

  return NextResponse.json({
    items: assets.map(serializeAsset),
    page,
    pageSize: PAGE_SIZE,
    total,
  });
});

export const POST = withClientAuth(async (req: NextRequest, { clientId }) => {
  const formData = await req.formData();
  const file = formData.get("file");
  const folderId = formData.get("folderId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedMimeTypes = (await getSetting("media.allowed_mime_types")) as string[];
  if (!allowedMimeTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const maxUploadMb = (await getSetting("media.max_upload_mb")) as number;
  if (file.size > maxUploadMb * 1024 * 1024) {
    return NextResponse.json({ error: `File exceeds the ${maxUploadMb}MB limit` }, { status: 413 });
  }

  const quota = await checkStorageQuota(clientId, file.size);
  if (!quota.allowed) {
    return NextResponse.json({ error: "Storage quota exceeded", upgradeUrl: quota.upgradeUrl }, { status: 403 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `clients/${clientId}/${folderId ? folderId.toString() : "root"}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await upload(buffer, file.type, objectKey);

  const publicUrl = getPublicUrl(objectKey);
  const isImage = file.type.startsWith("image/");

  const asset = await prisma.mediaAsset.create({
    data: {
      clientId,
      folderId: folderId ? folderId.toString() : null,
      name: file.name,
      fileName: file.name,
      objectKey,
      publicUrl,
      thumbnailUrl: isImage ? publicUrl : null,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json(serializeAsset(asset), { status: 201 });
});
