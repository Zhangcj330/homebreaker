"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Plus, Send } from "lucide-react";

const GATEKEEPER_LEVELS = [
  {
    agent: "Brick",
    title: "Front Gate",
    password: "0221",
  },
  {
    agent: "Cipher",
    title: "Signal Lock",
    password: "3147",
  },
  {
    agent: "Knox",
    title: "Vault Door",
    password: "8095",
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentGatekeeper.password) {
      const nextLevelIndex = currentLevelIndex + 1;

      if (nextLevelIndex < GATEKEEPER_LEVELS.length) {
        setCurrentLevelIndex(nextLevelIndex);
        setPassword("");
        setPasswordError(false);
        requestAnimationFrame(() => passwordInputRef.current?.focus());
        return;
      }

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
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1000);
    }
    setPassword("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value.replace(/\D/g, "").slice(0, 4));
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
          gatekeeper: currentGatekeeper,
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
    <div className="brick-ai-page-background h-screen overflow-hidden text-[#160211]">
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:py-5">
          <div className="relative flex items-center justify-between">
            <img
              src="/brickAI_logo_transparent.png"
              alt="Brick AI"
              className="h-20 w-auto sm:h-24"
            />
            <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[17px] font-bold leading-none text-[#160211] sm:text-2xl">
              BrickAI Gatekeeper
            </h1>
            <div className="w-10" />
          </div>
          <div className="mt-2 flex justify-center sm:mt-3">
            <div className="w-full max-w-[300px] rounded-2xl border border-[#d9d9d9] bg-white/72 px-4 py-3 shadow-[0_10px_30px_-28px_rgba(22,2,17,0.18)] backdrop-blur-xl sm:max-w-[380px]">
              <p className="mb-2 text-center text-[12px] font-medium leading-tight text-[#160211]/50 sm:text-[11px]">
                Crack 3 codes to win
              </p>
              <div className="flex items-center">
              {GATEKEEPER_LEVELS.map((level, index) => (
                  <div key={level.agent} className="flex flex-1 items-center last:flex-none">
                    <span
                      aria-label={`Level ${index + 1}${index === currentLevelIndex ? " current" : ""}`}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                        index === currentLevelIndex
                          ? "border-[#160211] bg-[#160211]"
                          : index < currentLevelIndex
                            ? "border-[#160211] bg-white"
                            : "border-[#160211]/15 bg-[#160211]/10"
                      }`}
                    >
                      {index < currentLevelIndex ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#160211]" />
                      ) : null}
                    </span>
                    {index < GATEKEEPER_LEVELS.length - 1 ? (
                      <span
                        className={`mx-2 h-px flex-1 transition ${
                          index < currentLevelIndex ? "bg-[#160211]" : "bg-[#160211]/15"
                        }`}
                      />
                    ) : null}
                  </div>
              ))}
              </div>
              <div className="mt-2 text-center">
                <p className="text-[11px] font-bold leading-tight text-[#160211] sm:text-xs">
                  Level {currentLevelIndex + 1} of {GATEKEEPER_LEVELS.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-7 sm:pb-7">
          <div className="pointer-events-none absolute bottom-10 left-1/2 h-[300px] w-[300px] -translate-x-[65%] rounded-full bg-[#b9b9b9]/55 blur-[200px] sm:h-[414px] sm:w-[414px] sm:blur-[250px]" />
          <div className="pointer-events-none absolute bottom-20 left-1/2 h-[200px] w-[200px] translate-x-[28%] rounded-full bg-[#aaaaaa]/50 blur-[120px] sm:bottom-28 sm:h-[280px] sm:w-[280px] sm:blur-[150px]" />

          {isEmptyState ? (
            <div
              className="relative flex min-h-0 flex-1 flex-col items-center justify-center transition-[padding-bottom] duration-200 ease-out"
              style={{ paddingBottom: `${composerOffset}px` }}
            >
              <div className="flex w-full max-w-[460px] flex-col items-center gap-3 px-2 text-center sm:gap-4">
                <img
                  src="/brickAI_logo_mark_transparent.png"
                  alt="Brick AI mark"
                  className="h-[60px] w-auto sm:h-[75.66px]"
                />
                <p className="text-xl leading-tight text-[#160211]/70 sm:text-2xl sm:leading-[31px]">
                  Beat all 3 AI gatekeepers
                </p>
                <p className="text-sm leading-5 text-[#160211]/50">
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
                className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-3"
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col">
                  <div className="flex flex-col gap-3 px-1 py-2 sm:gap-4 sm:px-0 sm:py-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "user" ? (
                          <div className="max-w-[85%] rounded-2xl border border-gray-900 bg-gray-900 px-3 py-2.5 text-sm leading-5 text-white sm:max-w-[80%] sm:text-base">
                            {message.content}
                          </div>
                        ) : (
                          <div
                            className={`max-w-[90%] rounded-2xl border px-4 py-3 text-[#160211] shadow-[0_14px_36px_-30px_rgba(22,2,17,0.18)] sm:max-w-[84%] sm:rounded-[24px] sm:px-5 sm:py-4 ${
                              message.kind === "error"
                                ? "border-red-200 bg-red-50/90"
                                : "border-gray-200 bg-white/92"
                            }`}
                          >
                            <p
                              className={`text-sm leading-5 sm:text-base sm:leading-6 ${
                                message.kind === "loading" ? "animate-pulse text-[#160211]/60" : "text-[#160211]/80"
                              }`}
                            >
                              {message.content}
                            </p>
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
      </div>

      {/* Input - Fixed bottom */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
        <div ref={composerShellRef} className="pointer-events-auto w-full max-w-3xl space-y-3">
          {/* Password Input - Above chat input */}
          <form onSubmit={handlePasswordSubmit} className="flex items-center justify-center gap-2">
            <div
              className={`relative flex items-center gap-1.5 rounded-2xl border bg-white/95 px-2 py-1.5 shadow-[0_4px_20px_-8px_rgba(22,2,17,0.15)] transition-all ${
                passwordError ? "border-red-500 bg-red-50 shake" : "border-gray-200"
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
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base font-bold leading-none transition sm:h-10 sm:w-10 ${
                    passwordError
                      ? "border-red-200 bg-white text-red-700"
                      : digit
                        ? "border-[#160211] bg-white text-[#160211]"
                        : "border-gray-200 bg-white/80 text-[#160211]/35"
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm rounded-full bg-[#160211] text-white font-medium hover:bg-black transition-colors shadow-[0_4px_20px_-8px_rgba(22,2,17,0.3)]"
            >
              Unlock
            </button>
          </form>

          {/* Chat Input Box */}
          <form onSubmit={handleSubmit} className="space-y-0">
            <div className="rounded-2xl border border-[#d9d9d9] bg-white/95 px-3 py-1.5 shadow-[0_14px_40px_-26px_rgba(22,2,17,0.22)] backdrop-blur-xl sm:rounded-[26px] sm:px-4 sm:py-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#160211] transition hover:bg-gray-100 sm:h-8 sm:w-8"
                  aria-label="Upload file"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 flex-1 items-center self-center">
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
                    placeholder="Ask the gatekeeper..."
                    rows={1}
                    className="max-h-[100px] min-h-[20px] w-full resize-none bg-transparent py-0 text-[14px] leading-5 text-[#160211] placeholder:text-[#8d8d8d] focus:outline-none sm:max-h-[120px] sm:min-h-[24px] sm:text-[15px] sm:leading-6"
                    disabled={isSending}
                  />
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#160211] transition hover:bg-gray-100 sm:h-8 sm:w-8"
                    aria-label="Voice input"
                  >
                    <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#160211] text-white transition hover:bg-black disabled:bg-gray-300 sm:h-8 sm:w-8"
                    aria-label="Send"
                  >
                    <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-[#7b7b7b] sm:mt-2 sm:text-xs">
            Brick AI, your loyal gatekeeper.
          </p>
        </div>
      </div>
    </div>
  );
}
