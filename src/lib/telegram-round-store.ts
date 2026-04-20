import { insertUniqueWinner } from "@/lib/telegram-round-db";

type RoundListener = (payload: {
  active: boolean;
  endTimeMs: number | null;
}) => void;

type RoundState = {
  roundId: string | null;
  activeCode: string | null;
  roundEndTimeMs: number | null;
  maxWinners: number;
  listeners: Set<RoundListener>;
};

declare global {
  // eslint-disable-next-line no-var
  var __telegramRoundState: RoundState | undefined;
}

const state: RoundState =
  globalThis.__telegramRoundState ??
  {
    roundId: null,
    activeCode: null,
    roundEndTimeMs: null,
    maxWinners: 5,
    listeners: new Set<RoundListener>(),
  };

globalThis.__telegramRoundState = state;

function expireRoundIfNeeded() {
  if (!state.roundEndTimeMs) return;
  if (Date.now() < state.roundEndTimeMs) return;
  state.roundId = null;
  state.activeCode = null;
  state.roundEndTimeMs = null;
}

export function getRoundState() {
  expireRoundIfNeeded();
  return {
    active: Boolean(state.roundEndTimeMs && Date.now() < state.roundEndTimeMs),
    endTimeMs: state.roundEndTimeMs,
  };
}

export function startRound(code: string, durationSeconds: number) {
  const safeDuration = Math.max(1, Math.floor(durationSeconds));
  const roundCode = code.toUpperCase();
  state.roundId = `round-${Date.now()}`;
  state.activeCode = roundCode;
  state.maxWinners = 5;
  state.roundEndTimeMs = Date.now() + safeDuration * 1000;
  const payload = { active: true, endTimeMs: state.roundEndTimeMs };
  state.listeners.forEach((listener) => listener(payload));
  return payload;
}

export function subscribeRound(listener: RoundListener) {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

export function submitRoundCode(input: {
  code: string;
  authType: "farcaster" | "minipay" | "web";
  participantId: string;
  wallet: string;
  fid: number | null;
}) {
  expireRoundIfNeeded();
  if (!state.roundId || !state.roundEndTimeMs || !state.activeCode) {
    return { ok: false as const, reason: "NO_ACTIVE_ROUND" };
  }
  if (Date.now() >= state.roundEndTimeMs) {
    state.roundId = null;
    state.activeCode = null;
    state.roundEndTimeMs = null;
    return { ok: false as const, reason: "ROUND_EXPIRED" };
  }
  if (state.activeCode.toUpperCase() !== input.code.toUpperCase()) {
    return { ok: false as const, reason: "INVALID_CODE" };
  }
  const insertResult = insertUniqueWinner({
    roundId: state.roundId,
    code: state.activeCode,
    wallet: input.wallet,
    participantId: input.participantId,
    authType: input.authType,
    fid: input.fid,
    maxWinners: state.maxWinners,
  });
  if (insertResult.status === "DUPLICATE_WALLET") {
    return {
      ok: false as const,
      reason: "DUPLICATE_WALLET",
      winner: insertResult.winner,
    };
  }
  if (insertResult.status === "ROUND_FULL") {
    return { ok: false as const, reason: "ROUND_FULL" };
  }
  if (insertResult.winner.winnerRank >= state.maxWinners) {
    state.roundId = null;
    state.activeCode = null;
    state.roundEndTimeMs = null;
    state.listeners.forEach((listener) =>
      listener({
        active: false,
        endTimeMs: null,
      })
    );
  }
  return { ok: true as const, reason: "OK", winner: insertResult.winner };
}
