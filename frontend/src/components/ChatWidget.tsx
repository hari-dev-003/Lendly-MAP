import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
}

interface ChatWidgetProps {
  ownerName: string;
  itemTitle: string;
  onClose: () => void;
}

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatWidget = ({ ownerName, itemTitle, onClose }: ChatWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: "them",
      text: `Hi! I'm ${ownerName}. I saw you're interested in "${itemTitle}". Feel free to ask me anything!`,
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const mockReplies = [
    "Yes, it's available on those dates!",
    "Sure, you can pick it up from my place in the evening.",
    "The item is in excellent condition, barely used.",
    "Payment is handled through the platform — it's escrow protected.",
    "Happy to arrange a quick inspection before handover.",
  ];

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const myMsg: Message = { id: Date.now(), from: "me", text, time: now() };
    setMessages((prev) => [...prev, myMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "them", text: reply, time: now() },
      ]);
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      style={{ height: 420 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
          {ownerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{ownerName}</p>
          <p className="text-xs text-white/70 truncate">{itemTitle}</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.from === "me"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              <p>{m.text}</p>
              <p className={`mt-0.5 text-xs ${m.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {m.time}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className="block h-1.5 w-1.5 rounded-full bg-muted-foreground"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChatWidget;
