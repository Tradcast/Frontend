import { NextRequest, NextResponse } from "next/server";
import { submitRoundCode } from "@/lib/telegram-round-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body?.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ ok: false, error: "Code is required." }, { status: 400 });
    }

    const result = submitRoundCode(code);
    if (!result.ok) {
      if (result.reason === "NO_ACTIVE_ROUND" || result.reason === "ROUND_EXPIRED") {
        return NextResponse.json(
          { ok: false, error: "No active round right now." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Code accepted." });
  } catch (error) {
    console.error("POST /api/round/submit failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to submit code." }, { status: 500 });
  }
}
