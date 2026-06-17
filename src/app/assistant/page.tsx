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
  Quote,
  Clock,
  Compass,
  Bookmark,
  Users,
  Target,
  ChevronDown,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { supabase, ScriptureSheet, FALLBACK_SHEETS } from "@/lib/supabase";
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

const ARTIFACT_OPTIONS = [
  { id: "context", label: "Scripture Context", desc: "Anchor scripture text & historical context notes" },
  { id: "theme", label: "Theme & Amplification", desc: "Central theme, Jesus connection & hidden insights" },
  { id: "lexicon", label: "Lexicon (Word Study)", desc: "Greek/Hebrew word pronunciations & definitions" },
  { id: "outline", label: "Teaching Outline", desc: "Observation, interpretation, application & leadership principles" },
  { id: "script", label: "Teaching Script", desc: "Complete word-for-word teaching script" },
  { id: "sermon", label: "Sermon Summary", desc: "Preach-ready outline, illustration & altar call" },
  { id: "commentary", label: "Commentaries", desc: "Historical & character perspectives" },
  { id: "devotional", label: "Devotional Reflection", desc: "Reflection questions, prayer & memory verse" },
  { id: "worship", label: "Worship Connection", desc: "Congregational worship themes & faith declarations" },
  { id: "action", label: "Action Plan", desc: "Weekly practical application schedules" }
];

// TypeScript Interfaces for the Scripture Framework
interface AnchorScripture {
  reference: string;
  translation: string;
  text: string;
  historical_context: {
    author: string;
    audience: string;
    setting: string;
    context: string;
  };
}

interface CentralTheme {
  title: string;
  summary: string;
  kingdom_principle: string;
}

interface AnchorAmplification {
  then: string;
  through_jesus: string;
  now: string;
}

interface VocabularyWord {
  word: string;
  strongs_number: string;
  language: string;
  pronunciation: string;
  definition: string;
  spiritual_significance: string;
}

interface TeachingOutline {
  observation: string[];
  interpretation: string[];
  application: string[];
}

interface HiddenInsights {
  symbolism: string[];
  patterns: string[];
  repeated_words: string[];
  prophetic_shadows: string[];
  deeper_revelations: string[];
}

interface MatthewHenryPerspective {
  summary: string;
  warnings: string[];
  encouragements: string[];
  practical_lessons: string[];
}

interface PropheticParallel {
  church_age_application: string;
  end_time_implications: string;
  personal_prophetic_significance: string;
  kingdom_fulfillment: string;
}

interface PsychologicalContrast {
  world_response: string;
  kingdom_response: string;
}

interface DevotionalReflection {
  reflection_question: string;
  prayer: string;
  action_step: string;
}

interface MainPoint {
  title: string;
  content: string;
}

interface TeachingScript {
  introduction: string;
  main_points: MainPoint[];
  illustration: string;
  challenge: string;
  closing_prayer: string;
}

interface ShortSermon {
  title: string;
  introduction: string;
  scripture_reading: string;
  main_points: MainPoint[];
  illustration: string;
  invitation: string;
  conclusion: string;
}

interface JesusConnection {
  messianic_relevance: string;
  fulfillment: string;
  gospel_application: string;
}

interface BiblicalCharacterStudy {
  name: string;
  role: string;
  significance: string;
  lesson: string;
}

interface CrossReference {
  reference: string;
  relationship: string;
}

interface LeadershipPrinciple {
  principle: string;
  application: string;
}

interface WorshipConnection {
  theme: string;
  response: string;
  worship_application: string;
}

interface MemoryVerse {
  reference: string;
  text: string;
}

interface MinistryApplication {
  individual: string;
  family: string;
  church: string;
  community: string;
}

interface StoryIllustration {
  title: string;
  story: string;
  lesson: string;
}

