import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Settings, User, Calendar, CheckCircle2, 
  Sparkles, Trash2, X, Bell, Shield, Link as LinkIcon, 
  MessageSquare, FileSpreadsheet, Mail, Crown, Upload, Check
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function App() {
  // Personalized Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'onetime'>('monthly');

  const [userName, setUserName] = useState('Saiuday Somidi');
  const [userEmail, setUserEmail] = useState('saiuday81618@gmail.com');
  const [profilePic, setProfilePic] = useState(
    'https://ui-avatars.com/api/?name=Saiuday+Somidi&background=2563eb&color=fff&size=128'
  );
  const [webhookUrl, setWebhookUrl] = useState('https://uday1997.app.n8n.cloud/webhook/contact');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncSheets, setAutoSyncSheets] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: `Welcome to ApexDesk AI! Connected to your Google Workspace (${userEmail}). Type a request below to book appointments, check schedules, place orders, or update Google Sheets, Calendar, Gmail & WhatsApp.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: messageText,
          sessionId: userEmail,
          user: { name: userName, email: userEmail }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const rawText = await response.text();
      let replyText = rawText;
      try {
        const data = JSON.parse(rawText);
        replyText = data.output || data.text || data.message || rawText;
      } catch {
        replyText = rawText;
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Connection Error: ${error.message}. Please check your n8n Webhook URL in Settings.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'agent',
        text: 'Chat history cleared. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-100 font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col justify-between">
        <div>
          {/* Brand Logo */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">ApexDesk AI</span>
            </div>
            {isPremium && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            )}
          </div>

          {/* Quick Workflows */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Workflows
            </p>
            <div className="space-y-2">
              <button
                onClick={() => sendMessage('Check Nov 30 Schedule')}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2 transition"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                Check Nov 30 Schedule
              </button>
              <button
                onClick={() => sendMessage('I want to place an order for Web Design, 500 rupees')}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Quick Order & Pay
              </button>
            </div>
          </div>

          {/* Saved Records */}
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Connected Tools
            </p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2 px-2 py-1"><FileSpreadsheet className="w-3.5 h-3.5 text-green-400" /> Google Sheets Orders</div>
              <div className="flex items-center gap-2 px-2 py-1"><Calendar className="w-3.5 h-3.5 text-blue-400" /> Google Calendar</div>
              <div className="flex items-center gap-2 px-2 py-1"><Mail className="w-3.5 h-3.5 text-red-400" /> Gmail Alerts</div>
              <div className="flex items-center gap-2 px-2 py-1"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp & Razorpay</div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Gemini Style Profile + Plan + Settings Gear */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-800/60 transition">
            <div
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => setIsPremiumModalOpen(true)}
              title="Manage Plan & Profile"
            >
              <img
                src={profilePic}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border border-gray-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate leading-tight">{userName}</p>
                <p className={`text-xs mt-0.5 font-medium ${isPremium ? 'text-amber-400' : 'text-gray-400'}`}>
                  {isPremium ? 'Pro' : 'Free'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition shrink-0"
              title="Settings & Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-[#111827]/80 backdrop-blur px-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-semibold text-white">Autonomous Multi-Level Agent</h1>
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live n8n Connected
              </span>
            </div>
            <p className="text-xs text-gray-400">Sheets CRM • Google Calendar • Gmail • WhatsApp Auto-Sync</p>
          </div>

          {/* Top-Right Profile Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                isPremium
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-amber-500/50 hover:text-amber-300'
              }`}
              title="Switch Plan"
            >
              <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400' : 'text-gray-400'}`} />
              <span>{isPremium ? 'Pro Plan' : 'Free Plan'}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-2.5 cursor-pointer pl-2 border-l border-gray-800"
              onClick={() => setIsSettingsOpen(true)}
            >
              <div className="relative">
                <img
                  src={profilePic}
                  alt={userName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/50 shadow-md"
                />
                {isPremium && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center border border-[#111827]">
                    <Crown className="w-2 h-2 text-gray-950" />
                  </span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">{userName}</p>
                <p className="text-[11px] text-gray-400 mt-1">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#1F2937] text-gray-100 border border-gray-700/60 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="block text-[10px] opacity-60 mt-1.5 text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1F2937] border border-gray-700/60 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-gray-400">
                Agent is thinking & executing tools...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-gray-800 bg-[#111827]/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="max-w-4xl mx-auto flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a booking, order, schedule check, or payment request..."
              className="flex-1 bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Personalized Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Personalized Settings</h2>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              {/* Profile Picture Upload */}
              <div className="flex items-center gap-4 pb-2 border-b border-gray-800">
                <img
                  src={profilePic}
                  alt="Preview"
                  className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
                />
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1.5">Profile Picture</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded-lg cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Display Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Workspace Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> n8n Production Webhook URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-xs text-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 space-y-3 border-t border-gray-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-300">
                    <Bell className="w-4 h-4 text-gray-400" /> WhatsApp & Email Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-300">
                    <Shield className="w-4 h-4 text-gray-400" /> Auto-Sync Orders to Sheets
                  </span>
                  <input
                    type="checkbox"
                    checked={autoSyncSheets}
                    onChange={(e) => setAutoSyncSheets(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800 flex items-center justify-between">
              <button
                onClick={clearChat}
                className="px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Chat
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commercial Client Pricing & Premium Modal */}
      {isPremiumModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white">ApexDesk AI — Client Plans</h2>
                  <p className="text-xs text-amber-300/80">Choose Monthly SaaS or Full App Ownership</p>
                </div>
              </div>
              <button onClick={() => setIsPremiumModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Plan Selection Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-4 rounded-xl border text-left transition ${
                    selectedPlan === 'monthly'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-amber-400 uppercase">Monthly Plan</p>
                  <p className="text-2xl font-extrabold text-white mt-1">₹999<span className="text-xs font-normal text-gray-400">/mo</span></p>
                  <p className="text-[11px] text-gray-400 mt-1">Hosting + Maintenance</p>
                </button>

                <button
                  onClick={() => setSelectedPlan('onetime')}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    selectedPlan === 'onetime'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-gray-950 rounded-full">
                    FULL APP
                  </span>
                  <p className="text-xs font-semibold text-emerald-400 uppercase">Overall Setup</p>
                  <p className="text-2xl font-extrabold text-white mt-1">₹20,000</p>
                  <p className="text-[11px] text-gray-400 mt-1">One-Time Ownership</p>
                </button>
              </div>

              <ul className="space-y-2.5 text-sm text-gray-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited WhatsApp & Web AI Agent Messages</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated Razorpay Payment Links & Google Sheets Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {selectedPlan === 'onetime'
                      ? 'Full Source Code + Custom Branding + n8n Workflow Setup'
                      : 'Priority n8n Cloud Webhook Execution & Support'}
                  </span>
                </li>
              </ul>

              <button
                onClick={() => {
                  setIsPremium(true);
                  setIsPremiumModalOpen(false);
                }}
                className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-bold text-sm rounded-xl shadow-lg transition"
              >
                {isPremium
                  ? 'Premium Plan Active'
                  : selectedPlan === 'monthly'
                  ? 'Activate Monthly Plan (₹999/mo)'
                  : 'Get Full App Setup (₹20,000)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}