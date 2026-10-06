import { NextResponse, type NextRequest } from "next/server";
import { checkCode, consumeCode, generateCode } from "../../../../../lib/pairing";

// TV calls this with no query param to request a fresh pairing code.
export async function POST() {
  const { code, expiresAt } = await generateCode();
  return NextResponse.json({ code, expiresAt });
}

// TV polls this with ?code= every 3s to check whether an admin has claimed it.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const entry = await checkCode(code);
  if (!entry) {
    return NextResponse.json({ error: "Code expired or invalid" }, { status: 410 });
  }

  if (!entry.claimed) {
    return NextResponse.json({ claimed: false });
  }

  const consumed = await consumeCode(code);
  if (!consumed) {
    // Claimed by a concurrent poll a moment earlier — treat as expired.
    return NextResponse.json({ error: "Code expired or invalid" }, { status: 410 });
  }

  return NextResponse.json(consumed);
}