interface WeeklyActionPlan {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface StudyMetadata {
  week_of: string;
  theme_year: string;
  speaker: string;
  church: string;
  generated_date: string;
  tags: string[];
}

interface StudyFramework {
  framework_name: string;
  version: string;
  study: {
    anchor_scripture: AnchorScripture;
    central_theme: CentralTheme;
    anchor_amplification: AnchorAmplification;
    vocabulary_study: VocabularyWord[];
    teaching_outline: TeachingOutline;
    hidden_insights: HiddenInsights;
    matthew_henry_perspective: MatthewHenryPerspective;
    prophetic_parallel: PropheticParallel;
    psychological_contrast: PsychologicalContrast;
    devotional_reflection: DevotionalReflection;
    teaching_script: TeachingScript;
    short_sermon: ShortSermon;
    jesus_connection: JesusConnection;
    biblical_character_study: BiblicalCharacterStudy[];
    cross_references: CrossReference[];
    leadership_principles: LeadershipPrinciple[];
    worship_connection: WorshipConnection;
    faith_declarations: string[];
    memory_verse: MemoryVerse;
    discussion_questions: string[];
    ministry_application: MinistryApplication;
    story_illustration: StoryIllustration;
    weekly_action_plan: WeeklyActionPlan;
    study_metadata: StudyMetadata;
  };
}

// Convert parsed JSON to Markdown representation
function convertFrameworkToMarkdown(f: StudyFramework): string {
  const s = f.study;
  let md = `# ${s.central_theme?.title || "Scripture Study Breakdown"}\n`;
  md += `**Theme Year:** ${s.study_metadata?.theme_year || "A Destiny by Divine Design"}\n`;
  if (s.study_metadata?.week_of) md += `**Week of:** ${s.study_metadata.week_of}\n`;
  if (s.study_metadata?.speaker) md += `**Speaker:** ${s.study_metadata.speaker}\n`;
  if (s.study_metadata?.church) md += `**Church:** ${s.study_metadata.church}\n`;
  md += `**Generated Date:** ${s.study_metadata?.generated_date || new Date().toLocaleDateString()}\n\n`;

  md += `## Anchor Scripture\n`;
  md += `**Reference:** ${s.anchor_scripture?.reference || ""} (${s.anchor_scripture?.translation || "KJV"})\n\n`;
  md += `> ${s.anchor_scripture?.text || ""}\n\n`;
  md += `### Historical Context\n`;
  md += `- **Author:** ${s.anchor_scripture?.historical_context?.author || ""}\n`;
  md += `- **Audience:** ${s.anchor_scripture?.historical_context?.audience || ""}\n`;
  md += `- **Setting:** ${s.anchor_scripture?.historical_context?.setting || ""}\n`;
  md += `- **Context:** ${s.anchor_scripture?.historical_context?.context || ""}\n\n`;

  md += `## Central Theme & Amplification\n`;
  md += `**Central Theme Summary:** ${s.central_theme?.summary || ""}\n\n`;
  md += `**Kingdom Principle:** ${s.central_theme?.kingdom_principle || ""}\n\n`;
  md += `### Anchor Amplification\n`;
  md += `- **Then (Historical Era):** ${s.anchor_amplification?.then || ""}\n`;
  md += `- **Through Jesus:** ${s.anchor_amplification?.through_jesus || ""}\n`;
  md += `- **Now (Believers Today):** ${s.anchor_amplification?.now || ""}\n\n`;

  md += `## Vocabulary Study\n`;
  s.vocabulary_study?.forEach((v) => {
    md += `### ${v.word || ""} (${v.language || ""})\n`;
    md += `- **Strong's Number:** ${v.strongs_number || ""}\n`;
    md += `- **Pronunciation:** ${v.pronunciation || ""}\n`;
    md += `- **Definition:** ${v.definition || ""}\n`;
    md += `- **Spiritual Significance:** ${v.spiritual_significance || ""}\n\n`;
  });

  md += `## Teaching Outline\n`;
  md += `### Observation\n`;
  s.teaching_outline?.observation?.forEach((o) => { md += `- ${o}\n`; });
  md += `\n### Interpretation\n`;
  s.teaching_outline?.interpretation?.forEach((i) => { md += `- ${i}\n`; });
  md += `\n### Application\n`;
  s.teaching_outline?.application?.forEach((a) => { md += `- ${a}\n`; });
  md += `\n`;

  md += `## Hidden Insights\n`;
  md += `### Symbolism\n`;
  s.hidden_insights?.symbolism?.forEach((sym) => { md += `- ${sym}\n`; });
  md += `\n### Patterns\n`;
  s.hidden_insights?.patterns?.forEach((p) => { md += `- ${p}\n`; });
  md += `\n### Repeated Words\n`;
  s.hidden_insights?.repeated_words?.forEach((w) => { md += `- ${w}\n`; });
  md += `\n### Prophetic Shadows\n`;
  s.hidden_insights?.prophetic_shadows?.forEach((sh) => { md += `- ${sh}\n`; });
  md += `\n### Deeper Revelations\n`;
  s.hidden_insights?.deeper_revelations?.forEach((r) => { md += `- ${r}\n`; });
  md += `\n`;

  md += `## Matthew Henry Perspective\n`;
  md += `**Summary:** ${s.matthew_henry_perspective?.summary || ""}\n\n`;
  md += `### Warnings\n`;
  s.matthew_henry_perspective?.warnings?.forEach((w) => { md += `- ${w}\n`; });
  md += `\n### Encouragements\n`;
  s.matthew_henry_perspective?.encouragements?.forEach((e) => { md += `- ${e}\n`; });
  md += `\n### Practical Lessons\n`;
  s.matthew_henry_perspective?.practical_lessons?.forEach((l) => { md += `- ${l}\n`; });
  md += `\n`;

  md += `## Prophetic Parallel\n`;
  md += `- **Church Age Application:** ${s.prophetic_parallel?.church_age_application || ""}\n`;
  md += `- **End Time Implications:** ${s.prophetic_parallel?.end_time_implications || ""}\n`;
  md += `- **Personal Prophetic Significance:** ${s.prophetic_parallel?.personal_prophetic_significance || ""}\n`;
  md += `- **Kingdom Fulfillment:** ${s.prophetic_parallel?.kingdom_fulfillment || ""}\n\n`;

  md += `## Psychological Contrast\n`;
  md += `- **World Response:** ${s.psychological_contrast?.world_response || ""}\n`;
  md += `- **Kingdom Response:** ${s.psychological_contrast?.kingdom_response || ""}\n\n`;

  md += `## Devotional Reflection\n`;
  md += `**Reflection Question:** ${s.devotional_reflection?.reflection_question || ""}\n\n`;
  md += `**Daily Action Step:** ${s.devotional_reflection?.action_step || ""}\n\n`;
  md += `**Prayer:** *${s.devotional_reflection?.prayer || ""}*\n\n`;

  md += `## Worship Connection\n`;
  md += `- **Theme:** ${s.worship_connection?.theme || ""}\n`;
  md += `- **Response:** ${s.worship_connection?.response || ""}\n`;
  md += `- **Worship Application:** ${s.worship_connection?.worship_application || ""}\n\n`;

  md += `## Faith Declarations\n`;
  s.faith_declarations?.forEach((d) => { md += `- ${d}\n`; });
  md += `\n`;

  md += `## Memory Verse\n`;
  md += `**Reference:** ${s.memory_verse?.reference || ""}\n\n`;
  md += `> ${s.memory_verse?.text || ""}\n\n`;

  md += `## Discussion Questions\n`;
  s.discussion_questions?.forEach((q) => { md += `- ${q}\n`; });
  md += `\n`;

  md += `## Ministry Application\n`;
  md += `- **Individual:** ${s.ministry_application?.individual || ""}\n`;
  md += `- **Family:** ${s.ministry_application?.family || ""}\n`;
  md += `- **Church:** ${s.ministry_application?.church || ""}\n`;
  md += `- **Community:** ${s.ministry_application?.community || ""}\n\n`;

  md += `## Story Illustration\n`;
  md += `### ${s.story_illustration?.title || ""}\n`;
  md += `${s.story_illustration?.story || ""}\n\n`;
  md += `**Lesson:** ${s.story_illustration?.lesson || ""}\n\n`;

  md += `## Weekly Action Plan\n`;
  md += `- **Monday:** ${s.weekly_action_plan?.monday || ""}\n`;
  md += `- **Tuesday:** ${s.weekly_action_plan?.tuesday || ""}\n`;
  md += `- **Wednesday:** ${s.weekly_action_plan?.wednesday || ""}\n`;
  md += `- **Thursday:** ${s.weekly_action_plan?.thursday || ""}\n`;
  md += `- **Friday:** ${s.weekly_action_plan?.friday || ""}\n`;
  md += `- **Saturday:** ${s.weekly_action_plan?.saturday || ""}\n`;
  md += `- **Sunday:** ${s.weekly_action_plan?.sunday || ""}\n\n`;

  md += `## Biblical Character Study\n`;
  s.biblical_character_study?.forEach((c) => {
    md += `### ${c.name || ""} - ${c.role || ""}\n`;
    md += `- **Significance:** ${c.significance || ""}\n`;
    md += `- **Lesson:** ${c.lesson || ""}\n\n`;
  });

  md += `## Jesus Connection\n`;
  md += `- **Messianic Relevance:** ${s.jesus_connection?.messianic_relevance || ""}\n`;
  md += `- **Fulfillment:** ${s.jesus_connection?.fulfillment || ""}\n`;
  md += `- **Gospel Application:** ${s.jesus_connection?.gospel_application || ""}\n\n`;

  md += `## Cross References\n`;
  s.cross_references?.forEach((r) => {
    md += `- **Reference:** ${r.reference || ""}\n`;
    md += `  - **Relationship:** ${r.relationship || ""}\n`;
  });
  md += `\n`;

  md += `## Leadership Principles\n`;
  s.leadership_principles?.forEach((l) => {
    md += `- **Principle:** ${l.principle || ""}\n`;
    md += `  - **Application:** ${l.application || ""}\n`;
  });
  md += `\n`;

  md += `## Teaching Script\n`;
  md += `### Introduction\n${s.teaching_script?.introduction || ""}\n\n`;
  md += `### Main Points\n`;
  s.teaching_script?.main_points?.forEach((p, idx) => {
    md += `#### ${idx + 1}. ${p.title || ""}\n`;
    md += `${p.content || ""}\n\n`;
  });
  md += `### Illustration\n${s.teaching_script?.illustration || ""}\n\n`;
  md += `### Challenge\n${s.teaching_script?.challenge || ""}\n\n`;
  md += `### Closing Prayer\n${s.teaching_script?.closing_prayer || ""}\n\n`;

  md += `## Short Sermon\n`;
  md += `### Title: ${s.short_sermon?.title || ""}\n\n`;
  md += `**Scripture Reading:** ${s.short_sermon?.scripture_reading || ""}\n\n`;
  md += `### Introduction\n${s.short_sermon?.introduction || ""}\n\n`;
  md += `### Main Points\n`;
  s.short_sermon?.main_points?.forEach((p, idx) => {
    md += `#### ${idx + 1}. ${p.title || ""}\n`;
    md += `${p.content || ""}\n\n`;
  });
  md += `### Illustration\n${s.short_sermon?.illustration || ""}\n\n`;
  md += `### Invitation\n${s.short_sermon?.invitation || ""}\n\n`;
  md += `### Conclusion\n${s.short_sermon?.conclusion || ""}\n\n`;

  return md;
}

// Convert parsed JSON to stylized Print HTML for premium PDF download
function convertFrameworkToPrintHtml(f: StudyFramework): string {
  const s = f.study;
  const title = s.central_theme?.title || "Scripture Study Breakdown";
  const scripture = s.anchor_scripture?.reference || "";
  const date = s.study_metadata?.generated_date || new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Sermon Prep Pack</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Georgia:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            padding: 40px;
            background: #fff;
            max-width: 900px;
            margin: 0 auto;
          }
          h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            color: #111827;
            margin-top: 0;
          }
          .title-page {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 3px double #e5e7eb;
            padding-bottom: 30px;
          }
          .title-page h1 {
            font-size: 28pt;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 10px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            max-width: 600px;
            margin: 20px auto 0 auto;
            font-size: 11pt;
            color: #4b5563;
            text-align: left;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 8px;
            background: #f9fafb;
          }
          .meta-item strong {
            color: #111827;
          }
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          h2 {
            font-size: 18pt;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 6px;
            margin-top: 40px;
            margin-bottom: 15px;
            color: #4f46e5;
          }
          h3 {
            font-size: 13pt;
            color: #b45309;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 4px;
          }
          .scripture-box {
            font-family: 'Georgia', serif;
            font-size: 12pt;
            line-height: 1.7;
            background: #f5f3ff;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
            color: #374151;
            font-style: italic;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .card {
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .card-title {
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
            color: #111827;
            margin-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 4px;
            font-size: 11pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .vocab-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .vocab-table th, .vocab-table td {
            border: 1px solid #e5e7eb;
            padding: 10px 12px;
            text-align: left;
            font-size: 10pt;
          }
          .vocab-table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .timeline {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
          }
          .timeline-day {
            display: grid;
            grid-template-columns: 120px 1fr;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 8px;
          }
          .day-name {
            font-weight: 600;
            color: #4f46e5;
            text-transform: uppercase;
            font-size: 9pt;
            letter-spacing: 0.05em;
          }
          .contrast-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 15px;
          }
          .contrast-card {
            padding: 18px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .contrast-card.world {
            background: #fff5f5;
            border-left: 4px solid #ef4444;
          }
          .contrast-card.kingdom {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
          }
          ul, ol {
            padding-left: 20px;
            margin-top: 8px;
            margin-bottom: 15px;
          }
          li {
            margin-bottom: 6px;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 1in; }
          }
        </style>
      </head>
      <body>
        <div class="title-page">
          <h1>${title}</h1>
          <h3>Weekly Scripture Study & Sermon Prep Pack</h3>
          <div class="meta-grid">
            <div class="meta-item"><strong>Anchor Scripture:</strong> ${scripture}</div>
            <div class="meta-item"><strong>Translation:</strong> ${s.anchor_scripture?.translation || "KJV"}</div>
            <div class="meta-item"><strong>Speaker:</strong> ${s.study_metadata?.speaker || "N/A"}</div>
            <div class="meta-item"><strong>Church:</strong> ${s.study_metadata?.church || "N/A"}</div>
            <div class="meta-item"><strong>Theme Year:</strong> ${s.study_metadata?.theme_year || "A Destiny by Divine Design"}</div>
            <div class="meta-item"><strong>Date Generated:</strong> ${date}</div>
          </div>
        </div>

        <div class="section">
          <h2>I. Scripture & Historical Context</h2>
          <div class="scripture-box">
            "${s.anchor_scripture?.text || ""}"
          </div>
          <div class="grid-2">
            <div class="card">
              <div class="card-title">Author & Audience</div>
              <p><strong>Author:</strong> ${s.anchor_scripture?.historical_context?.author || ""}</p>
              <p><strong>Audience:</strong> ${s.anchor_scripture?.historical_context?.audience || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Setting & Literary Context</div>
              <p><strong>Setting:</strong> ${s.anchor_scripture?.historical_context?.setting || ""}</p>
              <p><strong>Context:</strong> ${s.anchor_scripture?.historical_context?.context || ""}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>II. Theme & Amplification</h2>
          <div class="card" style="margin-bottom: 15px;">
            <div class="card-title">Central Theme</div>
            <p><strong>Summary:</strong> ${s.central_theme?.summary || ""}</p>
            <p><strong>Kingdom Principle:</strong> ${s.central_theme?.kingdom_principle || ""}</p>
          </div>
          <div class="grid-3">
            <div class="card">
              <div class="card-title">Then (Original Era)</div>
              <p>${s.anchor_amplification?.then || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Through Jesus</div>
              <p>${s.anchor_amplification?.through_jesus || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Now (Believers Today)</div>
              <p>${s.anchor_amplification?.now || ""}</p>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section">
          <h2>III. Original Language Word Study</h2>
          <table class="vocab-table">
            <thead>
              <tr>
                <th style="width: 15%">Word</th>
                <th style="width: 15%">Strongs / Lang</th>
                <th style="width: 15%">Pronunciation</th>
                <th style="width: 25%">Definition</th>
                <th style="width: 30%">Spiritual Significance</th>
              </tr>
            </thead>
            <tbody>
              ${s.vocabulary_study?.map(v => `
                <tr>
                  <td><strong>${v.word || ""}</strong></td>
                  <td>${v.strongs_number || ""} (${v.language || ""})</td>
                  <td><em>${v.pronunciation || ""}</em></td>
                  <td>${v.definition || ""}</td>
                  <td>${v.spiritual_significance || ""}</td>
                </tr>
              `).join("") || "<tr><td colspan='5'>No vocabulary studies provided.</td></tr>"}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>IV. Biblical Character Study</h2>
          <div class="grid-2">
            ${s.biblical_character_study?.map(c => `
              <div class="card">
                <div class="card-title">${c.name || ""} - ${c.role || ""}</div>
                <p><strong>Significance:</strong> ${c.significance || ""}</p>
                <p><strong>Life Lesson:</strong> ${c.lesson || ""}</p>
              </div>
            `).join("") || "<p>No character studies available.</p>"}
          </div>
        </div>

        <div class="section">
          <h2>V. Prophetic Parallel & Hidden Insights</h2>
          <div class="grid-2">
            <div class="card">
              <div class="card-title">Prophetic Parallel</div>
              <p><strong>Church Age Application:</strong> ${s.prophetic_parallel?.church_age_application || ""}</p>
              <p><strong>End Time Implications:</strong> ${s.prophetic_parallel?.end_time_implications || ""}</p>
              <p><strong>Personal Prophetic Significance:</strong> ${s.prophetic_parallel?.personal_prophetic_significance || ""}</p>
              <p><strong>Kingdom Fulfillment:</strong> ${s.prophetic_parallel?.kingdom_fulfillment || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Hidden Insights</div>
              <p><strong>Symbolism:</strong> ${s.hidden_insights?.symbolism?.join("; ") || ""}</p>
              <p><strong>Patterns:</strong> ${s.hidden_insights?.patterns?.join("; ") || ""}</p>
              <p><strong>Repeated Words:</strong> ${s.hidden_insights?.repeated_words?.join("; ") || ""}</p>
              <p><strong>Prophetic Shadows:</strong> ${s.hidden_insights?.prophetic_shadows?.join("; ") || ""}</p>
              <p><strong>Deeper Revelations:</strong> ${s.hidden_insights?.deeper_revelations?.join("; ") || ""}</p>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section">
          <h2>VI. Teaching Outline</h2>
          <div class="grid-3">
            <div class="card">
              <div class="card-title" style="color: #4f46e5;">Observations</div>
              <ul>
                ${s.teaching_outline?.observation?.map(o => `<li>${o}</li>`).join("") || ""}
              </ul>
            </div>
            <div class="card">
              <div class="card-title" style="color: #d97706;">Interpretation</div>
              <ul>
                ${s.teaching_outline?.interpretation?.map(i => `<li>${i}</li>`).join("") || ""}
              </ul>
            </div>
            <div class="card">
              <div class="card-title" style="color: #16a34a;">Application</div>
              <ul>
                ${s.teaching_outline?.application?.map(a => `<li>${a}</li>`).join("") || ""}
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>VII. Teaching Script</h2>
          <div class="card">
            <div class="card-title">Introduction</div>
            <p>${s.teaching_script?.introduction || ""}</p>
            
            <div class="card-title" style="margin-top: 15px;">Main Points</div>
            ${s.teaching_script?.main_points?.map((p, idx) => `
              <p><strong>${idx + 1}. ${p.title || ""}</strong></p>
              <p style="padding-left: 15px; border-left: 2px solid #e5e7eb; margin-bottom: 15px;">${p.content || ""}</p>
            `).join("") || ""}

            <div class="card-title" style="margin-top: 15px;">Illustration</div>
            <p>${s.teaching_script?.illustration || ""}</p>

            <div class="card-title" style="margin-top: 15px;">Challenge</div>
            <p>${s.teaching_script?.challenge || ""}</p>

            <div class="card-title" style="margin-top: 15px;">Closing Prayer</div>
            <p><em>${s.teaching_script?.closing_prayer || ""}</em></p>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section">
          <h2>VIII. Short Sermon Summary</h2>
          <div class="card">
            <div class="card-title">${s.short_sermon?.title || "Sermon Summary"}</div>
            <p><strong>Scripture Reading:</strong> ${s.short_sermon?.scripture_reading || ""}</p>
            <p><strong>Introduction:</strong> ${s.short_sermon?.introduction || ""}</p>
            
            <p><strong>Main Points:</strong></p>
            ${s.short_sermon?.main_points?.map((p, idx) => `
              <p style="padding-left: 15px; margin-bottom: 8px;"><strong>${idx + 1}. ${p.title || ""}</strong>: ${p.content || ""}</p>
            `).join("") || ""}

            <p><strong>Illustration:</strong> ${s.short_sermon?.illustration || ""}</p>
            <p><strong>Invitation:</strong> ${s.short_sermon?.invitation || ""}</p>
            <p><strong>Conclusion:</strong> ${s.short_sermon?.conclusion || ""}</p>
          </div>
        </div>

        <div class="section">
          <h2>IX. Devotional & Personal Reflection</h2>
          <div class="card" style="margin-bottom: 15px; border-left: 4px solid #db2777;">
            <div class="card-title" style="color: #db2777;">Memory Verse</div>
            <p><strong>${s.memory_verse?.reference || ""}:</strong> "${s.memory_verse?.text || ""}"</p>
          </div>
          <div class="grid-2">
            <div class="card">
              <div class="card-title">Reflection</div>
              <p><strong>Reflection Question:</strong> ${s.devotional_reflection?.reflection_question || ""}</p>
              <p><strong>Daily Action Step:</strong> ${s.devotional_reflection?.action_step || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Prayer</div>
              <p><em>${s.devotional_reflection?.prayer || ""}</em></p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>X. Psychological Contrast</h2>
          <div class="contrast-grid">
            <div class="contrast-card world">
              <div class="card-title" style="color: #dc2626;">The World's Response</div>
              <p>${s.psychological_contrast?.world_response || ""}</p>
            </div>
            <div class="contrast-card kingdom">
              <div class="card-title" style="color: #16a34a;">The Kingdom Response</div>
              <p>${s.psychological_contrast?.kingdom_response || ""}</p>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section">
          <h2>XI. Weekly Action Plan</h2>
          <div class="timeline">
            <div class="timeline-day"><div class="day-name">Monday</div><div>${s.weekly_action_plan?.monday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Tuesday</div><div>${s.weekly_action_plan?.tuesday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Wednesday</div><div>${s.weekly_action_plan?.wednesday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Thursday</div><div>${s.weekly_action_plan?.thursday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Friday</div><div>${s.weekly_action_plan?.friday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Saturday</div><div>${s.weekly_action_plan?.saturday || ""}</div></div>
            <div class="timeline-day"><div class="day-name">Sunday</div><div>${s.weekly_action_plan?.sunday || ""}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>XII. Worship & Discussion</h2>
          <div class="grid-2">
            <div class="card">
              <div class="card-title">Worship Connection</div>
              <p><strong>Theme:</strong> ${s.worship_connection?.theme || ""}</p>
              <p><strong>Response:</strong> ${s.worship_connection?.response || ""}</p>
              <p><strong>Worship Application:</strong> ${s.worship_connection?.worship_application || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Discussion Questions</div>
              <ol>
                ${s.discussion_questions?.map(q => `<li>${q}</li>`).join("") || ""}
              </ol>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>XIII. Matthew Henry Perspective</h2>
          <div class="card">
            <p><strong>Commentary Summary:</strong> ${s.matthew_henry_perspective?.summary || ""}</p>
            <div class="grid-3" style="margin-top: 15px;">
              <div>
                <strong style="color: #dc2626; font-size: 10pt; text-transform: uppercase;">Warnings</strong>
                <ul>
                  ${s.matthew_henry_perspective?.warnings?.map(w => `<li>${w}</li>`).join("") || ""}
                </ul>
              </div>
              <div>
                <strong style="color: #16a34a; font-size: 10pt; text-transform: uppercase;">Encouragements</strong>
                <ul>
                  ${s.matthew_henry_perspective?.encouragements?.map(e => `<li>${e}</li>`).join("") || ""}
                </ul>
              </div>
              <div>
                <strong style="color: #4f46e5; font-size: 10pt; text-transform: uppercase;">Practical Lessons</strong>
                <ul>
                  ${s.matthew_henry_perspective?.practical_lessons?.map(l => `<li>${l}</li>`).join("") || ""}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            if (document.fonts) {
              document.fonts.ready.then(function() {
                setTimeout(function() { window.print(); }, 250);
              });
            } else {
              setTimeout(function() { window.print(); }, 500);
            }
          };
        </script>
      </body>
    </html>
  `;
}

function safeParseFramework(rawContent: string): StudyFramework | null {
  try {
    const cleaned = rawContent.trim();
    const jsonString = cleaned.startsWith("```")
      ? cleaned.replace(/^```json\s*/, "").replace(/```$/, "").trim()
      : cleaned;
    const obj = JSON.parse(jsonString);
    if (!obj || typeof obj !== "object") return null;

    const defaults = {
      framework_name: obj.framework_name || "AFCoD Weekly Scripture Framework",
      version: obj.version || "1.0",
      study: {
        anchor_scripture: obj.study?.anchor_scripture ? {
          reference: obj.study.anchor_scripture.reference || "",
          translation: obj.study.anchor_scripture.translation || "KJV",
          text: obj.study.anchor_scripture.text || "",
          historical_context: {
            author: obj.study.anchor_scripture.historical_context?.author || "",
            audience: obj.study.anchor_scripture.historical_context?.audience || "",
            setting: obj.study.anchor_scripture.historical_context?.setting || "",
            context: obj.study.anchor_scripture.historical_context?.context || ""
          }
        } : null,
        central_theme: obj.study?.central_theme ? {
          title: obj.study.central_theme.title || "",
          summary: obj.study.central_theme.summary || "",
          kingdom_principle: obj.study.central_theme.kingdom_principle || ""
        } : null,
        anchor_amplification: obj.study?.anchor_amplification ? {
          then: obj.study.anchor_amplification.then || "",
          through_jesus: obj.study.anchor_amplification.through_jesus || "",
          now: obj.study.anchor_amplification.now || ""
        } : null,
        vocabulary_study: Array.isArray(obj.study?.vocabulary_study) ? obj.study.vocabulary_study : [],
        teaching_outline: obj.study?.teaching_outline ? {
          observation: Array.isArray(obj.study.teaching_outline.observation) ? obj.study.teaching_outline.observation : [],
          interpretation: Array.isArray(obj.study.teaching_outline.interpretation) ? obj.study.teaching_outline.interpretation : [],
          application: Array.isArray(obj.study.teaching_outline.application) ? obj.study.teaching_outline.application : []
        } : null,
        hidden_insights: obj.study?.hidden_insights ? {
          symbolism: Array.isArray(obj.study.hidden_insights.symbolism) ? obj.study.hidden_insights.symbolism : [],
          patterns: Array.isArray(obj.study.hidden_insights.patterns) ? obj.study.hidden_insights.patterns : [],
          repeated_words: Array.isArray(obj.study.hidden_insights.repeated_words) ? obj.study.hidden_insights.repeated_words : [],
          prophetic_shadows: Array.isArray(obj.study.hidden_insights.prophetic_shadows) ? obj.study.hidden_insights.prophetic_shadows : [],
          deeper_revelations: Array.isArray(obj.study.hidden_insights.deeper_revelations) ? obj.study.hidden_insights.deeper_revelations : []
        } : null,
        matthew_henry_perspective: obj.study?.matthew_henry_perspective ? {
          summary: obj.study.matthew_henry_perspective.summary || "",
          warnings: Array.isArray(obj.study.matthew_henry_perspective.warnings) ? obj.study.matthew_henry_perspective.warnings : [],
          encouragements: Array.isArray(obj.study.matthew_henry_perspective.encouragements) ? obj.study.matthew_henry_perspective.encouragements : [],
          practical_lessons: Array.isArray(obj.study.matthew_henry_perspective.practical_lessons) ? obj.study.matthew_henry_perspective.practical_lessons : []
        } : null,
        prophetic_parallel: obj.study?.prophetic_parallel ? {
          church_age_application: obj.study.prophetic_parallel.church_age_application || "",
          end_time_implications: obj.study.prophetic_parallel.end_time_implications || "",
          personal_prophetic_significance: obj.study.prophetic_parallel.personal_prophetic_significance || "",
          kingdom_fulfillment: obj.study.prophetic_parallel.kingdom_fulfillment || ""
        } : null,
        psychological_contrast: obj.study?.psychological_contrast ? {
          world_response: obj.study.psychological_contrast.world_response || "",
          kingdom_response: obj.study.psychological_contrast.kingdom_response || ""
        } : null,
        devotional_reflection: obj.study?.devotional_reflection ? {
          reflection_question: obj.study.devotional_reflection.reflection_question || "",
          prayer: obj.study.devotional_reflection.prayer || "",
          action_step: obj.study.devotional_reflection.action_step || ""
        } : null,
        teaching_script: obj.study?.teaching_script ? {
          introduction: obj.study.teaching_script.introduction || "",
          main_points: Array.isArray(obj.study.teaching_script.main_points) ? obj.study.teaching_script.main_points : [],
          illustration: obj.study.teaching_script.illustration || "",
          challenge: obj.study.teaching_script.challenge || "",
          closing_prayer: obj.study.teaching_script.closing_prayer || ""
        } : null,
        short_sermon: obj.study?.short_sermon ? {
          title: obj.study.short_sermon.title || "",
          introduction: obj.study.short_sermon.introduction || "",
          scripture_reading: obj.study.short_sermon.scripture_reading || "",
          main_points: Array.isArray(obj.study.short_sermon.main_points) ? obj.study.short_sermon.main_points : [],
          illustration: obj.study.short_sermon.illustration || "",
          invitation: obj.study.short_sermon.invitation || "",
          conclusion: obj.study.short_sermon.conclusion || ""
        } : null,
        jesus_connection: obj.study?.jesus_connection ? {
          messianic_relevance: obj.study.jesus_connection.messianic_relevance || "",
          fulfillment: obj.study.jesus_connection.fulfillment || "",
          gospel_application: obj.study.jesus_connection.gospel_application || ""
        } : null,
        biblical_character_study: Array.isArray(obj.study?.biblical_character_study) ? obj.study.biblical_character_study : [],
        cross_references: Array.isArray(obj.study?.cross_references) ? obj.study.cross_references : [],
        leadership_principles: Array.isArray(obj.study?.leadership_principles) ? obj.study.leadership_principles : [],
        worship_connection: obj.study?.worship_connection ? {
          theme: obj.study.worship_connection.theme || "",
          response: obj.study.worship_connection.response || "",
          worship_application: obj.study.worship_connection.worship_application || ""
        } : null,
        faith_declarations: Array.isArray(obj.study?.faith_declarations) ? obj.study.faith_declarations : [],
        memory_verse: obj.study?.memory_verse ? {
          reference: obj.study.memory_verse.reference || "",
          text: obj.study.memory_verse.text || ""
        } : null,
        discussion_questions: Array.isArray(obj.study?.discussion_questions) ? obj.study.discussion_questions : [],
        ministry_application: obj.study?.ministry_application ? {
          individual: obj.study.ministry_application.individual || "",
          family: obj.study.ministry_application.family || "",
          church: obj.study.ministry_application.church || "",
          community: obj.study.ministry_application.community || ""
        } : null,
        story_illustration: obj.study?.story_illustration ? {
          title: obj.study.story_illustration.title || "",
          story: obj.study.story_illustration.story || "",
          lesson: obj.study.story_illustration.lesson || ""
        } : null,
        weekly_action_plan: obj.study?.weekly_action_plan ? {
          monday: obj.study.weekly_action_plan.monday || "",
          tuesday: obj.study.weekly_action_plan.tuesday || "",
          wednesday: obj.study.weekly_action_plan.wednesday || "",
          thursday: obj.study.weekly_action_plan.thursday || "",
          friday: obj.study.weekly_action_plan.friday || "",
          saturday: obj.study.weekly_action_plan.saturday || "",
          sunday: obj.study.weekly_action_plan.sunday || ""
        } : null,
        study_metadata: {
          week_of: obj.study?.study_metadata?.week_of || "",
          theme_year: obj.study?.study_metadata?.theme_year || "A Destiny by Divine Design",
          speaker: obj.study?.study_metadata?.speaker || "",
          church: obj.study?.study_metadata?.church || "",
          generated_date: obj.study?.study_metadata?.generated_date || new Date().toLocaleDateString(),
          tags: Array.isArray(obj.study?.study_metadata?.tags) ? obj.study.study_metadata.tags : []
        }
      }
    };
    return defaults as StudyFramework;
  } catch (err) {
    console.error("Failed to parse and default framework:", err);
    return null;
  }
}

export default function AssistantPage() {
  const [sheets, setSheets] = useState<ScriptureSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [scripture, setScripture] = useState("");
  const [supportingText, setSupportingText] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("outline");
  const [result, setResult] = useState("");
  const [parsedFramework, setParsedFramework] = useState<StudyFramework | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCommentaries, setSelectedCommentaries] = useState<string[]>([]);
  const [llm, setLlm] = useState<LLM>("gemini-flash");
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([
    "context",
    "theme",
    "lexicon",
    "outline",
    "script",
    "sermon",
    "commentary",
    "devotional",
    "worship",
    "action",
  ]);
  const [showArtifactsSelect, setShowArtifactsSelect] = useState(false);
  const [fallbackInfo, setFallbackInfo] = useState<{
    fallbackUsed: boolean;
    primaryModel: LLM;
    actualModel: string;
  } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Fetch scripture sheets on mount
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const { data, error } = await supabase
          .from("scripture_sheets")
          .select("*")
          .order("week_date", { ascending: true });
        if (data && !error && data.length > 0) {
          setSheets(data);
        } else {
          console.warn("Supabase returned empty or error, using fallback sheets.");
          setSheets(FALLBACK_SHEETS);
        }
      } catch (e) {
        console.error("Failed to fetch from Supabase, using fallback sheets:", e);
        setSheets(FALLBACK_SHEETS);
      }
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
    setParsedFramework(null);
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
          selectedArtifacts,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.content);
        const parsed = safeParseFramework(data.content);
        if (parsed) {
          setParsedFramework(parsed);
        } else {
          setParsedFramework(null);
        }

        if (data.fallbackUsed) {
          setFallbackInfo({
            fallbackUsed: true,
            primaryModel: data.primaryModel,
            actualModel: data.model,
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
    let copyText = result;
    if (parsedFramework) {
      try {
        copyText = convertFrameworkToMarkdown(parsedFramework);
      } catch (err) {
        console.error("Markdown conversion failed for clipboard copy:", err);
      }
    }
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    let htmlContent = "";
    if (parsedFramework) {
      try {
        htmlContent = convertFrameworkToPrintHtml(parsedFramework);
      } catch (err) {
        console.error("Print template compilation failed:", err);
        const innerHtml = document.getElementById("sermon-content")?.innerHTML || "";
        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sermon Prep</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                pre { background: #f4f4f4; padding: 10px; }
              </style>
            </head>
            <body>
              ${innerHtml}
              <script>
                window.onload = function() { window.print(); };
              </script>
            </body>
          </html>
        `;
      }
    } else {
      const innerHtml = document.getElementById("sermon-content")?.innerHTML || "";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sermon Prep</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              pre { background: #f4f4f4; padding: 10px; }
            </style>
          </head>
          <body>
            ${innerHtml}
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `;
    }

    if (!htmlContent) return;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    
    // Safety cleanup after 10 seconds to ensure print is triggered and iframe is removed
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  };

  // Structured tab render helper functions
  const renderOutlineTab = (f: StudyFramework) => {
    const s = f.study;
    return (
      <div className="space-y-8 text-left">
        {/* Central Theme Card */}
        {s.central_theme && (
          <div className="rounded-2xl glass-card-glow-violet p-6 shadow-xl relative overflow-hidden hover-premium">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent-violet bg-accent-violet/10 px-2.5 py-1 rounded-full mb-3">
              Central Theme
            </span>
            <h3 className="text-xl font-bold text-ink-bright mb-2 font-sans tracking-tight">
              {s.central_theme.title}
            </h3>
            <p className="text-ink-medium mb-4 leading-relaxed text-sm">
              {s.central_theme.summary}
            </p>
            {s.central_theme.kingdom_principle && (
              <div className="rounded-xl border border-accent-gold/20 bg-accent-gold/5 p-4 flex gap-3.5 items-start">
                <Sparkles className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-accent-gold uppercase tracking-wider mb-1">Kingdom Principle</h4>
                  <p className="text-sm text-ink-bright/90 leading-relaxed font-serif">{s.central_theme.kingdom_principle}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teaching Outline Grid */}
        {s.teaching_outline && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent-violet" />
              Teaching Outline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Observation */}
              <div className="rounded-2xl glass-card p-5 hover:border-accent-violet/30 hover-premium transition-all duration-300">
                <h4 className="text-sm font-bold text-accent-violet uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                  Observation
                </h4>
                <ul className="space-y-3">
                  {s.teaching_outline.observation?.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-ink-medium leading-relaxed font-serif">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-violet flex-shrink-0 mt-2" />
                      {item}
                    </li>
                  )) || <span className="text-ink-dim italic">None</span>}
                </ul>
              </div>

              {/* Interpretation */}
              <div className="rounded-2xl glass-card p-5 hover:border-accent-gold/30 hover-premium transition-all duration-300">
                <h4 className="text-sm font-bold text-accent-gold uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                  Interpretation
                </h4>
                <ul className="space-y-3">
                  {s.teaching_outline.interpretation?.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-ink-medium leading-relaxed font-serif">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-gold flex-shrink-0 mt-2" />
                      {item}
                    </li>
                  )) || <span className="text-ink-dim italic">None</span>}
                </ul>
              </div>

              {/* Application */}
              <div className="rounded-2xl glass-card p-5 hover:border-accent-emerald/30 hover-premium transition-all duration-300">
                <h4 className="text-sm font-bold text-accent-emerald uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                  Application
                </h4>
                <ul className="space-y-3">
                  {s.teaching_outline.application?.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-ink-medium leading-relaxed font-serif">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald flex-shrink-0 mt-2" />
                      {item}
                    </li>
                  )) || <span className="text-ink-dim italic">None</span>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Teaching Script Section */}
        {s.teaching_script && (
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <ScrollText className="w-4 h-4 text-accent-violet" />
              Teaching Script
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Introduction</h4>
                <p className="text-ink-medium text-sm leading-relaxed font-serif">
                  {s.teaching_script.introduction}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Main Points</h4>
                <div className="space-y-4">
                  {s.teaching_script.main_points?.map((pt, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-accent-violet/30">
                      <h5 className="text-sm font-bold text-accent-violet mb-1">
                        {idx + 1}. {pt.title}
                      </h5>
                      <p className="text-ink-medium text-sm leading-relaxed font-serif">
                        {pt.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {s.teaching_script.illustration && (
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Illustration</h4>
                  <p className="text-ink-medium text-sm leading-relaxed font-serif">
                    {s.teaching_script.illustration}
                  </p>
                </div>
              )}

              {s.teaching_script.challenge && (
                <div className="rounded-xl bg-accent-violet/5 border border-accent-violet/10 p-4">
                  <h4 className="text-xs font-bold text-accent-violet uppercase tracking-wider mb-1.5">Weekly Challenge</h4>
                  <p className="text-ink-bright text-sm leading-relaxed">{s.teaching_script.challenge}</p>
                </div>
              )}

              {s.teaching_script.closing_prayer && (
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 italic text-ink-muted text-sm flex gap-3 items-start">
                  <Quote className="w-5 h-5 text-white/10 flex-shrink-0" />
                  <p className="font-serif">{s.teaching_script.closing_prayer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Short Sermon Section */}
        {s.short_sermon && (
          <div className="rounded-2xl glass-card-glow-violet p-6 relative overflow-hidden hover-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <FileText className="w-4 h-4 text-accent-violet" />
              Short Sermon Outline
            </h3>
            <div className="space-y-5">
              <h4 className="text-lg font-bold text-ink-bright font-sans tracking-tight">{s.short_sermon.title}</h4>
              {s.short_sermon.scripture_reading && (
                <p className="text-xs text-accent-gold font-bold uppercase tracking-wider">
                  Scripture Reading: {s.short_sermon.scripture_reading}
                </p>
              )}
              <p className="text-ink-medium text-sm leading-relaxed font-serif">
                {s.short_sermon.introduction}
              </p>

              <div className="space-y-3.5 my-4">
                {s.short_sermon.main_points?.map((pt, idx) => (
                  <div key={idx} className="glass-card rounded-xl p-3.5 hover:border-accent-violet/20 transition-all duration-200">
                    <h5 className="text-sm font-bold text-accent-violet mb-1">{pt.title}</h5>
                    <p className="text-ink-medium text-sm leading-relaxed font-serif">{pt.content}</p>
                  </div>
                ))}
              </div>

              {s.short_sermon.illustration && (
                <div>
                  <h5 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Illustration</h5>
                  <p className="text-ink-medium text-sm leading-relaxed font-serif">{s.short_sermon.illustration}</p>
                </div>
              )}

              {s.short_sermon.invitation && (
                <div className="rounded-xl border border-accent-gold/20 bg-accent-gold/5 p-4">
                  <h5 className="text-xs font-bold text-accent-gold uppercase tracking-wider mb-1">Altar Call / Invitation</h5>
                  <p className="text-ink-bright text-sm leading-relaxed">{s.short_sermon.invitation}</p>
                </div>
              )}

              <div>
                <h5 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Conclusion</h5>
                <p className="text-ink-medium text-sm leading-relaxed font-serif">{s.short_sermon.conclusion}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExegesisTab = (f: StudyFramework) => {
    const s = f.study;
    return (
      <div className="space-y-8 text-left">
        {/* Anchor Scripture Display */}
        {s.anchor_scripture && (
          <div className="rounded-2xl glass-card-glow-gold p-6 shadow-xl relative overflow-hidden hover-premium">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start mb-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-full">
                Anchor Scripture
              </span>
              <span className="text-xs font-bold text-ink-muted">
                {s.anchor_scripture.reference} ({s.anchor_scripture.translation || "KJV"})
              </span>
            </div>
            <p className="text-ink-bright text-lg font-serif italic pl-4 border-l-2 border-accent-gold mb-6 leading-relaxed">
              "{s.anchor_scripture.text}"
            </p>

            {/* Historical Context Details */}
            {s.anchor_scripture.historical_context && (
              <div>
                <h4 className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent-gold" />
                  Historical & Literary Context
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl glass-card p-4">
                    <p className="text-[10px] text-ink-muted uppercase mb-1.5 tracking-wider">Author & Audience</p>
                    <p className="text-sm text-ink-medium leading-relaxed mb-3">
                      <strong className="text-ink-bright">Author:</strong> {s.anchor_scripture.historical_context.author}
                    </p>
                    <p className="text-sm text-ink-medium leading-relaxed">
                      <strong className="text-ink-bright">Audience:</strong> {s.anchor_scripture.historical_context.audience}
                    </p>
                  </div>
                  <div className="rounded-xl glass-card p-4">
                    <p className="text-[10px] text-ink-muted uppercase mb-1.5 tracking-wider">Setting & Surrounding Context</p>
                    <p className="text-sm text-ink-medium leading-relaxed mb-3">
                      <strong className="text-ink-bright">Setting:</strong> {s.anchor_scripture.historical_context.setting}
                    </p>
                    <p className="text-sm text-ink-medium leading-relaxed">
                      <strong className="text-ink-bright">Context:</strong> {s.anchor_scripture.historical_context.context}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anchor Amplification Grid */}
        {s.anchor_amplification && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent-gold" />
              Anchor Amplification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl glass-card p-5">
                <h4 className="text-xs font-bold text-accent-gold uppercase tracking-wider mb-2">Then (Original Era)</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.anchor_amplification.then}</p>
              </div>
              <div className="rounded-xl glass-card-glow-violet p-5 hover-premium">
                <h4 className="text-xs font-bold text-accent-violet uppercase tracking-wider mb-2">Through Jesus</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.anchor_amplification.through_jesus}</p>
              </div>
              <div className="rounded-xl glass-card p-5">
                <h4 className="text-xs font-bold text-accent-emerald uppercase tracking-wider mb-2">Now (Today)</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.anchor_amplification.now}</p>
              </div>
            </div>
          </div>
        )}

        {/* Original Languages Vocabulary Study */}
        {s.vocabulary_study && s.vocabulary_study.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-gold" />
              Original Language Word Studies (Lexicon)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {s.vocabulary_study.map((v, i) => (
                <div key={i} className="rounded-2xl glass-card p-5 hover-premium relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-2xl font-serif font-bold text-accent-gold block">{v.word}</span>
                        <span className="text-[10px] text-ink-dim italic">Pronunciation: {v.pronunciation}</span>
                      </div>
                      <span className="text-[10px] font-bold text-accent-violet bg-accent-violet/10 border border-accent-violet/20 px-2 py-0.5 rounded-md">
                        {v.strongs_number} <span className="opacity-70">({v.language})</span>
                      </span>
                    </div>
                    <p className="text-sm text-ink-medium leading-relaxed mb-4 font-serif">
                      <strong className="text-ink-bright">Strongs Definition:</strong> {v.definition}
                    </p>
                  </div>
                  {v.spiritual_significance && (
                    <div className="rounded-xl border border-accent-gold/25 bg-accent-gold/5 p-3.5 mt-2">
                      <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider block mb-1">Spiritual Significance</span>
                      <p className="text-xs text-ink-medium leading-relaxed font-serif italic">
                        "{v.spiritual_significance}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biblical Character Study */}
        {s.biblical_character_study && s.biblical_character_study.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent-gold" />
              Biblical Character Study
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {s.biblical_character_study.map((c, i) => (
                <div key={i} className="rounded-xl glass-card p-4 space-y-2 hover-premium">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-ink-bright">{c.name}</h4>
                    <span className="text-[10px] font-bold text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full">{c.role}</span>
                  </div>
                  <p className="text-sm text-ink-medium"><strong>Significance:</strong> {c.significance}</p>
                  <p className="text-sm text-ink-medium border-l-2 border-accent-gold/20 pl-2 italic font-serif"><strong>Lesson:</strong> {c.lesson}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jesus Connection */}
        {s.jesus_connection && (
          <div className="rounded-2xl glass-card-glow-gold p-6 space-y-4 hover-premium">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-accent-gold" />
              The Jesus Connection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Messianic Relevance</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.jesus_connection.messianic_relevance}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Fulfillment</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.jesus_connection.fulfillment}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Gospel Application</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.jesus_connection.gospel_application}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cross References */}
        {s.cross_references && s.cross_references.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-accent-gold" />
              Cross References
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {s.cross_references.map((r, i) => (
                <div key={i} className="rounded-xl glass-card p-3.5 flex items-start gap-3 hover-premium">
                  <div className="w-6 h-6 rounded bg-accent-gold/10 text-accent-gold flex items-center justify-center text-xs font-bold flex-shrink-0">
                    ref
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-accent-gold font-serif">{r.reference}</h4>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{r.relationship}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDevotionalTab = (f: StudyFramework) => {
    const s = f.study;
    return (
      <div className="space-y-8 text-left">
        {/* Devotional Reflection Block */}
        {s.devotional_reflection && (
          <div className="rounded-2xl glass-card-glow-rose p-6 shadow-xl relative overflow-hidden hover-premium">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-rose/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex gap-4 items-start mb-6 border-b border-white/5 pb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-rose/10 flex items-center justify-center text-accent-rose flex-shrink-0">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-rose block mb-1">
                  Heart Reflection Question
                </span>
                <p className="text-ink-bright text-base font-semibold leading-relaxed font-serif">
                  "{s.devotional_reflection.reflection_question}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {s.devotional_reflection.action_step && (
                <div className="rounded-xl glass-card p-4">
                  <h4 className="text-xs font-bold text-accent-rose uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Today's Action Step
                  </h4>
                  <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.devotional_reflection.action_step}</p>
                </div>
              )}

              {s.devotional_reflection.prayer && (
                <div className="rounded-xl bg-accent-rose/5 border border-accent-rose/10 p-4">
                  <h4 className="text-xs font-bold text-accent-rose uppercase tracking-wider mb-1.5">Personal Prayer</h4>
                  <p className="text-sm text-ink-medium italic leading-relaxed font-serif">
                    "{s.devotional_reflection.prayer}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Memory Verse Callout */}
        {s.memory_verse && (
          <div className="rounded-2xl glass-card-glow-violet p-6 text-center relative overflow-hidden hover-premium">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-[10px] font-bold text-accent-violet uppercase tracking-wider mb-2">Memory Verse</h4>
            <p className="text-xl font-serif italic text-ink-bright max-w-xl mx-auto leading-relaxed mb-3">
              "{s.memory_verse.text}"
            </p>
            <span className="text-sm font-semibold text-accent-gold">
              — {s.memory_verse.reference}
            </span>
          </div>
        )}

        {/* Worship Connection */}
        {s.worship_connection && (
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-accent-rose" />
              Worship Connection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Worship Theme</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.worship_connection.theme}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Worship Application</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.worship_connection.worship_application}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Devotional Response</h4>
                <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.worship_connection.response}</p>
              </div>
            </div>
          </div>
        )}

        {/* Faith Declarations */}
        {s.faith_declarations && s.faith_declarations.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent-rose" />
              Faith Declarations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {s.faith_declarations.map((dec, i) => (
                <div key={i} className="rounded-xl glass-card p-4 flex gap-3 items-center hover-premium">
                  <div className="w-2 h-2 rounded-full bg-accent-rose flex-shrink-0 animate-pulse" />
                  <p className="text-sm text-ink-medium font-medium leading-relaxed font-serif">{dec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Questions */}
        {s.discussion_questions && s.discussion_questions.length > 0 && (
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Users className="w-4 h-4 text-accent-rose" />
              Discussion Questions
            </h3>
            <ol className="space-y-3.5">
              {s.discussion_questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-medium leading-relaxed font-serif">
                  <span className="font-bold text-accent-rose flex-shrink-0">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  const renderSermonAnglesTab = (f: StudyFramework) => {
    const s = f.study;
    return (
      <div className="space-y-8 text-left">
        {/* Hidden Insights Grid */}
        {s.hidden_insights && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent-emerald" />
              Hidden Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {/* Symbolism */}
              <div className="rounded-xl glass-card p-4 space-y-1 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">Symbolism</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.hidden_insights.symbolism?.join("; ")}</p>
              </div>
              {/* Patterns */}
              <div className="rounded-xl glass-card p-4 space-y-1 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">Patterns</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.hidden_insights.patterns?.join("; ")}</p>
              </div>
              {/* Repeated Words */}
              <div className="rounded-xl glass-card p-4 space-y-1 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">Key Words</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.hidden_insights.repeated_words?.join("; ")}</p>
              </div>
              {/* Prophetic Shadows */}
              <div className="rounded-xl glass-card p-4 space-y-1 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">Shadows</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.hidden_insights.prophetic_shadows?.join("; ")}</p>
              </div>
              {/* Deeper Revelations */}
              <div className="rounded-xl glass-card-glow-emerald p-4 space-y-1 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">Revelations</span>
                <p className="text-xs text-ink-bright leading-relaxed font-bold font-serif">{s.hidden_insights.deeper_revelations?.join("; ")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Psychological Contrast Split */}
        {s.psychological_contrast && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-emerald" />
              Psychological Contrast
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* World Response */}
              <div className="rounded-2xl glass-card-glow-rose p-5 relative overflow-hidden shadow-inner hover-premium">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-rose/5 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-sm font-bold text-accent-rose uppercase tracking-wider border-b border-accent-rose/10 pb-2 mb-3">
                  The World's Response
                </h4>
                <p className="text-ink-medium text-sm leading-relaxed font-serif">
                  {s.psychological_contrast.world_response}
                </p>
              </div>
              {/* Kingdom Response */}
              <div className="rounded-2xl glass-card-glow-emerald p-5 relative overflow-hidden shadow-inner hover-premium">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-emerald/5 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-sm font-bold text-accent-emerald uppercase tracking-wider border-b border-accent-emerald/10 pb-2 mb-3">
                  The Kingdom Response
                </h4>
                <p className="text-ink-bright text-sm leading-relaxed font-serif">
                  {s.psychological_contrast.kingdom_response}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prophetic Parallel */}
        {s.prophetic_parallel && (
          <div className="rounded-2xl glass-card p-6 space-y-4 hover-premium">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2 border-b border-white/5 pb-3">
              <Compass className="w-4 h-4 text-accent-emerald" />
              Prophetic Parallel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Church Age Application</h4>
                  <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.prophetic_parallel.church_age_application}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">End Time Implications</h4>
                  <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.prophetic_parallel.end_time_implications}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Personal Prophetic Significance</h4>
                  <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.prophetic_parallel.personal_prophetic_significance}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Kingdom Fulfillment</h4>
                  <p className="text-sm text-ink-medium leading-relaxed font-serif">{s.prophetic_parallel.kingdom_fulfillment}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ministry Application Grid */}
        {s.ministry_application && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-emerald" />
              Ministry Application
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl glass-card p-4 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider block mb-1">Individual</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.ministry_application.individual}</p>
              </div>
              <div className="rounded-xl glass-card p-4 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider block mb-1">Family</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.ministry_application.family}</p>
              </div>
              <div className="rounded-xl glass-card p-4 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider block mb-1">Church</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.ministry_application.church}</p>
              </div>
              <div className="rounded-xl glass-card p-4 hover-premium">
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider block mb-1">Community</span>
                <p className="text-xs text-ink-medium leading-relaxed font-serif">{s.ministry_application.community}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Principles */}
        {s.leadership_principles && s.leadership_principles.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-accent-emerald" />
              Leadership Principles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {s.leadership_principles.map((lp, i) => (
                <div key={i} className="rounded-xl glass-card p-4 space-y-1 hover-premium">
                  <h4 className="text-sm font-bold text-accent-emerald font-sans tracking-tight">{lp.principle}</h4>
                  <p className="text-xs text-ink-medium leading-relaxed font-serif">{lp.application}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Illustration */}
        {s.story_illustration && (
          <div className="rounded-2xl glass-card-glow-emerald p-6 relative overflow-hidden hover-premium">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent-emerald bg-accent-emerald/10 px-2.5 py-1 rounded-full mb-3">
              Illustration Story
            </span>
            <h4 className="text-lg font-bold text-ink-bright mb-2 font-sans tracking-tight">{s.story_illustration.title}</h4>
            <p className="text-ink-medium text-sm leading-relaxed mb-4 font-serif">
              {s.story_illustration.story}
            </p>
            <p className="text-sm text-accent-emerald font-semibold border-t border-white/5 pt-3 font-serif">
              <strong>Moral/Lesson:</strong> {s.story_illustration.lesson}
            </p>
          </div>
        )}

        {/* Weekly Action Plan */}
        {s.weekly_action_plan && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-emerald" />
              Weekly Action Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {s.weekly_action_plan && typeof s.weekly_action_plan === "object" && !Array.isArray(s.weekly_action_plan) && Object.keys(s.weekly_action_plan).map((day) => {
                const action = (s.weekly_action_plan as any)[day];
                return (
                  <div key={day} className="rounded-xl glass-card p-3.5 text-center hover-premium">
                    <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider block mb-1">
                      {day}
                    </span>
                    <p className="text-xs text-ink-medium leading-relaxed text-left md:text-center font-serif">
                      {action}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Matthew Henry Perspective Summary */}
        {s.matthew_henry_perspective && (
          <div className="rounded-2xl glass-card p-6 space-y-4 hover-premium">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2 border-b border-white/5 pb-3">
              <ScrollText className="w-4 h-4 text-accent-gold" />
              Matthew Henry Perspective
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-ink-medium leading-relaxed font-serif">
                {s.matthew_henry_perspective.summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-accent-rose uppercase tracking-wider mb-2">Warnings</h4>
                  <ul className="space-y-1 text-xs text-ink-muted font-serif">
                    {s.matthew_henry_perspective.warnings?.map((w, idx) => (
                      <li key={idx} className="flex gap-1.5 leading-relaxed">
                        <span className="text-accent-rose flex-shrink-0 mt-1">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-accent-emerald uppercase tracking-wider mb-2">Encouragements</h4>
                  <ul className="space-y-1 text-xs text-ink-muted font-serif">
                    {s.matthew_henry_perspective.encouragements?.map((e, idx) => (
                      <li key={idx} className="flex gap-1.5 leading-relaxed">
                        <span className="text-accent-emerald flex-shrink-0 mt-1">•</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-accent-violet uppercase tracking-wider mb-2">Practical Lessons</h4>
                  <ul className="space-y-1 text-xs text-ink-muted font-serif">
                    {s.matthew_henry_perspective.practical_lessons?.map((l, idx) => (
                      <li key={idx} className="flex gap-1.5 leading-relaxed">
                        <span className="text-accent-violet flex-shrink-0 mt-1">•</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActiveTabContent = () => {
    if (!parsedFramework) return null;
    switch (mode) {
      case "outline":
        return renderOutlineTab(parsedFramework);
      case "exegesis":
        return renderExegesisTab(parsedFramework);
      case "devotional":
        return renderDevotionalTab(parsedFramework);
      case "points":
        return renderSermonAnglesTab(parsedFramework);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden text-ink-medium">
      {/* Ethereal background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-violet/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-base/70 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-ink-muted hover:text-ink-bright transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-violet-glow flex items-center justify-center shadow-lg shadow-accent-violet/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink-bright tracking-tight font-sans">
                Sermon AI Assistant
              </h1>
              <p className="text-xs text-ink-muted">Powered by {LLM_OPTIONS.find(l => l.id === llm)?.label}</p>
            </div>
          </div>

          {/* LLM Switcher */}
          <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 border border-white/5">
            {LLM_OPTIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLlm(l.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold hover-premium flex items-center gap-1.5 ${
                  llm === l.id
                    ? `bg-accent-violet text-white shadow-md shadow-accent-violet/10`
                    : "text-ink-muted hover:text-ink-medium"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded-2xl text-left hover-premium border transition-all duration-300 ${
                mode === m.id
                  ? "glass-card-glow-violet shadow-lg shadow-accent-violet/10 scale-[1.02]"
                  : "glass-card hover:border-white/10"
              }`}
            >
              <m.icon
                className={`w-5 h-5 mb-2 ${
                  mode === m.id ? "text-accent-violet" : "text-ink-muted"
                }`}
              />
              <p
                className={`text-sm font-bold font-sans tracking-tight ${
                  mode === m.id ? "text-ink-bright" : "text-ink-medium"
                }`}
              >
                {m.label}
              </p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {m.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="rounded-2xl glass-card-elevated p-6 mb-6">
          <div className="space-y-4">

            {/* Date Picker Dropdown */}
            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1.5 uppercase tracking-wider">
                Select Sunday Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                <select
                  value={selectedSheetId}
                  onChange={(e) => handleSheetSelect(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bg-surface/50 border border-white/10 rounded-xl text-ink-bright text-sm focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0f0f1a] text-ink-muted">
                    — Pick a date to auto-fill scriptures —
                  </option>
                  {sheets.map((s) => {
                    const d = parseISO(s.week_date);
                    return (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-[#0f0f1a] text-ink-bright"
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
              <div className="rounded-xl glass-card-glow-violet p-4">
                <p className="text-xs text-accent-violet uppercase tracking-wider mb-2 font-bold">
                  Selected Readings
                </p>
                <p className="text-sm font-semibold text-accent-gold mb-1 font-serif">
                  {scripture}
                </p>
                {supportingText && (
                  <p className="text-xs text-ink-muted">{supportingText}</p>
                )}
              </div>
            )}

            {/* Manual Scripture Override */}
            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1.5 uppercase tracking-wider">
                Scripture Reference {selectedSheetId ? "(auto-filled)" : "*"}
              </label>
              <input
                type="text"
                value={scripture}
                onChange={(e) => {
                  setScripture(e.target.value);
                  setSelectedSheetId("");
                }}
                placeholder="e.g. Romans 8:28-39"
                className="w-full px-4 py-3 bg-bg-surface/50 border border-white/10 rounded-xl text-ink-bright text-sm placeholder:text-ink-muted/50 focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Sermon Title */}
            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1.5 uppercase tracking-wider">
                Sermon Title / Theme (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSelectedSheetId("");
                }}
                placeholder="e.g. More Than Conquerors"
                className="w-full px-4 py-3 bg-bg-surface/50 border border-white/10 rounded-xl text-ink-bright text-sm placeholder:text-ink-muted/50 focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Commentary Sources */}
            <div>
              <label className="block text-xs font-bold text-ink-muted mb-2.5 uppercase tracking-wider">
                Include Commentary Perspectives
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMENTARIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCommentary(c.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all duration-200 hover-premium ${
                      selectedCommentaries.includes(c.id)
                        ? "glass-card-glow-violet text-accent-violet"
                        : "glass-card text-ink-muted hover:border-white/15"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                        selectedCommentaries.includes(c.id)
                          ? "bg-accent-violet border-accent-violet"
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

            {/* Custom Artifacts Selection */}
            <div className="border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setShowArtifactsSelect(!showArtifactsSelect)}
                className="flex items-center justify-between w-full text-left text-xs font-bold text-ink-muted uppercase tracking-wider hover:text-ink-bright transition-colors focus:outline-none"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-violet animate-pulse" />
                  Customize Study Pack Elements ({selectedArtifacts.length} Selected)
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showArtifactsSelect ? "rotate-180" : ""}`} />
              </button>
              
              {showArtifactsSelect && (
                <div className="mt-4 space-y-4 animate-fadeIn">
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedArtifacts(ARTIFACT_OPTIONS.map(a => a.id))}
                      className="text-xs font-bold text-accent-violet hover:text-accent-violet/85 transition-colors focus:outline-none"
                    >
                      Select All
                    </button>
                    <span className="text-white/10 text-xs">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedArtifacts([])}
                      className="text-xs font-bold text-ink-muted hover:text-ink-bright transition-colors focus:outline-none"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ARTIFACT_OPTIONS.map((art) => {
                      const isSelected = selectedArtifacts.includes(art.id);
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => {
                            setSelectedArtifacts(prev =>
                              prev.includes(art.id)
                                ? prev.filter(a => a !== art.id)
                                : [...prev, art.id]
                            );
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 hover-premium focus:outline-none ${
                            isSelected
                              ? "glass-card-glow-violet text-accent-violet border-accent-violet/40"
                              : "glass-card text-ink-muted border-white/10 hover:border-white/15"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all mt-0.5 ${
                              isSelected
                                ? "bg-accent-violet border-accent-violet"
                                : "border-white/20"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? "text-ink-bright" : "text-ink-medium"}`}>
                              {art.label}
                            </p>
                            <p className="text-[10px] text-ink-muted leading-relaxed mt-0.5">
                              {art.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !scripture.trim()}
              className="w-full py-3.5 bg-gradient-violet-glow text-white font-bold rounded-xl hover:shadow-lg hover:shadow-accent-violet/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover-premium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Study Pack...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Weekly Scripture Framework
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="rounded-2xl glass-card-elevated p-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-violet" />
                <span className="text-sm font-bold text-ink-bright tracking-wider font-sans">
                  {parsedFramework ? "Framework Study Pack" : modes.find((m) => m.id === mode)?.label}
                </span>
                {parsedFramework && (
                  <span className="text-[10px] bg-accent-violet/10 text-accent-violet border border-accent-violet/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Tab: {modes.find((m) => m.id === mode)?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card hover:bg-white/10 text-ink-muted hover:text-ink-bright text-xs transition-all hover-premium"
                >
                  <FileDown className="w-3.5 h-3.5 text-accent-violet" />
                  Export PDF Pack
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card hover:bg-white/10 text-ink-muted hover:text-ink-bright text-xs transition-all hover-premium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-accent-emerald" />
                      Copied Markdown
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Markdown
                    </>
                  )}
                </button>
              </div>
            </div>
            {fallbackInfo?.fallbackUsed && (
              <div className="mb-4 p-3.5 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold rounded-xl text-xs flex items-start gap-2.5 shadow-inner">
                <Sparkles className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-bold">
                    {fallbackInfo.actualModel === "ollama" ? "Local Fallback Active: " : "Cloud Fallback Active: "}
                  </span>
                  Cloud model <strong>{LLM_OPTIONS.find(l => l.id === fallbackInfo.primaryModel)?.label}</strong> request failed. 
                  Automatically fell back to <strong>{LLM_OPTIONS.find(l => l.id === fallbackInfo.actualModel as LLM)?.label || fallbackInfo.actualModel}</strong>.
                </div>
              </div>
            )}
            
            {/* Conditional Content Rendering */}
            <div id="sermon-content">
              {parsedFramework ? (
                <div className="transition-all duration-300">
                  {renderActiveTabContent()}
                </div>
              ) : (
                <div
                  className="text-ink-medium leading-relaxed text-sm prose prose-invert prose-sm max-w-none font-serif"
                >
                  <MarkdownRenderer content={result} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
