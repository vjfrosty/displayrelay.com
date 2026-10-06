import { describe, expect, it } from "vitest";
import { deleteFile, getPublicUrl, listFiles, upload } from "./storage";

describe("storage", () => {
  it("uploads, lists, and deletes a real object against the live MinIO container", async () => {
    const key = `test/${crypto.randomUUID()}.txt`;
    const body = Buffer.from("hello display relay");

    await upload(body, "text/plain", key);

    const listed = await listFiles("test/");
    expect(listed).toContain(key);

    expect(getPublicUrl(key)).toBe(`${process.env.MINIO_PUBLIC_URL}/${key}`);

    await deleteFile(key);
    const afterDelete = await listFiles("test/");
    expect(afterDelete).not.toContain(key);
  });
});
