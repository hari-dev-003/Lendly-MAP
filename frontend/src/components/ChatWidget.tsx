import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";

interface Message {
  _id?: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface ChatWidgetProps {
  ownerName: string;
  currentUser: string;
  itemId: string;
  itemTitle: string;
  onClose: () => void;
}

let socket: Socket | null = null;

const ChatWidget = ({ ownerName, currentUser, itemId, itemTitle, onClose }: ChatWidgetProps) => {
  const room = [...[currentUser, ownerName]].sort().join("_") + "_" + itemId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io("http://localhost:3000", { transports: ["websocket"] });

    socket.on("connect", () => {
      setConnected(true);
      socket!.emit("join_room", room);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender !== currentUser) setTyping(false);
    });

    // Load history
    fetch(`http://localhost:3000/api/messages/${encodeURIComponent(room)}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit("send_message", { room, sender: currentUser, text });
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
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
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-300" : "bg-gray-300"}`} />
            <p className="text-xs text-white/70">{connected ? "Online" : "Connecting..."}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Start a conversation about "{itemTitle}"
          </p>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender === currentUser;
          return (
            <div key={m._id ?? i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                isMe ? "bg-primary text-primary-foreground rounded-br-sm"
                     : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                <p>{m.text}</p>
                <p className={`mt-0.5 text-xs ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i}
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
          disabled={!input.trim() || !connected}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChatWidget;
