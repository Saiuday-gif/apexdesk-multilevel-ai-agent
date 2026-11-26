import React, { useState, useEffect } from "react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  channel: string;
}

const N8N_APEXDESK_WEBHOOK_URL = "https://ivory-uselessly-bouncy.ngrok-free.dev/webhook/contact";
const RAZORPAY_MONTHLY_LINK = "https://rzp.io/l/your-999-monthly-link";
const RAZORPAY_ONETIME_LINK = "https://rzp.io/l/your-20000-onetime-link";

export default function App() {
  const [email, setEmail] = useState<string>("");
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);
  const [expiryDateStr, setExpiryDateStr] = useState<string>("");

  const [selectedChannel, setSelectedChannel] = useState<string>("WhatsApp");
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: "Hello! Welcome to ApexDesk Multi-Level AI Agent. Ask me to place or track orders in Google Sheets, book appointments, manage leads, or send email confirmations.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: "System",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const evaluateTrialStatus = (userEmail: string) => {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    const storageKey = `apexdesk_trial_${cleanEmail}`;
    let startTimestamp = localStorage.getItem(storageKey);

    if (!startTimestamp) {
      startTimestamp = Date.now().toString();
      localStorage.setItem(storageKey, startTimestamp);
    }

    const startDate = new Date(parseInt(startTimestamp, 10));
    const expiryDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    setActiveEmail(cleanEmail);
    setExpiryDateStr(
      expiryDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );

    if (remainingDays > 0) {
      setDaysLeft(remainingDays);
      setIsTrialActive(true);
    } else {
      setDaysLeft(0);
      setIsTrialActive(false);
    }
  };

  useEffect(() => {
    const savedLastUser = localStorage.getItem("apexdesk_last_email");
    if (savedLastUser) {
      setEmail(savedLastUser);
      evaluateTrialStatus(savedLastUser);
    }
  }, []);

  const handleActivateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem("apexdesk_last_email", email.trim().toLowerCase());
    evaluateTrialStatus(email);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isTrialActive || loading) return;

    const userText = inputMessage.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: nowTime,
      channel: selectedChannel,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch(N8N_APEXDESK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          message: userText,
          chatInput: userText,
          channel: selectedChannel,
          client_name: clientName || "Website Lead",
          client_phone: clientPhone || "N/A",
          client_email: activeEmail,
          sessionId: activeEmail,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Agent Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const record = Array.isArray(data) ? data[0] : data;
      const replyText =
        record?.output ||
        record?.reply ||
        record?.message ||
        record?.text ||
        "Request processed. Orders & Leads Google Sheets, Calendar, and Gmail updated.";

      const newAgentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: selectedChannel,
      };

      setMessages((prev) => [...prev, newAgentMsg]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? `${err.message} — Verify Docker n8n workflow is Active and Webhook CORS is set to *`
          : "Failed to reach ApexDesk AI Agent";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      <aside className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                ApexDesk AI
              </h2>
              <p className="text-xs text-indigo-400 font-medium">
                Multi-Level Business Agent
              </p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
              7-Day Free Trial Access
            </h3>

            <form onSubmit={handleActivateTrial} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@business.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
              >
                {activeEmail ? "Switch / Check Trial" : "Start 7-Day Free Trial"}
              </button>
            </form>

            {activeEmail && (
              <div className="mt-4 pt-3 border-t border-slate-700">
                {isTrialActive ? (
                  <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-lg p-3">
                    <p className="text-xs text-emerald-300 font-semibold">
                      ACTIVE: {daysLeft} {daysLeft === 1 ? "Day" : "Days"} Left
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Valid until {expiryDateStr}
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-950/60 border border-rose-700/60 rounded-lg p-3">
                    <p className="text-xs text-rose-300 font-semibold">
                      TRIAL EXPIRED
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Upgrade below to keep your AI agent live 24/7.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Included Integrations
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>WhatsApp & Telegram Bot</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Google Sheets Orders Sheet</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Google Sheets Lead CRM</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Google Calendar Booking</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Gmail Auto-Confirmations</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Commercial Plans
            </h3>
            <a
              href={RAZORPAY_MONTHLY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition"
            >
              Monthly Plan — ₹999/mo
            </a>
            <a
              href={RAZORPAY_ONETIME_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-semibold text-white transition"
            >
              Full App License — ₹20,000
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          ApexDesk AI • Multi-Channel Automation
        </p>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              ApexDesk Multi-Level AI Agent
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              24/7 Autonomous Receptionist, Order Processor, Lead Manager & Calendar Scheduler
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-medium w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Multi-Level Workflow Ready
          </div>
        </header>

        {!activeEmail ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Activate Your 7-Day Free Trial
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Enter your business email in the left sidebar to test live order logging in Google Sheets, appointment scheduling, lead capture, and Gmail confirmations.
            </p>
          </div>
        ) : !isTrialActive ? (
          <div className="bg-rose-950/30 border border-rose-800 rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-rose-300">
              Your 7-Day Free Trial Has Ended
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Continue automating your orders, client leads, calendar appointments, and multi-channel messages with ₹999/month or ₹20,000 full ownership.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href={RAZORPAY_MONTHLY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white"
              >
                Subscribe — ₹999/month
              </a>
              <a
                href={RAZORPAY_ONETIME_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white"
              >
                Buy Full License — ₹20,000
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h2 className="text-base font-semibold text-white">
                Channel & Client Context
              </h2>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Active Channel Simulation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["WhatsApp", "Telegram", "Web Chat"].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                        selectedChannel === ch
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Client / Customer Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Karthik Sharma"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Client Phone / ID
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-400">
                  Quick Test Actions
                </p>
                <button
                  type="button"
                  onClick={() =>
                    triggerQuickPrompt("Place a new order for 2 Enterprise AI Packages and log it in the Orders Google Sheet.")
                  }
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                >
                  📦 Place New Order in Orders Sheet
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerQuickPrompt("Check the status of my latest order from the Orders Google Sheet.")
                  }
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                >
                  🔍 Track Order Status (Orders Sheet)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerQuickPrompt("Book an appointment for tomorrow at 11:00 AM and send confirmation email.")
                  }
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                >
                  📅 Book Calendar Appointment + Gmail
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerQuickPrompt("Register me as a new high-priority lead in the Lead CRM Google Sheet.")
                  }
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                >
                  📊 Log New Lead in Lead CRM Sheet
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerQuickPrompt("Cancel my scheduled meeting and update my status.")
                  }
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                >
                  ❌ Cancel Meeting & Update Status
                </button>
              </div>
            </section>

            <section className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[610px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-semibold text-white">
                  Live Multi-Level Agent Console ({selectedChannel})
                </h2>
                <span className="text-xs text-slate-400">
                  Trial User: {activeEmail}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[82%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {msg.channel} • {msg.timestamp}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="mr-auto bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs text-indigo-400">
                    ApexDesk AI is updating Orders, Leads, Calendar & Gmail...
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message ApexDesk AI via ${selectedChannel}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-sm font-semibold text-white transition"
                >
                  Send
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}