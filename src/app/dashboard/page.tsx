"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, ScriptureSheet, FALLBACK_SHEETS } from "@/lib/supabase";
import { format, parseISO, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import {
  Upload,
  BookOpen,
  Calendar,
  Bell,
  FileText,
  Plus,
  X,
  Check,
  Clock,
  ChevronRight,
  Search,
  Sparkles,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [sheets, setSheets] = useState<ScriptureSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [showScriptures, setShowScriptures] = useState(false);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [weekDate, setWeekDate] = useState("");
  const [anchorScripture, setAnchorScripture] = useState("");

  const [userEmail, setUserEmail] = useState("");

  // Telegram Chat Bridge State
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTelegramLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram");
      const data = await res.json();
      if (data.success) {
        setChatLogs(data.logs || []);
        setChatError("");
      } else {
        setChatError(data.error || "Failed to load chat logs");
      }
    } catch {
      setChatError("Local Telegram logs inaccessible. Make sure the app is running on localhost.");
    }
  }, []);

  const handleSendTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMsg("");
        fetchTelegramLogs();
      } else {
        alert(`Error sending message: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  useEffect(() => {
    fetchTelegramLogs();
    const interval = setInterval(fetchTelegramLogs, 2000);
    return () => clearInterval(interval);
  }, [fetchTelegramLogs]);

  useEffect(() => {
    if (chatLogs.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLogs]);

  const fetchSheets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("scripture_sheets")
        .select("*");

      let sourceData: ScriptureSheet[] = FALLBACK_SHEETS;
      if (!error && data && data.length > 0) {
        sourceData = data;
      } else {
        console.warn("Supabase returned empty or error, using fallback sheets.");
      }

      const today = startOfDay(new Date()).getTime();
      const sortedData = sourceData.sort((a, b) => {
        const timeA = parseISO(a.week_date).getTime();
        const timeB = parseISO(b.week_date).getTime();
        
        const isUpcomingA = timeA >= today;
        const isUpcomingB = timeB >= today;
        
        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;
        
        if (isUpcomingA && isUpcomingB) {
          return timeA - timeB;
        } else {
          return timeB - timeA;
        }
      });
      setSheets(sortedData);
    } catch (e) {
      console.error("Failed to fetch from Supabase, using sorted fallback sheets:", e);
      try {
        const today = startOfDay(new Date()).getTime();
        const sortedData = [...FALLBACK_SHEETS].sort((a, b) => {
          const timeA = parseISO(a.week_date).getTime();
          const timeB = parseISO(b.week_date).getTime();
          
          const isUpcomingA = timeA >= today;
          const isUpcomingB = timeB >= today;
          
          if (isUpcomingA && !isUpcomingB) return -1;
          if (!isUpcomingA && isUpcomingB) return 1;
          
          if (isUpcomingA && isUpcomingB) {
            return timeA - timeB;
          } else {
            return timeB - timeA;
          }
        });
        setSheets(sortedData);
      } catch (err) {
        setSheets(FALLBACK_SHEETS);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !weekDate || !anchorScripture || !userEmail) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("week_date", weekDate);
    formData.append("anchor_scripture", anchorScripture);
    formData.append("user_email", userEmail);


    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowUpload(false);
        setFile(null);
        setWeekDate("");
        setAnchorScripture("");

        fetchSheets();
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch =
      sheet.anchor_scripture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sheet.sermon_title || "").toLowerCase().includes(searchTerm.toLowerCase());

    const today = startOfDay(new Date());
    const sheetDate = parseISO(sheet.week_date);

    if (filter === "upcoming") return matchesSearch && sheetDate >= today;
    if (filter === "past") return matchesSearch && sheetDate < today;
    return matchesSearch;
  });

  const upcomingCount = sheets.filter((s) => {
    const d = parseISO(s.week_date);
    return d >= startOfDay(new Date());
  }).length;

  const thisWeekCount = sheets.filter((s) => {
    const d = parseISO(s.week_date);
    const today = startOfDay(new Date());
    return d >= today && d < addDays(today, 7);
  }).length;

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Sermon Prep
              </h1>
              <p className="text-xs text-white/40">Scripture Sheet Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/assistant"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              Sermon AI
            </Link>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              New Sheet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Sheets",
              value: sheets.length,
              icon: FileText,
              color: "from-blue-500/20 to-indigo-500/20",
              border: "border-blue-500/20",
            },
            {
              label: "Upcoming",
              value: upcomingCount,
              icon: Calendar,
              color: "from-amber-500/20 to-orange-500/20",
              border: "border-amber-500/20",
            },
            {
              label: "This Week",
              value: thisWeekCount,
              icon: Bell,
              color: "from-emerald-500/20 to-green-500/20",
              border: "border-emerald-500/20",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} p-5 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className="w-4 h-4 text-white/50" />
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* View Scriptures Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowScriptures(!showScriptures)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              showScriptures
                ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
                : "bg-white/[0.03] border border-white/5 text-white/50 hover:border-white/15"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {showScriptures ? "Hide" : "View"} Scriptures
          </button>
        </div>

        {/* Sorted Scripture List */}
        {showScriptures && (
          <div className="mb-8 rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white/70">Scripture Schedule — Sorted by Date</h3>
            </div>
            <div className="divide-y divide-white/5">
              {sheets.map((sheet) => {
                  const d = parseISO(sheet.week_date);
                  const isPast = d < startOfDay(new Date());
                  const supporting = sheet.supporting_scriptures
                    ? sheet.supporting_scriptures.split(" | ").filter(s => s !== sheet.anchor_scripture)
                    : [];
                  return (
                    <div
                      key={sheet.id}
                      className={`px-5 py-4 ${isPast ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-mono text-white/30 w-24 pt-0.5 flex-shrink-0">
                            {format(d, "MMM d, yyyy")}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-amber-300">
                              {sheet.anchor_scripture}
                            </p>
                            {supporting.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                {supporting.map((s, i) => (
                                  <span key={i} className="text-xs text-white/40">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-white/20 flex-shrink-0 pt-0.5">
                          {sheet.sermon_title || ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Sheets & Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search + Filters */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by scripture or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {(["all", "upcoming", "past"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                      filter === f
                        ? "bg-amber-500 text-white shadow-md"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scripture Sheets List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 text-sm">
                  {sheets.length === 0
                    ? "No scripture sheets yet. Upload your first one!"
                    : "No results match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSheets.map((sheet) => {
                  const sheetDate = parseISO(sheet.week_date);
                  const today = startOfDay(new Date());
                  const isUpcoming = sheetDate >= today;
                  const isThisWeek =
                    isUpcoming && sheetDate < addDays(today, 7);

                  return (
                    <a
                      key={sheet.id}
                      href={sheet.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 p-5 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-amber-500/5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isThisWeek
                                ? "bg-amber-500/20 text-amber-400"
                                : isUpcoming
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-white/5 text-white/30"
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium text-sm group-hover:text-amber-300 transition-colors">
                              {sheet.sermon_title || sheet.anchor_scripture}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {sheet.anchor_scripture}
                              </span>
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(sheetDate, "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isThisWeek && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              This Week
                            </span>
                          )}
                          {sheet.is_processed && (
                            <span className="text-emerald-400">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Telegram Live Bridge */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Telegram Live Bridge</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Bot Active</span>
              </div>
            </div>

            {chatError ? (
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-white/40 rounded-xl text-[11px] leading-relaxed text-center space-y-2">
                <p className="font-semibold text-amber-400/80">Local State Notice</p>
                <p>{chatError}</p>
              </div>
            ) : (
              <>
                {/* Chat window */}
                <div className="h-[320px] overflow-y-auto space-y-3 pr-1 text-xs">
                  {chatLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-white/10">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <p>No messages yet. Send a message to the bot to start.</p>
                    </div>
                  ) : (
                    chatLogs.map((log: any, idx: number) => {
                      const isIncoming = log.direction === "incoming";
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isIncoming ? "items-start" : "items-end"}`}
                        >
                          <span className="text-[9px] text-white/20 mb-0.5 px-1 font-mono">
                            {log.user} • {log.timestamp ? format(parseISO(log.timestamp), "HH:mm") : ""}
                          </span>
                          <div
                            className={`max-w-[90%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                              isIncoming
                                ? "bg-white/5 text-white/80 rounded-tl-none border border-white/5"
                                : "bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-tr-none shadow-md shadow-amber-500/5"
                            }`}
                          >
                            {log.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input field */}
                <form onSubmit={handleSendTelegram} className="flex gap-2 pt-3 border-t border-white/5">
                  <input
                    type="text"
                    placeholder="Send a message to Telegram..."
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !chatMsg.trim()}
                    className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:shadow-amber-500/10 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                  >
                    {sendingMsg ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Upload Scripture Sheet
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  PDF File
                </label>
                <label className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-amber-500/30 transition-colors">
                  <Upload className="w-5 h-5 text-white/30" />
                  <span className="text-sm text-white/40">
                    {file ? file.name : "Choose PDF file"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Week Date */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Sermon Date
                </label>
                <input
                  type="date"
                  value={weekDate}
                  onChange={(e) => setWeekDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Anchor Scripture */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Anchor Scripture
                </label>
                <input
                  type="text"
                  value={anchorScripture}
                  onChange={(e) => setAnchorScripture(e.target.value)}
                  placeholder="e.g. John 3:16-21"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>


              {/* Email */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="pastor@church.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Sheet
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
