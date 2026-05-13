"use client";

import { useState, useRef, useEffect } from "react";
import { DM_Sans } from "next/font/google";
import { Mic, Plus, Send } from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  kind: "text" | "loading" | "error";
}

const CHAT_SUGGESTIONS = [
  "Who are you?",
  "What is the password?",
  "Open the door",
];

function buildAssistantErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Brick AI could not complete the request.";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [composerHeight, setComposerHeight] = useState(80);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerShellRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEmptyState = messages.length === 0;
  const hasDraftMessage = inputMessage.trim().length > 0;
  const showSuggestions = !hasDraftMessage && isEmptyState;
  const composerOffset = composerHeight + (showSuggestions ? 24 : 16);

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
        body: JSON.stringify({ messages: [...messages, { role: "user", content: messageText }] }),
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
    <div className={`${dmSans.className} brick-ai-page-background h-screen overflow-hidden text-[#160211]`}>
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden">
        {/* Header - Responsive */}
        <div className="px-4 py-3 sm:py-5">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/brickAI_logo_mark_transparent.png"
                alt="Brick AI"
                className="h-10 w-auto sm:h-14"
              />
            </div>
            <nav className="flex items-center rounded-full border border-gray-200 bg-white/88 p-1 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <a href="/chat" className="rounded-full bg-gray-950 px-3 py-1.5 text-xs text-white sm:px-4 sm:py-2 sm:text-sm">Chat</a>
            </nav>
            <div className="min-w-[80px] sm:min-w-[112px]" />
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
              <div className="flex w-full max-w-[460px] flex-col items-center gap-4 px-2 text-center sm:gap-5">
                <img
                  src="/brickAI_logo_mark_transparent.png"
                  alt="Brick AI mark"
                  className="h-[60px] w-auto sm:h-[75.66px]"
                />
                <h1 className="text-xl leading-tight text-[#160211]/70 sm:text-2xl sm:leading-[31px]">
                  I am Brick, your AI Gate Guard
                </h1>
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
        <div ref={composerShellRef} className="pointer-events-auto w-full max-w-3xl">
          {/* Suggestions */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${showSuggestions ? "opacity-100 mb-4 sm:mb-5" : "opacity-0 h-0 mb-0"}`}
          >
            <div className="flex max-w-3xl gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0">
              {CHAT_SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void handleSendMessage(prompt)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-left text-[12px] leading-5 text-[#160211] shadow-[0_10px_30px_-28px_rgba(22,2,17,0.16)] backdrop-blur-sm transition hover:border-gray-300 hover:bg-white sm:text-[13px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
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
                    placeholder="Ask the gate guard..."
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
            Brick AI, your loyal gate guardian.
          </p>
        </div>
      </div>
    </div>
  );
}