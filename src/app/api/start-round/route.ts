import { NextRequest, NextResponse } from "next/server";
import { startRound } from "@/lib/telegram-round-store";

const DEFAULT_ROUND_DURATION_SECONDS = 3 * 60;

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_ROUND_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "TELEGRAM_ROUND_SECRET is not configured on server." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body?.code ?? "").trim().toUpperCase();
    const durationSeconds = Number(body?.durationSeconds ?? DEFAULT_ROUND_DURATION_SECONDS);

    if (!/^[A-Z0-9]{4,16}$/.test(code)) {
      return NextResponse.json(
        { error: "Code must be 4-16 chars using A-Z and 0-9." },
        { status: 400 }
      );
    }

    const round = startRound(code, durationSeconds);
    return NextResponse.json({
      success: true,
      round: {
        active: round.active,
        endTimeMs: round.endTimeMs,
      },
    });
  } catch (error) {
    console.error("POST /api/start-round failed:", error);
    return NextResponse.json({ error: "Failed to start round" }, { status: 500 });
  }
}
