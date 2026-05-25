import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let keyCount = 0;

  // Track list items to wrap them in <ul> or <ol>
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyCount++}`} className="list-disc pl-5 mb-4 space-y-1.5 text-white/80">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Regex to split by bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-amber-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Parse italic (*text*)
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((ip, i) => {
        if (ip.startsWith("*") && ip.endsWith("*")) {
          return (
            <em key={i} className="italic text-white/90">
              {ip.slice(1, -1)}
            </em>
          );
        }
        return ip;
      });
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Handle empty line
    if (!line) {
      flushList();
      continue;
    }

    // Handle horizontal rule
    if (line === "---" || line === "***") {
      flushList();
      elements.push(<hr key={keyCount++} className="my-6 border-white/10" />);
      continue;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={keyCount++} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/5 pb-1">
          {parseInlineStyles(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={keyCount++} className="text-xl font-bold text-white mt-5 mb-2.5">
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={keyCount++} className="text-lg font-bold text-amber-400 mt-4 mb-2">
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4 key={keyCount++} className="text-base font-bold text-violet-400 mt-3 mb-1.5">
          {parseInlineStyles(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Handle blockquotes
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={keyCount++} className="border-l-4 border-violet-500 bg-white/5 pl-4 py-2 pr-2 my-4 rounded-r-lg italic text-white/70 text-xs">
          {parseInlineStyles(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Handle list items
    if (line.startsWith("* ") || line.startsWith("- ")) {
      currentList.push(
        <li key={`li-${keyCount++}`} className="leading-relaxed">
          {parseInlineStyles(line.slice(2))}
        </li>
      );
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={keyCount++} className="mb-4 leading-relaxed text-white/80">
        {parseInlineStyles(line)}
      </p>
    );
  }

  flushList();

  return <div className="markdown-body space-y-1">{elements}</div>;
}
