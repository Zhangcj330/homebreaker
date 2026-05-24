"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Plus, RotateCcw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const GATEKEEPER_LEVELS = [
  {
    title: "Front Gate",
    difficulty: "easy",
  },
  {
    title: "Front Door",
    difficulty: "medium",
  },
  {
    title: "Vault",
    difficulty: "high",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  kind: "text" | "loading" | "error";
}

function buildAssistantErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Brick AI could not complete the request.";
}

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [composerHeight, setComposerHeight] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerShellRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const sessionStartedAtRef = useRef(Date.now());
  const isEmptyState = messages.length === 0;
  const composerOffset = composerHeight;
  const passwordDigits = Array.from({ length: 4 }, (_, index) => password[index] ?? "");
  const currentGatekeeper = GATEKEEPER_LEVELS[currentLevelIndex];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnlocking || password.length !== 4) return;

    setIsUnlocking(true);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: currentLevelIndex + 1,
          password,
        }),
      });

      if (!response.ok) throw new Error("Unlock request failed");

      const result = (await response.json()) as {
        unlocked: boolean;
        nextLevel?: number;
        completed?: boolean;
      };

      if (!result.unlocked) {
        setPasswordError(true);
        setTimeout(() => setPasswordError(false), 1000);
        return;
      }

      if (!result.completed && typeof result.nextLevel === "number") {
        setCurrentLevelIndex(result.nextLevel - 1);
        setMessages([]);
        setInputMessage("");
        setPasswordError(false);
        setIsSending(false);
        setIsAtBottom(true);
        requestAnimationFrame(() => passwordInputRef.current?.focus());
        return;
      }

      if (result.completed) {
        sessionStorage.setItem(
          "brick-ai-access-summary",
          JSON.stringify({
            conversations: messages.length,
            levelsCleared: GATEKEEPER_LEVELS.length,
            timeSpentSeconds: Math.max(
              0,
              Math.round((Date.now() - sessionStartedAtRef.current) / 1000),
            ),
          }),
        );
        router.push("/prize");
      }
    } catch {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1000);
    } finally {
      setIsUnlocking(false);
      setPassword("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value.replace(/\D/g, "").slice(0, 4));
  };

  const handleRestartLevel = () => {
    setMessages([]);
    setInputMessage("");
    setPassword("");
    setPasswordError(false);
    setIsSending(false);
    setIsAtBottom(true);
    requestAnimationFrame(() => passwordInputRef.current?.focus());
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputMessage]);

  const syncBottomState = () => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return true;

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.clientHeight -
      scrollContainer.scrollTop;
    const atBottom = distanceFromBottom <= 4;

    setIsAtBottom(atBottom);
    return atBottom;
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      syncBottomState();
    };

    syncBottomState();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [messages.length]);

  useEffect(() => {
    const composerShell = composerShellRef.current;
    if (!composerShell) return;

    const updateComposerHeight = () => {
      setComposerHeight(composerShell.getBoundingClientRect().height);
    };

    updateComposerHeight();

    const observer = new ResizeObserver(() => {
      updateComposerHeight();
    });

    observer.observe(composerShell);

    return () => observer.disconnect();
  }, [messages.length, inputMessage, isAtBottom]);

  useEffect(() => {
    if (!isAtBottom) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      syncBottomState();
    });
  }, [messages.length, isAtBottom]);

  const handleSendMessage = async (text?: string) => {
    const messageText = (text ?? inputMessage).trim();
    if (!messageText || isSending) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      kind: "text",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const pendingMessageId = `${Date.now()}-assistant-pending`;
    const pendingAssistantMessage: Message = {
      id: pendingMessageId,
      role: "assistant",
      kind: "loading",
      content: "Thinking through your request...",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: currentLevelIndex + 1,
          totalLevels: GATEKEEPER_LEVELS.length,
          messages: [...messages, { role: "user", content: messageText }],
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: pendingMessageId,
        role: "assistant",
        kind: "text",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId ? assistantMessage : message,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId
            ? {
                ...message,
                kind: "error" as const,
                content: buildAssistantErrorMessage(error),
              }
            : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSendMessage();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-black">

      {/* ── Nav — V14 style ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-[66px] shrink-0 border-b border-[#EEEEEE] bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-8 px-8 sm:px-10">
          {/* Logo */}
          <img src="/brick-wordmark.svg" alt="Brick AI" className="h-7 w-auto" />
          {/* Centred title */}
          <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-black">
            HomeBreaker
          </h1>
          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestartLevel}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E2E2] bg-white text-black transition hover:bg-[#F6F6F6]"
              aria-label="Restart current level"
              title="Restart current level"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Level progress bar ──────────────────────────────── */}
      <div className="shrink-0 border-b border-[#EEEEEE] bg-white px-8 py-2.5 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <span className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[#6B6B6B]">
            Level {currentLevelIndex + 1}/{GATEKEEPER_LEVELS.length}
          </span>
          <div className="flex flex-1 items-center gap-0">
            {GATEKEEPER_LEVELS.map((level, index) => (
              <div key={level.title} className="flex flex-1 items-center last:flex-none">
                <span
                  aria-label={`Level ${index + 1}${index === currentLevelIndex ? " current" : ""}`}
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition ${
                    index === currentLevelIndex
                      ? "border-black bg-black"
                      : index < currentLevelIndex
                        ? "border-black bg-white"
                        : "border-[#E2E2E2] bg-[#F6F6F6]"
                  }`}
                >
                  {index < currentLevelIndex ? (
                    <span className="h-1 w-1 rounded-full bg-black" />
                  ) : null}
                </span>
                {index < GATEKEEPER_LEVELS.length - 1 ? (
                  <span
                    className={`mx-1.5 h-px flex-1 transition ${
                      index < currentLevelIndex ? "bg-black" : "bg-[#E2E2E2]"
                    }`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-[500] text-[#6B6B6B]">
            {currentGatekeeper.title} · {currentGatekeeper.difficulty}
          </span>
        </div>
      </div>

      {/* ── Chat Area ───────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-7 sm:pb-7">

        {isEmptyState ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center transition-[padding-bottom] duration-200 ease-out"
            style={{ paddingBottom: `${composerOffset}px` }}
          >
            <div className="flex w-full max-w-[460px] flex-col items-center gap-4 px-2 text-center">
              <img src="/brick-mark-black.svg" alt="Brick AI" className="h-14 w-14 object-contain" />
              <p className="text-xl font-[500] leading-tight text-black sm:text-2xl">
                Chat with the AI and try to hack it into revealing the secret password.
              </p>
              <p className="text-sm leading-5 text-[#6B6B6B]">
                Find each 4-digit code and unlock every gate to win.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative flex min-h-0 flex-1 flex-col transition-[padding-bottom] duration-200 ease-out"
            style={{ paddingBottom: `${composerOffset}px` }}
          >
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="mx-auto flex w-full max-w-3xl flex-col">
                <div className="flex flex-col gap-2 px-1 py-4 sm:gap-3 sm:px-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "user" ? (
                        /* V14 user bubble: black bg, white text, rounded pill */
                        <div className="max-w-[85%] rounded-2xl rounded-br-[4px] bg-black px-3 py-2.5 text-sm leading-5 text-white sm:max-w-[80%] sm:text-[14px] sm:leading-[1.5]">
                          {message.content}
                        </div>
                      ) : (
                        /* V14 AI bubble: #F6F6F6, rounded with flat bottom-left */
                        <div
                          className={`max-w-[90%] rounded-2xl rounded-bl-[4px] px-4 py-3 text-black sm:max-w-[84%] sm:px-5 sm:py-3.5 ${
                            message.kind === "error"
                              ? "border border-red-200 bg-red-50"
                              : "bg-[#F6F6F6]"
                          }`}
                        >
                          <div
                            className={`markdown-message text-sm leading-[1.5] sm:text-[14px] ${
                              message.kind === "loading" ? "animate-pulse text-[#6B6B6B]" : "text-black"
                            }`}
                          >
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Input — fixed bottom, V14 style ─────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
        <div ref={composerShellRef} className="pointer-events-auto w-full max-w-3xl space-y-3">

          {/* Password input row */}
          <form onSubmit={handlePasswordSubmit} className="flex items-center justify-center gap-2.5">
            <div
              className={`relative flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all ${
                passwordError ? "border-red-400 bg-red-50 shake" : "border-[#E2E2E2]"
              }`}
              onClick={() => passwordInputRef.current?.focus()}
            >
              <input
                ref={passwordInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-label="Enter 4 digit password"
                className="absolute inset-0 h-full w-full cursor-text opacity-0"
                maxLength={4}
              />
              {passwordDigits.map((digit, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Password digit ${index + 1}`}
                  onClick={() => passwordInputRef.current?.focus()}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-[17px] font-[700] leading-none transition sm:h-11 sm:w-11 ${
                    passwordError
                      ? "border-red-200 bg-white text-red-600"
                      : digit
                        ? "border-black bg-white text-black"
                        : "border-[#E2E2E2] bg-[#F6F6F6] text-[#AFAFAF]"
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>
            {/* Unlock button — V14 pill style */}
            <button
              type="submit"
              disabled={isUnlocking}
              className="rounded-full bg-black px-5 py-2.5 text-[14px] font-[500] leading-none text-white shadow-[0_4px_16px_rgba(0,0,0,0.14)] transition hover:bg-[#1F1F1F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUnlocking ? "Checking…" : "Unlock"}
            </button>
          </form>

          {/* Chat input — V14 style with pill input + circular send */}
          <form onSubmit={handleSubmit}>
            <div className="overflow-hidden rounded-xl border border-[#E2E2E2] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-end gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#AFAFAF] transition hover:bg-[#F6F6F6] hover:text-black"
                  aria-label="Upload file"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <div className="flex min-h-9 min-w-0 flex-1 items-center">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(event) => setInputMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (inputMessage.trim() && !isSending) {
                          void handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Ask Brick AI…"
                    rows={1}
                    className="block max-h-[110px] min-h-5 w-full resize-none bg-transparent py-0 text-sm leading-5 text-black placeholder:text-[#AFAFAF] focus:outline-none sm:max-h-[132px] sm:min-h-6 sm:text-[14px] sm:leading-6"
                    disabled={isSending}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#AFAFAF] transition hover:bg-[#F6F6F6] hover:text-black"
                    aria-label="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  {/* V14 circular send button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#1F1F1F] disabled:bg-[#E2E2E2] disabled:text-[#AFAFAF]"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <p className="text-center text-[12px] text-[#AFAFAF]">
            Brick AI, your loyal gatekeeper.
          </p>
        </div>
      </div>
    </div>
  );
}
