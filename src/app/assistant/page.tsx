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
} from "lucide-react";
import Link from "next/link";

type Mode = "outline" | "exegesis" | "devotional" | "points";

const modes: { id: Mode; label: string; icon: typeof BookOpen; desc: string }[] = [
  { id: "outline", label: "Sermon Outline", icon: FileText, desc: "Full structured outline with points & applications" },
  { id: "exegesis", label: "Exegesis", icon: ScrollText, desc: "Deep biblical analysis with original language notes" },
  { id: "devotional", label: "Devotional", icon: Heart, desc: "Warm devotional writing for personal or group use" },
  { id: "points", label: "Sermon Angles", icon: Lightbulb, desc: "5 creative sermon approaches to choose from" },
];

export default function AssistantPage() {
  const [scripture, setScripture] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("outline");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!scripture.trim()) return;
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scripture, title, mode }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.content);
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
              <p className="text-xs text-white/40">Powered by GPT-4o</p>
            </div>
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
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                Scripture Reference *
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
            <div className="prose prose-invert prose-sm max-w-none">
              <div
                className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {result}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
