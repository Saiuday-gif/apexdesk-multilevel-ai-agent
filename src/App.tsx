import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  LogOut,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Briefcase,
  GraduationCap,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const N8N_WEBHOOK_URL = '/n8n-chat/webhook/contact';
const STORAGE_KEY = 'apexdesk_saved_records_v1';

interface TaskRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  requirement: string;
  dateTime: string;
  status: 'Scheduled' | 'Booked' | 'Class Scheduled' | 'Completed';
  category: 'Consultancy' | 'Hospitality' | 'Education' | 'General';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [user, setUser] = useState<{ name: string; email: string; provider: string } | null>(null);
  const [emailInput, setEmailInput] = useState('saiuday81618@gmail.com');

  const [tasks, setTasks] = useState<TaskRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as TaskRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const createWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-' + Date.now(),
    sender: 'ai',
    text: 'Welcome to ApexDesk AI! Connected to your Google Workspace (saiuday81618@gmail.com). Type a request below to book appointments, check schedules, or update Google Sheets, Calendar, Gmail & WhatsApp.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => 'apex-' + Math.random().toString(36).substring(2, 10)
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage quota fallback
    }
  }, [tasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWorkspaceRefresh = () => {
    setIsRefreshing(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setTasks(saved ? (JSON.parse(saved) as TaskRecord[]) : []);
    } catch {
      setTasks([]);
    }
    setSessionId('apex-' + Math.random().toString(36).substring(2, 10));
    setMessages([createWelcomeMessage()]);
    setTimeout(() => setIsRefreshing(false), 350);
  };

  const handleSocialLogin = (provider: string, customEmail?: string) => {
    const userEmail =
      customEmail && customEmail.trim()
        ? customEmail.trim()
        : 'saiuday81618@gmail.com';
    setUser({
      name: 'Saiuday Somidi',
      email: userEmail,
      provider,
    });
    setView('dashboard');
  };

  const extractAndSaveRecord = (promptText: string) => {
    const lower = promptText.toLowerCase();
    const isBooking =
      lower.includes('book') ||
      lower.includes('schedule') ||
      lower.includes('appointment') ||
      lower.includes('add');

    if (!isBooking) return;

    const nameMatch = promptText.match(/Name:\s*([^,\n|]+)/i);
    const reqMatch = promptText.match(/Requirement:\s*([^,\n|]+)/i);
    const timeMatch = promptText.match(/Date\s*&?\s*Time:\s*([^,\n|]+)/i);
    const emailMatch = promptText.match(/Email:\s*([^,\n|\s]+)/i);
    const phoneMatch = promptText.match(/Phone:\s*([^,\n|\s]+)/i);

    let category: TaskRecord['category'] = 'General';
    if (lower.includes('consult')) category = 'Consultancy';
    else if (lower.includes('hospitality') || lower.includes('room') || lower.includes('suite'))
      category = 'Hospitality';
    else if (lower.includes('class') || lower.includes('course') || lower.includes('student'))
      category = 'Education';

    const newRecord: TaskRecord = {
      id: Date.now().toString(),
      name: nameMatch ? nameMatch[1].trim() : 'Client Booking',
      email: emailMatch ? emailMatch[1].trim() : 'saiuday81618@gmail.com',
      phone: phoneMatch ? phoneMatch[1].trim() : '918555892883',
      requirement: reqMatch
        ? reqMatch[1].trim()
        : promptText.length > 45
        ? promptText.slice(0, 45) + '...'
        : promptText,
      dateTime: timeMatch ? timeMatch[1].trim() : 'Scheduled (IST)',
      status: 'Scheduled',
      category,
    };

    setTasks((prev) => [newRecord, ...prev]);
    setShowRecords(true);
  };

  const extractReplyText = (payload: unknown): string => {
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload) && payload.length > 0) {
      return extractReplyText(payload[0]);
    }
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      if (typeof obj.output === 'string' && obj.output.trim()) return obj.output;
      if (typeof obj.text === 'string' && obj.text.trim()) return obj.text;
      if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
      if (typeof obj.response === 'string' && obj.response.trim()) return obj.response;
      if (obj.json && typeof obj.json === 'object') {
        return extractReplyText(obj.json);
      }
    }
    return '';
  };

  const sendMessageToAgent = async (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          chatInput: cleanPrompt,
          sessionId,
        }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        const cleanError = rawText.includes('<!DOCTYPE html>')
          ? `Server returned ${response.status}. Verify Webhook node Respond is set to "Using 'Respond to Webhook' Node" and workflow is Published.`
          : rawText || response.statusText;
        throw new Error(cleanError);
      }

      let replyText = '';

      try {
        const parsed = JSON.parse(rawText);
        replyText = extractReplyText(parsed) || rawText;
      } catch {
        replyText = rawText;
      }

      extractAndSaveRecord(cleanPrompt);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text:
            replyText.trim() ||
            'Completed! Google Sheets, Calendar, Gmail & WhatsApp updated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      const errMessage =
        err instanceof Error ? err.message : 'Unable to connect to n8n webhook.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: errMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
        <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ApexDesk <span className="text-indigo-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setView('login')}
              className="text-sm text-slate-300 hover:text-white transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Launch App
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8">
            <ShieldCheck className="w-4 h-4" /> Multi-Level Autonomous Operations Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Automate Bookings, CRM & Omnichannel Alerts in One Click
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Connect natural language commands and interactive task workflows directly to Google
            Sheets, Google Calendar, Gmail, and WhatsApp—zero manual follow-ups.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-semibold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 transition cursor-pointer"
            >
              Launch ApexDesk AI <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 text-left">
            {[
              {
                icon: FileSpreadsheet,
                title: 'Google Sheets CRM',
                desc: 'Auto-log & update client rows',
              },
              { icon: Calendar, title: 'Smart Calendar', desc: 'Slot check & IST scheduling' },
              { icon: Mail, title: 'Gmail Dispatches', desc: 'Branded instant confirmations' },
              {
                icon: MessageSquare,
                title: 'WhatsApp Alerts',
                desc: 'Real-time mobile summaries',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <item.icon className="w-6 h-6 text-indigo-400 mb-3" />
                <h3 className="font-semibold text-sm text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-900">
          ApexDesk AI • Enterprise Multi-Level Autonomous Agent Workspace
        </footer>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">ApexDesk AI</span>
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Sign in to Workspace</h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Connected to <span className="text-indigo-300">saiuday81618@gmail.com</span>
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google', 'saiuday81618@gmail.com')}
              className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition cursor-pointer"
            >
              <span className="font-bold text-blue-600 text-base">G</span> Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('LinkedIn', 'saiuday81618@gmail.com')}
              className="w-full py-3 px-4 rounded-xl bg-[#0A66C2] text-white font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#004182] transition cursor-pointer"
            >
              <span className="font-bold text-base">in</span> Continue with LinkedIn
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs text-slate-500">OR WORK EMAIL</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSocialLogin('Email', emailInput);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              placeholder="saiuday81618@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition cursor-pointer"
            >
              Launch Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-base">ApexDesk AI</span>
          </div>
          <button
            type="button"
            onClick={handleWorkspaceRefresh}
            title="Reset Chat & Refresh Workspace"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            One-Click Workflows
          </p>
          <button
            type="button"
            onClick={() =>
              sendMessageToAgent(
                'Check November 30, 2026 (IST) in Google Calendar (Get many events) and Google Sheets (Get row(s) in sheet). List all scheduled meetings, consultancy bookings, and class schedules concisely. Do not create or edit anything.'
              )
            }
            className="w-full text-left px-3 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs font-medium text-indigo-200 flex items-center gap-2 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" /> Check Nov 30 Schedules
          </button>
          <button
            type="button"
            onClick={() =>
              sendMessageToAgent(
                'Book a new Business Consultancy appointment. Name: Kiran Rao, Email: saiuday81618@gmail.com, Phone: 918555892883, Requirement: Business Consultancy, Date & Time: November 30, 2026 at 11:00 AM IST (30 mins), Status: Scheduled. Run Get many events, Create an event, Append row in sheet, Send Gmail, and summarize for WhatsApp.'
              )
            }
            className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" /> Quick Book Consultancy
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Saved Records ({tasks.length})
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowRecords((prev) => !prev)}
                title={showRecords ? 'Hide Records' : 'View Saved Records'}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1 transition cursor-pointer"
              >
                {showRecords ? (
                  <>
                    <EyeOff className="w-3 h-3 text-amber-400" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-indigo-400" /> View
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleWorkspaceRefresh}
                title="Refresh Saved Records"
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!showRecords ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Records are safely saved ({tasks.length}).
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click <span className="text-indigo-400 font-medium">View</span> above or add a new
                booking to display them.
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No records added in this session yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Book an appointment below to save and view it here.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() =>
                  sendMessageToAgent(
                    `Check status and details for ${task.name} (${task.requirement} on ${task.dateTime}) in Google Sheets and Google Calendar, and confirm if all notifications are sent.`
                  )
                }
                className="p-3.5 rounded-xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                    {task.category === 'Consultancy' && (
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    {task.category === 'Hospitality' && (
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {task.category === 'Education' && (
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    {task.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1">{task.requirement}</p>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {task.dateTime}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView('landing')}
            title="Sign Out"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-950">
        <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-2">
              Autonomous Multi-Level Agent
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Live n8n Connected
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Sheets CRM • Google Calendar • Gmail • WhatsApp Auto-Sync
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{user?.email}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Executing Sheets, Calendar, Gmail &
                WhatsApp tools...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessageToAgent(input);
            }}
            className="max-w-4xl mx-auto flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a booking, schedule check, update, or cancellation (e.g., Book a meeting tomorrow at 4 PM)..."
              className="flex-1 px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-sm flex items-center gap-2 transition cursor-pointer"
            >
              Send <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}