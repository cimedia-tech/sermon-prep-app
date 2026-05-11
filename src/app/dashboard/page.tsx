"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, ScriptureSheet } from "@/lib/supabase";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [sheets, setSheets] = useState<ScriptureSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [weekDate, setWeekDate] = useState("");
  const [anchorScripture, setAnchorScripture] = useState("");
  const [sermonTitle, setSermonTitle] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const fetchSheets = useCallback(async () => {
    const { data, error } = await supabase
      .from("scripture_sheets")
      .select("*")
      .order("week_date", { ascending: false });

    if (!error && data) {
      setSheets(data);
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
    formData.append("sermon_title", sermonTitle);

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
        setSermonTitle("");
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

    const today = new Date();
    const sheetDate = parseISO(sheet.week_date);

    if (filter === "upcoming") return matchesSearch && isAfter(sheetDate, today);
    if (filter === "past") return matchesSearch && isBefore(sheetDate, today);
    return matchesSearch;
  });

  const upcomingCount = sheets.filter((s) =>
    isAfter(parseISO(s.week_date), new Date())
  ).length;

  const thisWeekCount = sheets.filter((s) => {
    const d = parseISO(s.week_date);
    const now = new Date();
    return isAfter(d, now) && isBefore(d, addDays(now, 7));
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

        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-6">
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
              const isUpcoming = isAfter(sheetDate, new Date());
              const isThisWeek =
                isUpcoming && isBefore(sheetDate, addDays(new Date(), 7));

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

              {/* Sermon Title */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Sermon Title (optional)
                </label>
                <input
                  type="text"
                  value={sermonTitle}
                  onChange={(e) => setSermonTitle(e.target.value)}
                  placeholder="e.g. Walking in Faith"
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
