"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMiniApp } from "@/contexts/miniapp-context";
import { getAuthFetch } from "@/lib/auth-fetch";
import { useTranslations } from "next-intl";
import { TelegramPrizeHelpModal } from "@/components/TelegramPrizeHelpModal";

/**
 * Telegram random-time prize code entry (SSE + submit). Used on Airdrop page.
 */
export function TelegramPrizeCodeCard() {
  const { isMiniPay, isWeb } = useMiniApp();
  const { address } = useAccount();
  const t = useTranslations("airdrop");

  const [roundCodeInput, setRoundCodeInput] = useState("");
  const [roundEndTimeMs, setRoundEndTimeMs] = useState<number | null>(null);
  const [roundTimeLeftSeconds, setRoundTimeLeftSeconds] = useState(0);
  const [roundSubmitStatus, setRoundSubmitStatus] = useState<{
    kind: "idle" | "success" | "error";
    text: string;
  }>({ kind: "idle", text: "" });
  const [showRoundCodeHelp, setShowRoundCodeHelp] = useState(false);

  const authFetch = React.useCallback(
    (url: string, options: RequestInit = {}) => {
      return getAuthFetch(address, isMiniPay, isWeb)(url, options);
    },
    [address, isMiniPay, isWeb]
  );

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type?: string;
          active?: boolean;
          endTimeMs?: number | null;
        };

        if (data.type === "round-state" || data.type === "new-round") {
          setRoundEndTimeMs(data.active ? (data.endTimeMs ?? null) : null);
          setRoundSubmitStatus({ kind: "idle", text: "" });
          setRoundCodeInput("");
        }
      } catch (error) {
        console.warn("Failed to parse /api/events payload:", error);
      }
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      if (!roundEndTimeMs) {
        setRoundTimeLeftSeconds(0);
        return;
      }
      const secondsLeft = Math.max(0, Math.ceil((roundEndTimeMs - Date.now()) / 1000));
      setRoundTimeLeftSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setRoundEndTimeMs(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [roundEndTimeMs]);

  const isRoundActive = roundTimeLeftSeconds > 0;

  const formatRoundTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleRoundCodeSubmit = useCallback(async () => {
    const code = roundCodeInput.trim().toUpperCase();
    if (!code || !isRoundActive) return;
    try {
      setRoundSubmitStatus({ kind: "idle", text: "" });
      const res = await authFetch("/api/round/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setRoundSubmitStatus({
          kind: "error",
          text: data?.error || "Could not submit code. Try again.",
        });
        return;
      }
      setRoundSubmitStatus({ kind: "success", text: data?.message || "Code accepted." });
    } catch (error) {
      console.error("Failed to submit round code:", error);
      setRoundSubmitStatus({ kind: "error", text: "Network error while submitting code." });
    }
  }, [authFetch, isRoundActive, roundCodeInput]);

  return (
    <>
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-card px-3 py-3 text-left">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-gray-800">{t("telegramPrizeCardTitle")}</p>
            {isRoundActive ? (
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {t("telegramPrizeLiveNow", { timer: formatRoundTimer(roundTimeLeftSeconds) })}
              </p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-600 font-semibold leading-tight">
                  {t("telegramPrizeWaitingHeadline")}
                </p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {t("telegramPrizeWaitingDescription")}
                </p>
              </div>
            )}
          </div>
          <span
            className={`text-[10px] px-2 py-1 rounded-full border font-semibold shrink-0 ${
              isRoundActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            {isRoundActive ? t("telegramPrizeStatusLive") : t("telegramPrizeStatusWaiting")}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={16}
            value={roundCodeInput}
            disabled={!isRoundActive}
            onChange={(e) => setRoundCodeInput(e.target.value.toUpperCase())}
            placeholder={t("telegramPrizeCodePlaceholder")}
            className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#d76afd]/30"
          />
          <button
            type="button"
            onClick={() => setShowRoundCodeHelp(true)}
            className="shrink-0 w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-bold hover:bg-white hover:border-[#d76afd]/40 hover:text-[#d76afd] transition-colors"
            aria-label={t("telegramPrizeHelpAria")}
          >
            ?
          </button>
          <button
            type="button"
            onClick={handleRoundCodeSubmit}
            disabled={!isRoundActive || !roundCodeInput.trim()}
            className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold bg-[#d76afd] text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {t("telegramPrizeSubmit")}
          </button>
        </div>

        {roundSubmitStatus.kind !== "idle" && (
          <p
            className={`mt-2 text-[10px] font-semibold ${
              roundSubmitStatus.kind === "success" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {roundSubmitStatus.text}
          </p>
        )}
      </div>

      <TelegramPrizeHelpModal open={showRoundCodeHelp} onClose={() => setShowRoundCodeHelp(false)} />
    </>
  );
}
