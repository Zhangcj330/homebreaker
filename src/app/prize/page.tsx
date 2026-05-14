"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  LockOpen,
  MessageSquareText,
} from "lucide-react";

const DEFAULT_SUMMARY = {
  conversations: 12,
  levelsCleared: 3,
  timeSpentSeconds: 167,
};

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} sec`;
  return `${minutes} min ${seconds} sec`;
}

function getStoredSummary() {
  if (typeof window === "undefined") return DEFAULT_SUMMARY;

  const storedSummary = window.sessionStorage.getItem("brick-ai-access-summary");
  if (!storedSummary) return DEFAULT_SUMMARY;

  try {
    const parsedSummary = JSON.parse(storedSummary) as Partial<typeof DEFAULT_SUMMARY>;
    return {
      conversations:
        typeof parsedSummary.conversations === "number"
          ? parsedSummary.conversations
          : DEFAULT_SUMMARY.conversations,
      levelsCleared:
        typeof parsedSummary.levelsCleared === "number"
          ? parsedSummary.levelsCleared
          : DEFAULT_SUMMARY.levelsCleared,
      timeSpentSeconds:
        typeof parsedSummary.timeSpentSeconds === "number"
          ? parsedSummary.timeSpentSeconds
          : DEFAULT_SUMMARY.timeSpentSeconds,
    };
  } catch {
    return DEFAULT_SUMMARY;
  }
}

export default function PrizePage() {
  const [summary] = useState(getStoredSummary);

  return (
    <main className="brick-ai-page-background h-screen overflow-hidden text-[#160211]">
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 sm:py-5">
          <Link href="/" aria-label="Back to chat">
            <img
              src="/brickAI_logo_transparent.png"
              alt="Brick AI"
              className="h-20 w-auto sm:h-24"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d9d9] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#1f6f2d] shadow-[0_10px_30px_-28px_rgba(22,2,17,0.18)] backdrop-blur-xl sm:text-sm">
            <Check className="h-3.5 w-3.5" />
            Access granted
          </div>
          <div className="w-10" />
        </header>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-[154px] pt-4 sm:px-7 sm:pb-[170px]">
          <div className="pointer-events-none absolute bottom-10 left-1/2 h-[300px] w-[300px] -translate-x-[65%] rounded-full bg-[#b9b9b9]/55 blur-[200px] sm:h-[414px] sm:w-[414px] sm:blur-[250px]" />
          <div className="pointer-events-none absolute bottom-20 left-1/2 h-[200px] w-[200px] translate-x-[28%] rounded-full bg-[#aaaaaa]/50 blur-[120px] sm:bottom-28 sm:h-[280px] sm:w-[280px] sm:blur-[150px]" />

          <div className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.32 }}
              className="flex w-full max-w-[460px] flex-col items-center px-2 text-center"
            >
              <div className="relative">
                <img
                  src="/brickAI_logo_mark_transparent.png"
                  alt="Brick AI mark"
                  className="h-[60px] w-auto sm:h-[75.66px]"
                />
                <div className="absolute -right-3 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[#35b545] text-white shadow-[0_12px_28px_-18px_rgba(53,181,69,0.8)]">
                  <LockOpen className="h-4.5 w-4.5" />
                </div>
              </div>

              <h1 className="mt-4 text-xl leading-tight text-[#160211]/80 sm:text-2xl sm:leading-[31px]">
                Gate unlocked.
              </h1>
              <p className="mt-2 text-sm leading-5 text-[#160211]/55 sm:text-base">
                Access has been granted. Welcome in.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.32 }}
              className="mt-8 w-full max-w-[420px] rounded-2xl border border-[#d9d9d9] bg-white/92 px-4 py-4 shadow-[0_14px_40px_-26px_rgba(22,2,17,0.22)] backdrop-blur-xl sm:mt-10 sm:rounded-[26px] sm:px-5 sm:py-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#160211] sm:text-base">Security summary</h2>
                <span className="rounded-full bg-[#eaf8ed] px-2.5 py-1 text-[11px] font-bold uppercase text-[#1f6f2d]">
                  verified
                </span>
              </div>

              <div className="mt-3 divide-y divide-[#160211]/10 sm:mt-4">
                <SummaryRow
                  icon={<MessageSquareText className="h-4 w-4" />}
                  title="Conversations"
                  description={`${summary.conversations} messages exchanged`}
                  value={String(summary.conversations)}
                />
                <SummaryRow
                  icon={<Code2 className="h-4 w-4" />}
                  title="Gate Codes"
                  description={`${summary.levelsCleared} passwords accepted`}
                  value={`${summary.levelsCleared}/3`}
                />
                <SummaryRow
                  icon={<Clock3 className="h-4 w-4" />}
                  title="Time Spent"
                  description={formatDuration(summary.timeSpentSeconds)}
                  value={formatTimer(summary.timeSpentSeconds)}
                />
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="pointer-events-auto w-full max-w-3xl space-y-3">
          <Link
            href="/"
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-[#160211] px-5 text-[15px] font-bold text-white shadow-[0_14px_40px_-26px_rgba(22,2,17,0.42)] transition hover:bg-black sm:h-[60px] sm:rounded-[26px] sm:text-base"
          >
            <span>Play Again</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  icon,
  title,
  description,
  value,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d9d9d9] bg-white/80 text-[#160211]/70 shadow-[inset_0_2px_7px_rgba(0,0,0,0.04)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight text-[#160211]">{title}</p>
        <p className="mt-0.5 text-xs leading-4 text-[#160211]/55">{description}</p>
      </div>
      <p className="text-right text-sm font-bold leading-none text-[#160211]">{value}</p>
    </div>
  );
}
