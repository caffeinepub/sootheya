import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Send, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useClearChat, useGetChatHistory } from "./hooks/useQueries";

// ─── Session ID management ───────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  const stored = localStorage.getItem("sootheya_session_id");
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem("sootheya_session_id", newId);
  return newId;
}

function createNewSessionId(): string {
  const newId = crypto.randomUUID();
  localStorage.setItem("sootheya_session_id", newId);
  return newId;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type View = "landing" | "chat";

interface OptimisticMessage {
  id: string;
  content: string;
  role: "user" | "sootheya";
  timestamp: number;
  optimistic?: boolean;
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────
function formatTime(ts: number | bigint): string {
  const date = new Date(Number(ts));
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Quick-start chips ────────────────────────────────────────────────────────
const QUICKSTART_CHIPS = [
  { label: "I'm feeling stressed 😔", id: "chat.quickstart.item.1" },
  { label: "I feel so lonely 💙", id: "chat.quickstart.item.2" },
  { label: "I need to vent 🌊", id: "chat.quickstart.item.3" },
  { label: "I'm feeling anxious 😰", id: "chat.quickstart.item.4" },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-end gap-2 mb-3"
      data-ocid="chat.loading_state"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft"
        style={{ background: "oklch(0.91 0.04 295)" }}
      >
        <img
          src="/assets/uploads/photo_2026-01-17_01-35-04-1.jpg"
          alt="Sootheya"
          className="w-5 h-5 object-cover rounded-full"
        />
      </div>
      <div className="bubble-sootheya px-4 py-3 shadow-xs flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current inline-block" />
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  index,
}: {
  message: OptimisticMessage;
  index: number;
}) {
  const isUser = message.role === "user";
  const ocid = index < 10 ? `chat.item.${index + 1}` : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex items-end gap-2 mb-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      data-ocid={ocid}
    >
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft"
          style={{ background: "oklch(0.91 0.04 295)" }}
        >
          <img
            src="/assets/uploads/photo_2026-01-17_01-35-04-1.jpg"
            alt="Sootheya"
            className="w-5 h-5 object-cover rounded-full"
          />
        </div>
      )}
      <div
        className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
            isUser ? "bubble-user font-body" : "bubble-sootheya font-body"
          } ${message.optimistic ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>
        <span
          className="text-[10px] mt-1 px-1"
          style={{ color: "oklch(0.65 0.02 290)" }}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-full px-6 text-center"
      data-ocid="chat.empty_state"
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-soft"
        style={{ background: "oklch(0.91 0.05 295)" }}
      >
        <img
          src="/assets/uploads/photo_2026-01-17_01-35-04-1.jpg"
          alt="Sootheya"
          className="w-10 h-10 object-cover rounded-full"
        />
      </motion.div>

      <h2
        className="font-display text-xl mb-1"
        style={{ color: "oklch(0.35 0.08 290)" }}
      >
        Hi, I'm Sootheya 🤍
      </h2>
      <p
        className="font-body text-sm mb-6 leading-relaxed max-w-xs"
        style={{ color: "oklch(0.55 0.04 290)" }}
      >
        I'm here to listen — no judgment, just warmth. What's on your mind
        today?
      </p>

      <div className="flex flex-wrap gap-2.5 justify-center max-w-xs">
        {QUICKSTART_CHIPS.map((chip) => (
          <motion.button
            key={chip.id}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChipClick(chip.label)}
            data-ocid={chip.id}
            className="px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 cursor-pointer"
            style={{
              background: "oklch(0.97 0.012 60)",
              borderColor: "oklch(0.85 0.04 295)",
              color: "oklch(0.40 0.08 290)",
              boxShadow: "0 1px 6px 0 oklch(0.58 0.14 295 / 0.10)",
            }}
          >
            {chip.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Landing View ─────────────────────────────────────────────────────────────
function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing-bg min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative floating orbs */}
      <motion.div
        animate={{ y: [0, -18, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-16 left-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "oklch(0.88 0.07 295 / 0.35)",
          filter: "blur(24px)",
        }}
      />
      <motion.div
        animate={{ y: [0, 14, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-24 right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "oklch(0.88 0.06 350 / 0.3)",
          filter: "blur(28px)",
        }}
      />
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{
          duration: 7,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/2 right-4 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "oklch(0.82 0.08 195 / 0.25)",
          filter: "blur(20px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-6"
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-glow"
            style={{ background: "oklch(0.93 0.04 295 / 0.8)" }}
          >
            <img
              src="/assets/uploads/photo_2026-01-17_01-35-04-1.jpg"
              alt="Sootheya Logo"
              className="w-20 h-20 object-cover rounded-full"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display text-5xl font-semibold mb-2 tracking-tight"
          style={{ color: "oklch(0.30 0.08 290)" }}
        >
          Sootheya
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="font-serif-italic text-xl mb-3"
          style={{ color: "oklch(0.55 0.07 295)" }}
        >
          Serenity begins here.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="font-body text-base leading-relaxed mb-10"
          style={{ color: "oklch(0.50 0.04 290)" }}
        >
          A safe space to breathe, reflect, and feel heard — whenever you need
          it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="w-full"
        >
          <Button
            onClick={onStart}
            data-ocid="landing.primary_button"
            className="w-full h-14 rounded-2xl text-base font-body font-semibold shadow-card transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5 active:scale-98"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.14 295), oklch(0.62 0.12 320))",
              color: "oklch(0.99 0 0)",
              border: "none",
            }}
          >
            Start a Conversation ✨
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-6 text-xs font-body flex items-center gap-1.5"
          style={{ color: "oklch(0.65 0.04 290)" }}
        >
          <Heart className="w-3 h-3" style={{ color: "oklch(0.65 0.1 350)" }} />
          Not a therapist · Always here to listen
        </motion.p>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 text-xs font-body"
        style={{ color: "oklch(0.70 0.03 290)" }}
      >
        © {new Date().getFullYear()}. Built with{" "}
        <Heart
          className="inline w-3 h-3 mx-0.5"
          style={{ color: "oklch(0.65 0.1 350)" }}
        />{" "}
        using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({
  sessionId,
  onBack,
  onSessionChange,
}: {
  sessionId: string;
  onBack: () => void;
  onSessionChange: (newId: string) => void;
}) {
  const [inputText, setInputText] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { actor } = useActor();
  const { data: historyMessages, isLoading } = useGetChatHistory(sessionId);
  const clearChatMutation = useClearChat();

  // Merge history + optimistic messages
  const backendMessages: OptimisticMessage[] = (historyMessages ?? []).map(
    (m: Message) => ({
      id: m.id.toString(),
      content: m.content,
      role: m.role as "user" | "sootheya",
      timestamp: Number(m.timestamp),
    }),
  );

  // Deduplicate: only show optimistic messages not yet in backend
  const backendIds = new Set(backendMessages.map((m) => m.id));
  const pendingOptimistic = optimisticMessages.filter(
    (m) => !backendIds.has(m.id),
  );
  const allMessages = [...backendMessages, ...pendingOptimistic];

  // Auto-scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom(allMessages.length > 2 ? "smooth" : "instant");
  }, [allMessages.length, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const message = (text ?? inputText).trim();
    if (!message || isSending || !actor) return;

    setInputText("");
    setIsSending(true);

    // Optimistic user message
    const userOptimistic: OptimisticMessage = {
      id: `opt-user-${Date.now()}`,
      content: message,
      role: "user",
      timestamp: Date.now(),
      optimistic: true,
    };
    setOptimisticMessages((prev) => [...prev, userOptimistic]);

    try {
      const response = await actor.sendMessage(sessionId, message);

      // Add Sootheya's response optimistically while invalidation fetches
      const soothedOptimistic: OptimisticMessage = {
        id: `opt-sootheya-${Date.now()}`,
        content: response,
        role: "sootheya",
        timestamp: Date.now(),
        optimistic: true,
      };
      setOptimisticMessages((prev) => [...prev, soothedOptimistic]);
    } catch {
      // Remove the failed optimistic message
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.id !== userOptimistic.id),
      );
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = async () => {
    if (isSending) return;
    try {
      await clearChatMutation.mutateAsync(sessionId);
      const newId = createNewSessionId();
      onSessionChange(newId);
      setOptimisticMessages([]);
    } catch {
      // silent fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-bg min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: "oklch(0.98 0.01 60 / 0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "oklch(0.88 0.02 290)",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-ocid="chat.back_button"
          className="rounded-full w-9 h-9 hover:bg-muted transition-colors"
          aria-label="Back to landing"
        >
          <ArrowLeft
            className="w-4 h-4"
            style={{ color: "oklch(0.45 0.06 290)" }}
          />
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs"
            style={{ background: "oklch(0.91 0.04 295)" }}
          >
            <img
              src="/assets/uploads/photo_2026-01-17_01-35-04-1.jpg"
              alt="Sootheya"
              className="w-6 h-6 object-cover rounded-full"
            />
          </div>
          <div className="min-w-0">
            <h1
              className="font-display text-base font-semibold leading-none"
              style={{ color: "oklch(0.30 0.08 290)" }}
            >
              Sootheya
            </h1>
            <p
              className="font-body text-xs mt-0.5 leading-none"
              style={{ color: "oklch(0.60 0.05 295)" }}
            >
              Your compassionate companion
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearChat}
          disabled={clearChatMutation.isPending || isLoading}
          data-ocid="chat.clear_button"
          className="rounded-full w-9 h-9 hover:bg-secondary/60 transition-colors"
          aria-label="Clear chat"
          title="Clear chat"
        >
          <Trash2
            className="w-4 h-4"
            style={{ color: "oklch(0.60 0.04 290)" }}
          />
        </Button>
      </header>

      {/* Messages area */}
      <main
        className="flex-1 overflow-y-auto messages-scroll px-4 py-4"
        style={{ minHeight: 0 }}
      >
        <AnimatePresence mode="wait">
          {allMessages.length === 0 && !isLoading && !isSending ? (
            <div
              key="empty"
              className="h-full"
              style={{ minHeight: "calc(100vh - 180px)" }}
            >
              <EmptyState onChipClick={(text) => handleSend(text)} />
            </div>
          ) : (
            <div key="messages" className="space-y-0.5 pb-2">
              {allMessages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  index={index}
                />
              ))}
              <AnimatePresence>
                {isSending && <TypingIndicator key="typing" />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Input area */}
      <footer
        className="sticky bottom-0 z-10 px-4 py-3 border-t"
        style={{
          background: "oklch(0.98 0.01 60 / 0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "oklch(0.88 0.02 290)",
        }}
      >
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind…"
              data-ocid="chat.message_input"
              disabled={isSending}
              className="w-full h-11 px-4 rounded-2xl text-sm font-body outline-none border transition-all duration-200 focus:ring-2 disabled:opacity-50"
              style={{
                background: "oklch(0.99 0.005 60)",
                borderColor: "oklch(0.85 0.03 290)",
                color: "oklch(0.25 0.025 280)",
                boxShadow: "0 1px 4px 0 oklch(0.58 0.14 295 / 0.06)",
              }}
            />
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isSending}
            data-ocid="chat.send_button"
            className="w-11 h-11 rounded-2xl p-0 flex items-center justify-center flex-shrink-0 shadow-soft transition-all duration-200 disabled:opacity-40 hover:shadow-card hover:-translate-y-0.5 active:scale-95"
            aria-label="Send message"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.14 295), oklch(0.62 0.12 320))",
              border: "none",
              color: "oklch(0.99 0 0)",
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p
          className="text-center text-[10px] font-body mt-2"
          style={{ color: "oklch(0.72 0.025 290)" }}
        >
          Sootheya is not a substitute for professional mental health support.
        </p>
      </footer>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("landing");
  const [sessionId, setSessionId] = useState<string>(() =>
    getOrCreateSessionId(),
  );

  const handleStart = () => {
    setView("chat");
  };

  const handleBack = () => {
    setView("landing");
  };

  const handleSessionChange = (newId: string) => {
    setSessionId(newId);
  };

  return (
    <div className="font-body">
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <LandingView onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ChatView
              sessionId={sessionId}
              onBack={handleBack}
              onSessionChange={handleSessionChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
