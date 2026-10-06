import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { mineOrGlobalWhere, scopedPrisma } from "./tenant";

const CLIENT_A = "test-tenant-a";
const CLIENT_B = "test-tenant-b";
let screenAId: string;
let screenBId: string;
let mediaAssetAId: string;
let mediaAssetBId: string;

const templateIds: string[] = [];
let globalTemplateId: string;
let templateAId: string;
let templateBId: string;

beforeAll(async () => {
  const [screenA, screenB] = await Promise.all([
    prisma.screen.create({ data: { clientId: CLIENT_A, name: "Tenant A Screen" } }),
    prisma.screen.create({ data: { clientId: CLIENT_B, name: "Tenant B Screen" } }),
  ]);
  screenAId = screenA.id;
  screenBId = screenB.id;

  const templateData = (clientId: string | null, name: string) => ({
    clientId,
    name,
    category: "test",
    editorState: {},
    htmlContent: "<div></div>",
  });
  const [globalTemplate, templateA, templateB] = await Promise.all([
    prisma.template.create({ data: templateData(null, "Global Template") }),
    prisma.template.create({ data: templateData(CLIENT_A, "Tenant A Template") }),
    prisma.template.create({ data: templateData(CLIENT_B, "Tenant B Template") }),
  ]);
  globalTemplateId = globalTemplate.id;
  templateAId = templateA.id;
  templateBId = templateB.id;
  templateIds.push(globalTemplateId, templateAId, templateBId);

  const mediaAssetData = (clientId: string, name: string) => ({
    clientId,
    name,
    fileName: `${name}.png`,
    objectKey: `test/${clientId}/${crypto.randomUUID()}.png`,
    publicUrl: "http://localhost/assets/test",
    mimeType: "image/png",
    sizeBytes: 1024,
  });
  const [mediaAssetA, mediaAssetB] = await Promise.all([
    prisma.mediaAsset.create({ data: mediaAssetData(CLIENT_A, "Tenant A Asset") }),
    prisma.mediaAsset.create({ data: mediaAssetData(CLIENT_B, "Tenant B Asset") }),
  ]);
  mediaAssetAId = mediaAssetA.id;
  mediaAssetBId = mediaAssetB.id;
});

afterAll(async () => {
  await prisma.screen.deleteMany({ where: { clientId: { in: [CLIENT_A, CLIENT_B] } } });
  await prisma.template.deleteMany({ where: { id: { in: templateIds } } });
  await prisma.mediaAsset.deleteMany({ where: { id: { in: [mediaAssetAId, mediaAssetBId] } } });
  await prisma.$disconnect();
});

describe("scopedPrisma", () => {
  it("only returns rows belonging to the scoped tenant", async () => {
    const rows = await scopedPrisma(CLIENT_A).screen.findMany();
    expect(rows.map((r) => r.id)).toContain(screenAId);
    expect(rows.map((r) => r.id)).not.toContain(screenBId);
  });

  it("does not let one tenant update another tenant's row", async () => {
    const result = await scopedPrisma(CLIENT_B).screen.updateMany({
      where: { id: screenAId },
      data: { name: "hijacked" },
    });
    expect(result.count).toBe(0);

    const unchanged = await prisma.screen.findUniqueOrThrow({ where: { id: screenAId } });
    expect(unchanged.name).toBe("Tenant A Screen");
  });

  it("does not let one tenant delete another tenant's row", async () => {
    const result = await scopedPrisma(CLIENT_B).screen.deleteMany({ where: { id: screenAId } });
    expect(result.count).toBe(0);

    const stillThere = await prisma.screen.findUnique({ where: { id: screenAId } });
    expect(stillThere).not.toBeNull();
  });

  it("refuses to auto-scope models with a nullable clientId instead of silently returning everything", async () => {
    await expect(scopedPrisma(CLIENT_A).template.findMany()).rejects.toThrow(
      /does not support "Template"/,
    );
  });

  it("scopes count() to the tenant, not the whole table", async () => {
    const countA = await scopedPrisma(CLIENT_A).screen.count();
    const countB = await scopedPrisma(CLIENT_B).screen.count();
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it("isolates media assets across tenants (Phase 2 completion gate)", async () => {
    const rows = await scopedPrisma(CLIENT_A).mediaAsset.findMany();
    expect(rows.map((r) => r.id)).toContain(mediaAssetAId);
    expect(rows.map((r) => r.id)).not.toContain(mediaAssetBId);

    const crossTenantDelete = await scopedPrisma(CLIENT_B).mediaAsset.deleteMany({
      where: { id: mediaAssetAId },
    });
    expect(crossTenantDelete.count).toBe(0);
  });
});

describe("mineOrGlobalWhere", () => {
  it("includes the caller's own rows and global rows, excludes other tenants' rows", async () => {
    const rows = await prisma.template.findMany({ where: mineOrGlobalWhere(CLIENT_A) });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(globalTemplateId);
    expect(ids).toContain(templateAId);
    expect(ids).not.toContain(templateBId);
  });
});
