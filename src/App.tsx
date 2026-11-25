import { useState, useRef, useEffect, type KeyboardEvent, type CSSProperties } from "react";

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
  time: string;
}

const DEFAULT_WEBHOOK_URL = "https://uday1997.app.n8n.cloud/webhook/contact";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      text: "Welcome to ApexDesk AI! Connected to your Google Workspace (saiuday81618@gmail.com). Type a request below to book appointments, check schedules, place orders, or update Google Sheets, Calendar, Gmail & WhatsApp.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>(DEFAULT_WEBHOOK_URL);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || loading) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (customText === undefined) {
      setInput("");
    }
    setLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatInput: textToSend,
          source: "vercel_web_app",
          telegramChatId: "6202497965",
        }),
      });

      const rawText = await response.text();
      let aiReply = "";

      if (rawText) {
        try {
          const parsed: unknown = JSON.parse(rawText);
          const item = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown>;
          const extracted =
            item?.output ??
            item?.reply ??
            item?.message ??
            item?.text ??
            item?.response;

          if (typeof extracted === "string" && extracted.trim().length > 0) {
            aiReply = extracted;
          } else if (typeof item === "string") {
            aiReply = item;
          } else {
            aiReply = rawText;
          }
        } catch {
          aiReply = rawText;
        }
      }

      if (!aiReply || aiReply === "{}" || aiReply === "[]") {
        aiReply = "Message received by ApexDesk AI and synced with Telegram.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Unable to reach n8n webhook. Please check if your workflow is Published.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Dashboard Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brand}>
            <div style={styles.logoBox}>✨</div>
            <span style={styles.brandTitle}>ApexDesk AI</span>
          </div>

          <div style={styles.sectionLabel}>QUICK WORKFLOWS</div>
          <button
            type="button"
            style={styles.quickBtn}
            onClick={() => void sendMessage("Check Nov 30 Schedule")}
          >
            📅 Check Nov 30 Schedule
          </button>
          <button
            type="button"
            style={styles.quickBtn}
            onClick={() => void sendMessage("Quick Order & Pay")}
          >
            ✅ Quick Order &amp; Pay
          </button>

          <div style={{ ...styles.sectionLabel, marginTop: "24px" }}>
            CONNECTED TOOLS
          </div>
          <ul style={styles.toolList}>
            <li style={styles.toolItem}>🗄️ ApexDesk AI Sheet (CRM)</li>
            <li style={styles.toolItem}>📊 Google Sheets Orders</li>
            <li style={styles.toolItem}>📆 Google Calendar</li>
            <li style={styles.toolItem}>✉️ Gmail Alerts</li>
            <li style={styles.toolItem}>💬 WhatsApp &amp; Razorpay</li>
          </ul>
        </div>

        {/* User Profile Footer */}
        <div style={styles.profileBox}>
          <div style={styles.avatar}>SS</div>
          <div style={{ flex: 1 }}>
            <div style={styles.profileName}>Saiuday Somidi</div>
            <div style={styles.profilePlan}>Free</div>
          </div>
          <button
            type="button"
            style={styles.settingsBtn}
            onClick={() => setShowSettings((prev) => !prev)}
            title="Webhook Settings"
          >
            ⚙️
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.headerTitleRow}>
              <h1 style={styles.headerTitle}>Autonomous Multi-Level Agent</h1>
              <span style={styles.liveBadge}>● Live n8n Connected</span>
            </div>
            <p style={styles.headerSub}>
              Sheets CRM • Google Calendar • Gmail • WhatsApp Auto-Sync
            </p>
          </div>
          <button
            type="button"
            style={styles.refreshBtn}
            onClick={() => window.location.reload()}
          >
            🔄 Refresh
          </button>
        </header>

        {showSettings && (
          <div style={styles.settingsBar}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              n8n Webhook URL:
            </span>
            <input
              style={styles.settingsInput}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <button
              type="button"
              style={styles.saveBtn}
              onClick={() => setShowSettings(false)}
            >
              Done
            </button>
          </div>
        )}

        {/* Chat Bubbles Area */}
        <div style={styles.chatArea}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.bubbleWrapper,
                justifyContent:
                  msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={
                  msg.sender === "user" ? styles.userBubble : styles.aiBubble
                }
              >
                <div style={styles.msgText}>{msg.text}</div>
                <div style={styles.msgTime}>{msg.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={styles.bubbleWrapper}>
              <div style={styles.aiBubble}>
                <div style={styles.msgText}>ApexDesk AI is typing...</div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div style={styles.inputBar}>
          <input
            style={styles.input}
            placeholder="Type a booking, order, schedule check, or payment request..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            style={styles.sendBtn}
            onClick={() => void sendMessage()}
            disabled={loading}
          >
            Send ➤
          </button>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "#0b1120",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sidebar: {
    width: "270px",
    backgroundColor: "#0f172a",
    borderRight: "1px solid #1e293b",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
  },
  logoBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  brandTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: "10px",
  },
  quickBtn: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    marginBottom: "8px",
    borderRadius: "8px",
    border: "1px solid #1e293b",
    backgroundColor: "#162033",
    color: "#e2e8f0",
    fontSize: "13px",
    cursor: "pointer",
  },
  toolList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  toolItem: {
    padding: "8px 4px",
    fontSize: "13px",
    color: "#cbd5e1",
  },
  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingTop: "14px",
    borderTop: "1px solid #1e293b",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: 600,
  },
  profilePlan: {
    fontSize: "11px",
    color: "#64748b",
  },
  settingsBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
  },
  liveBadge: {
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: "#34d399",
    fontWeight: 600,
  },
  headerSub: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  refreshBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    fontSize: "13px",
    cursor: "pointer",
  },
  settingsBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 24px",
    backgroundColor: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  settingsInput: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "13px",
  },
  saveBtn: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  chatArea: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  bubbleWrapper: {
    display: "flex",
    width: "100%",
  },
  aiBubble: {
    maxWidth: "70%",
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    padding: "14px 16px",
    borderRadius: "14px",
    borderBottomLeftRadius: "4px",
    lineHeight: "1.5",
    fontSize: "14px",
  },
  userBubble: {
    maxWidth: "70%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "14px",
    borderBottomRightRadius: "4px",
    lineHeight: "1.5",
    fontSize: "14px",
  },
  msgText: {
    whiteSpace: "pre-wrap",
  },
  msgTime: {
    fontSize: "10px",
    opacity: 0.7,
    marginTop: "6px",
    textAlign: "right",
  },
  inputBar: {
    padding: "16px 24px",
    borderTop: "1px solid #1e293b",
    backgroundColor: "#0f172a",
    display: "flex",
    gap: "12px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    padding: "12px 22px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
};