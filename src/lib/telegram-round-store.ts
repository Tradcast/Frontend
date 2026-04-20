type RoundListener = (payload: {
  active: boolean;
  endTimeMs: number | null;
}) => void;

type RoundState = {
  activeCode: string | null;
  roundEndTimeMs: number | null;
  listeners: Set<RoundListener>;
};

declare global {
  // eslint-disable-next-line no-var
  var __telegramRoundState: RoundState | undefined;
}

const state: RoundState =
  globalThis.__telegramRoundState ??
  {
    activeCode: null,
    roundEndTimeMs: null,
    listeners: new Set<RoundListener>(),
  };

globalThis.__telegramRoundState = state;

function expireRoundIfNeeded() {
  if (!state.roundEndTimeMs) return;
  if (Date.now() < state.roundEndTimeMs) return;
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
  state.activeCode = code;
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

export function submitRoundCode(code: string) {
  expireRoundIfNeeded();
  if (!state.roundEndTimeMs || !state.activeCode) {
    return { ok: false as const, reason: "NO_ACTIVE_ROUND" };
  }
  if (Date.now() >= state.roundEndTimeMs) {
    state.activeCode = null;
    state.roundEndTimeMs = null;
    return { ok: false as const, reason: "ROUND_EXPIRED" };
  }
  if (state.activeCode.toUpperCase() !== code.toUpperCase()) {
    return { ok: false as const, reason: "INVALID_CODE" };
  }
  return { ok: true as const, reason: "OK" };
}
