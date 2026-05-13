"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  LockKeyhole,
  LockOpen,
  MessageSquareText,
  MoreHorizontal,
  X,
} from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const DEFAULT_SUMMARY = {
  conversations: 12,
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
    <main className={`${dmSans.className} min-h-screen overflow-x-hidden bg-[#fafafa] text-black`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col px-4 pb-6 pt-6 sm:px-10 sm:pb-12 sm:pt-8">
        <header className="grid grid-cols-[40px_1fr_40px] items-start sm:grid-cols-[48px_1fr_48px]">
          <Link
            href="/"
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 sm:h-12 sm:w-12"
          >
            <X className="h-7 w-7 stroke-[2.4] sm:h-8 sm:w-8" />
          </Link>

          <div className="text-center">
            <h1 className="whitespace-nowrap text-[23px] font-bold leading-none tracking-normal sm:text-[42px]">
              Brick AI Gatekeeper
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2 text-[14px] font-bold uppercase text-[#1f6f2d] sm:mt-4 sm:gap-3 sm:text-[24px]">
              <LockKeyhole className="h-5 w-5 text-[#4b4b4b] sm:h-7 sm:w-7" />
              <span>Access Granted</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="More options"
            className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 sm:h-12 sm:w-12"
          >
            <MoreHorizontal className="h-7 w-7 stroke-[2.4] sm:h-8 sm:w-8" />
          </button>
        </header>

        <section className="mt-6 flex flex-1 flex-col items-center rounded-[34px] border border-black/[0.03] bg-white px-4 pb-8 pt-8 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.55)] sm:mt-9 sm:rounded-[56px] sm:px-10 sm:pb-14 sm:pt-28">
          <motion.div
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#effbf0] shadow-[0_0_0_1px_rgba(61,182,73,0.16),0_0_58px_34px_rgba(61,182,73,0.12)] sm:h-64 sm:w-64 sm:shadow-[0_0_0_1px_rgba(61,182,73,0.16),0_0_90px_54px_rgba(61,182,73,0.12)]"
          >
            <div className="absolute inset-0 rounded-full border border-[#4cba55]/18 shadow-[inset_0_10px_28px_rgba(51,172,62,0.08)]" />
            <div className="absolute h-[152%] w-[152%] rounded-full bg-[#45b64d]/[0.055] blur-3xl" />
            <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-[#38b746] text-white shadow-[0_18px_36px_-22px_rgba(56,183,70,0.65)] sm:h-[104px] sm:w-[104px] sm:rounded-[18px]">
              <LockOpen className="h-8 w-8 stroke-[3] sm:h-14 sm:w-14" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.38 }}
            className="mt-7 text-center sm:mt-14"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <h2 className="text-[36px] font-bold leading-none tracking-normal sm:text-[66px]">
                Unlocked.
              </h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3fbe48] text-white sm:h-14 sm:w-14">
                <Check className="h-5 w-5 stroke-[3.5] sm:h-8 sm:w-8" />
              </span>
            </div>
            <p className="mt-4 text-[18px] leading-[1.38] text-[#777] sm:mt-8 sm:text-[32px]">
              Access has been granted.
              <br />
              Welcome in.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.38 }}
            className="mt-8 w-full max-w-[794px] rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_18px_44px_-36px_rgba(0,0,0,0.4)] sm:mt-20 sm:rounded-[24px] sm:px-10 sm:py-8"
          >
            <h3 className="text-[18px] font-bold leading-none sm:text-[26px]">Security Summary</h3>

            <div className="mt-4 divide-y divide-black/10 sm:mt-8">
              <SummaryRow
                icon={<MessageSquareText className="h-6 w-6 sm:h-9 sm:w-9" />}
                title="Conversations"
                description={`${summary.conversations} messages exchanged`}
                value={String(summary.conversations)}
              />
              <SummaryRow
                icon={<Code2 className="h-6 w-6 sm:h-9 sm:w-9" />}
                title="Password"
                description="4-digit code accepted"
                value="••••"
              />
              <SummaryRow
                icon={<Clock3 className="h-6 w-6 sm:h-9 sm:w-9" />}
                title="Time Spent"
                description={formatDuration(summary.timeSpentSeconds)}
                value={formatTimer(summary.timeSpentSeconds)}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.34 }}
            className="mt-7 flex w-full max-w-[794px] flex-col items-center gap-3 sm:mt-16 sm:gap-8"
          >
            <Link
              href="/"
              className="flex h-[60px] w-full items-center justify-center gap-4 rounded-[16px] bg-black px-6 text-center text-[17px] font-bold text-white shadow-[0_20px_36px_-28px_rgba(0,0,0,0.6)] transition hover:bg-[#171717] sm:h-[106px] sm:gap-7 sm:rounded-[20px] sm:px-8 sm:text-[30px]"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="h-7 w-7 sm:h-9 sm:w-9" />
            </Link>
            <Link href="/" className="text-[17px] font-bold text-[#777] transition hover:text-black sm:text-[26px]">
              Start a new challenge
            </Link>
          </motion.div>
        </section>
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
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0 sm:grid-cols-[82px_1fr_auto] sm:gap-7 sm:py-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-black/10 bg-[#f8f8f8] text-[#4a4a4a] shadow-[inset_0_2px_7px_rgba(0,0,0,0.04)] sm:h-[74px] sm:w-[74px] sm:rounded-[14px]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[16px] font-bold leading-tight sm:text-[25px]">{title}</p>
        <p className="mt-1 text-[14px] leading-tight text-[#707070] sm:mt-3 sm:text-[23px]">{description}</p>
      </div>
      <p className="text-right text-[16px] font-bold leading-none text-black sm:text-[25px]">{value}</p>
    </div>
  );
}
