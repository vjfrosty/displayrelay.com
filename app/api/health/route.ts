import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "displayrelay",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
