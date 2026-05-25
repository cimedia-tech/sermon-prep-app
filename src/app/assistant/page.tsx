"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Send,
  Loader2,
  FileText,
  ScrollText,
  Heart,
  Lightbulb,
  ArrowLeft,
  Copy,
  Check,
  Cpu,
  Calendar,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { supabase, ScriptureSheet } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type Mode = "outline" | "exegesis" | "devotional" | "points";
type LLM = "gpt-4o" | "gpt-4o-mini" | "gemini-flash" | "groq" | "ollama";

const LLM_OPTIONS: { id: LLM; label: string; badge: string; color: string }[] = [
  { id: "gpt-4o", label: "GPT-4o", badge: "Premium", color: "from-emerald-500 to-teal-600" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", badge: "Budget", color: "from-sky-500 to-blue-600" },
  { id: "gemini-flash", label: "Gemini Flash", badge: "Google", color: "from-amber-500 to-orange-500" },
  { id: "groq", label: "Groq (Llama 3.3)", badge: "Free Cloud", color: "from-orange-500 to-red-600" },
  { id: "ollama", label: "Ollama (Local)", badge: "Free", color: "from-slate-500 to-slate-700" },
];

const modes: { id: Mode; label: string; icon: typeof BookOpen; desc: string }[] = [
  { id: "outline", label: "Sermon Outline", icon: FileText, desc: "Full structured outline with points & applications" },
  { id: "exegesis", label: "Exegesis", icon: ScrollText, desc: "Deep biblical analysis with original language notes" },
  { id: "devotional", label: "Devotional", icon: Heart, desc: "Warm devotional writing for personal or group use" },
  { id: "points", label: "Sermon Angles", icon: Lightbulb, desc: "5 creative sermon approaches to choose from" },
];

const COMMENTARIES = [
  { id: "matthew_henry", label: "Matthew Henry" },
  { id: "spurgeon", label: "Charles Spurgeon" },
  { id: "john_calvin", label: "John Calvin" },
  { id: "adam_clarke", label: "Adam Clarke" },
  { id: "john_macarthur", label: "John MacArthur" },
];

export default function AssistantPage() {
  const [sheets, setSheets] = useState<ScriptureSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [scripture, setScripture] = useState("");
  const [supportingText, setSupportingText] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("outline");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCommentaries, setSelectedCommentaries] = useState<string[]>([]);
  const [llm, setLlm] = useState<LLM>("gemini-flash");
  const [fallbackInfo, setFallbackInfo] = useState<{
    fallbackUsed: boolean;
    primaryModel: LLM;
    actualModel: string;
  } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Fetch scripture sheets on mount
  useEffect(() => {
    const fetchSheets = async () => {
      const { data } = await supabase
        .from("scripture_sheets")
        .select("*")
        .order("week_date", { ascending: true });
      if (data) setSheets(data);
    };
    fetchSheets();
  }, []);

  // When a sheet is selected, auto-fill scripture fields
  const handleSheetSelect = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    const sheet = sheets.find((s) => s.id === sheetId);
    if (sheet) {
      setScripture(sheet.anchor_scripture);
      setTitle(sheet.sermon_title || "");
      // Build supporting text for the prompt
      if (sheet.supporting_scriptures) {
        const supporting = sheet.supporting_scriptures
          .split(" | ")
          .filter((s) => s !== sheet.anchor_scripture);
        setSupportingText(supporting.join(", "));
      } else {
        setSupportingText("");
      }
    } else {
      setScripture("");
      setTitle("");
      setSupportingText("");
    }
  };

  const toggleCommentary = (id: string) => {
    setSelectedCommentaries((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!scripture.trim()) return;
    setLoading(true);
    setResult("");
    setFallbackInfo(null);

    // Include supporting scriptures in the request
    const fullScripture = supportingText
      ? `${scripture} (Supporting readings: ${supportingText})`
      : scripture;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scripture: fullScripture,
          title,
          mode,
          commentaries: selectedCommentaries,
          llm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.content);
        if (data.fallbackUsed) {
          setFallbackInfo({
            fallbackUsed: true,
            primaryModel: data.primaryModel,
            actualModel: data.model
          });
        }
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to connect to AI. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    const content = document.getElementById("sermon-content")?.innerHTML;
    if (!content) return;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>${title || scripture || "Sermon Output"}</title>
            <style>
              body {
                font-family: 'Georgia', serif;
                line-height: 1.65;
                color: #111;
                padding: 40px;
              }
              h1 { font-size: 24pt; font-weight: bold; margin-top: 0; margin-bottom: 8px; }
              .meta { font-size: 10pt; color: #555; margin-bottom: 25px; border-bottom: 2px solid #eaeaea; padding-bottom: 15px; }
              h2 { font-size: 18pt; font-weight: bold; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; }
              h3 { font-size: 13pt; font-weight: bold; margin-top: 22px; margin-bottom: 8px; color: #b45309; }
              h4 { font-size: 11pt; font-weight: bold; margin-top: 18px; margin-bottom: 6px; color: #6d28d9; }
              p { font-size: 10.5pt; margin-bottom: 12px; text-align: justify; }
              ul { margin-bottom: 14px; padding-left: 22px; list-style-type: disc; }
              li { font-size: 10.5pt; margin-bottom: 6px; }
              strong { font-weight: bold; color: #000; }
              blockquote { border-left: 3.5px solid #6d28d9; background: #f5f3ff; padding: 12px 18px; margin: 18px 0; font-style: italic; border-radius: 0 6px 6px 0; color: #4b5563; }
              hr { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
              @media print {
                body { padding: 0; }
                @page { margin: 1in; }
              }
            </style>
          </head>
          <body>
            <h1>${title || "Sermon Prep Output"}</h1>
            <div class="meta">
              <strong>Scripture:</strong> ${scripture} | <strong>Generated on:</strong> ${new Date().toLocaleDateString()}
            </div>
            <div class="content">
              ${content}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Sermon AI
              </h1>
              <p className="text-xs text-white/40">Powered by {LLM_OPTIONS.find(l => l.id === llm)?.label}</p>
            </div>
          </div>

          {/* LLM Switcher */}
          <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1">
            {LLM_OPTIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLlm(l.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  llm === l.id
                    ? `bg-gradient-to-r ${l.color} text-white shadow-md`
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Cpu className="w-3 h-3" />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                mode === m.id
                  ? "bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10"
                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
              }`}
            >
              <m.icon
                className={`w-5 h-5 mb-2 ${
                  mode === m.id ? "text-violet-400" : "text-white/30"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  mode === m.id ? "text-white" : "text-white/50"
                }`}
              >
                {m.label}
              </p>
              <p className="text-xs text-white/20 mt-1 leading-relaxed">
                {m.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6 mb-6">
          <div className="space-y-4">

            {/* Date Picker Dropdown */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                Select Sunday Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <select
                  value={selectedSheetId}
                  onChange={(e) => handleSheetSelect(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a2e] text-white/50">
                    — Pick a date to auto-fill scriptures —
                  </option>
                  {sheets.map((s) => {
                    const d = parseISO(s.week_date);
                    // Account for potentially differing timezone offsets by formatting the date string directly or creating a new UTC date if needed.
                    // parseISO works fine, but let's make sure it shows cleanly.
                    return (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-[#1a1a2e] text-white"
                      >
                        {format(d, "MMM d, yyyy")} — {s.anchor_scripture}
                        {s.sermon_title ? ` (${s.sermon_title})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Selected Scriptures Display */}
            {selectedSheetId && (
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4">
                <p className="text-xs text-violet-400 uppercase tracking-wider mb-2">
                  Selected Readings
                </p>
                <p className="text-sm font-semibold text-amber-300 mb-1">
                  {scripture}
                </p>
                {supportingText && (
                  <p className="text-xs text-white/40">{supportingText}</p>
                )}
              </div>
            )}

            {/* Manual Scripture Override */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                Scripture Reference {selectedSheetId ? "(auto-filled)" : "*"}
              </label>
              <input
                type="text"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                placeholder="e.g. Romans 8:28-39"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Sermon Title */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                Sermon Title / Theme (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. More Than Conquerors"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Commentary Sources */}
            <div>
              <label className="block text-xs text-white/50 mb-2.5 uppercase tracking-wider">
                Include Commentary Perspectives
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMENTARIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCommentary(c.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all duration-200 ${
                      selectedCommentaries.includes(c.id)
                        ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/15"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                        selectedCommentaries.includes(c.id)
                          ? "bg-violet-500 border-violet-500"
                          : "border-white/20"
                      }`}
                    >
                      {selectedCommentaries.includes(c.id) && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !scripture.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate {modes.find((m) => m.id === mode)?.label}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">
                  {modes.find((m) => m.id === mode)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export to PDF
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            {fallbackInfo?.fallbackUsed && (
              <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-xs flex items-start gap-2.5 shadow-inner">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {fallbackInfo.actualModel === "ollama" ? "Local Fallback Active: " : "Cloud Fallback Active: "}
                  </span>
                  Cloud model <strong>{LLM_OPTIONS.find(l => l.id === fallbackInfo.primaryModel)?.label}</strong> request failed (tokens/quota limit exceeded). 
                  Automatically fell back to <strong>{LLM_OPTIONS.find(l => l.id === fallbackInfo.actualModel as LLM)?.label || fallbackInfo.actualModel}</strong>.
                </div>
              </div>
            )}
            <div id="sermon-content" className="prose prose-invert prose-sm max-w-none">
              <div
                className="text-white/80 leading-relaxed text-sm"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                <MarkdownRenderer content={result} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
