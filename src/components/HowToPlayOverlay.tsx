"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const STORAGE_KEY = "tradcast_how_to_play_seen";

// Trading buttons matching about page / tradearea style
const TradingButtonsPreview = () => (
  <div className="flex justify-center gap-2 sm:gap-3 py-3">
    <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow">
      LONG
    </div>
    <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow">
      SHORT
    </div>
    <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow">
      CLOSE
    </div>
  </div>
);

// 20x leverage badge
const LeverageBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm border border-orange-200">
    20× leverage
  </span>
);

// Balance visual: bar + amounts
const BalanceVisual = () => (
  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Balance</span>
      <span className="font-bold text-gray-800">🪙1,000</span>
    </div>
    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full w-full bg-gradient-to-r from-[#d76afd] to-[#bdecf6] rounded-full" style={{ width: "100%" }} />
    </div>
    <div className="flex justify-between text-xs text-gray-500">
      <span>Free: 🪙1,000</span>
      <span>In position: 🪙100 each</span>
    </div>
  </div>
);

interface SlideDef {
  title: string;
  body?: string;
  content?: React.ReactNode;
}

const SLIDES: SlideDef[] = [
  {
    title: "Welcome to Tradcast",
    body: "Predict crypto prices and earn rewards. It costs 1 cent (0.01 USDC/USDT/USDm) to play each round. You trade with 20× leverage on simulated prices.",
    content: undefined, // use body; we'll render leverage badge below in slide 1
  },
  {
    title: "How to trade",
    body: "Use Long when you think the price will go up, Short when it will go down, and Close to exit and lock in profit or loss. Here’s how the buttons look in the game:",
    content: undefined,
  },
  {
    title: "Balance & positions",
    body: "You start with a balance of 🪙1,000. Each position uses 🪙100 of that balance. Manage your risk and close positions to free up balance.",
    content: undefined,
  },
  {
    title: "Leaderboard & prizes",
    body: "Compete with others and check the Leaderboard to see top players and your rank. We distribute prizes to players who rank at the top—check the Leaderboard for current rankings and prize details.",
    content: undefined,
  },
  {
    title: "Profits & profile",
    body: "Track your total profits in the game. Visit your Profile to see your stats, balance history, and performance over time.",
    content: undefined,
  },
];

export function HowToPlayOverlay() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      setIsVisible(seen !== "true");
    } catch {
      setIsVisible(true);
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsVisible(false);
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    markSeen();
  }, [markSeen]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      markSeen();
    }
  }, [currentIndex, markSeen]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  if (!isVisible) return null;

  const slide = SLIDES[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlideBody = () => {
    if (slide.content) return slide.content;
    return (
      <>
        <p className="text-gray-600 text-sm leading-relaxed">{slide.body}</p>
        {/* Welcome: show 20x badge */}
        {currentIndex === 0 && (
          <div className="flex justify-center pt-1">
            <LeverageBadge />
          </div>
        )}
        {/* How to trade: show button preview */}
        {currentIndex === 1 && <TradingButtonsPreview />}
        {/* Balance: show balance visual */}
        {currentIndex === 2 && (
          <div className="pt-2">
            <BalanceVisual />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        {/* Close button - top right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <Card className="border-2 border-gray-200 shadow-xl overflow-hidden min-h-[430px]">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-bold text-gray-800 pr-8">{slide.title}</h2>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <div className="min-h-[180px]">
              {renderSlideBody()}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? "w-6 bg-[#d76afd]"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Next / Back */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-auto">
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirst}
                className={`min-w-[80px] py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  isFirst
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 active:scale-95"
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="min-w-[80px] py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#d76afd] hover:bg-[#c055e8] text-white shadow-md transition-all active:scale-95"
              >
                {isLast ? "Got it" : "Next"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
