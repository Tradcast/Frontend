import { NextRequest, NextResponse } from "next/server";
import { submitRoundCode } from "@/lib/telegram-round-store";
import { verifyAuth } from "@/lib/quick-auth-utils";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    const body = await req.json();
    const code = String(body?.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ ok: false, error: "Code is required." }, { status: 400 });
    }

    const participantId =
      auth.type === "farcaster" && auth.fid != null
        ? `fid:${String(auth.fid)}`
        : auth.wallet
        ? auth.wallet.toLowerCase()
        : "unknown";

    if (!auth.wallet) {
      return NextResponse.json(
        { ok: false, error: "Wallet address is required to submit round code." },
        { status: 400 }
      );
    }

    const result = submitRoundCode({
      code,
      authType: auth.type,
      participantId,
      wallet: auth.wallet,
      fid: auth.fid ?? null,
    });
    if (!result.ok) {
      if (result.reason === "NO_ACTIVE_ROUND" || result.reason === "ROUND_EXPIRED") {
        return NextResponse.json(
          { ok: false, error: "No active round right now." },
          { status: 400 }
        );
      }
      if (result.reason === "DUPLICATE_WALLET") {
        return NextResponse.json(
          {
            ok: false,
            error: "You already submitted a correct code for this round.",
          },
          { status: 409 }
        );
      }
      if (result.reason === "ROUND_FULL") {
        return NextResponse.json(
          {
            ok: false,
            error: "Round full. Top 5 winners already locked.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Accepted. You are winner #${result.winner?.winnerRank ?? "?"}.`,
      winnerRank: result.winner?.winnerRank ?? null,
    });
  } catch (error) {
    console.error("POST /api/round/submit failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to submit code." }, { status: 500 });
  }
}
