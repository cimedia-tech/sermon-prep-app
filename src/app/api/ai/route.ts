import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ModelId = "gpt-4o" | "gpt-4o-mini" | "gemini-flash";

async function generateOpenAI(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured. Add it in Vercel env vars.");
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

async function generateGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured. Add it in Vercel env vars.");
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text() || "No response generated.";
}

export async function POST(req: NextRequest) {
  try {
    const { scripture, title, mode, commentaries = [], llm = "gpt-4o" } = await req.json();

    const commentaryNames: Record<string, string> = {
      matthew_henry: "Matthew Henry's Commentary",
      spurgeon: "Charles Spurgeon's Sermons & Treasury of David",
      john_calvin: "John Calvin's Commentaries",
      adam_clarke: "Adam Clarke's Commentary",
      john_macarthur: "John MacArthur's Study Bible Commentary",
    };

    const selectedCommentaryText = commentaries.length > 0
      ? `\n\n**IMPORTANT: Include dedicated commentary sections from the following sources:**\n${commentaries.map((c: string) => `- ${commentaryNames[c] || c}`).join("\n")}\n\nFor each selected commentary, provide a section titled with the commentator's name containing:\n- Their key interpretation of this passage\n- Notable theological insights unique to their perspective\n- Any practical applications they emphasize\nPlace the commentary sections after your main analysis.`
      : "";

    if (!scripture) {
      return NextResponse.json(
        { error: "Scripture reference is required" },
        { status: 400 }
      );
    }

    const prompts: Record<string, string> = {
      outline: `You are an experienced pastor's sermon preparation assistant. Create a detailed sermon outline based on the following:

Scripture: ${scripture}
${title ? `Sermon Title: ${title}` : ""}

Provide:
1. **Introduction** — A compelling hook and context for the passage
2. **Main Points** (3-4 points) — Each with:
   - Sub-point explanation
   - Supporting scripture references
   - Real-life application
3. **Illustrations** — 1-2 story/illustration ideas per main point
4. **Application** — Practical takeaways for the congregation
5. **Conclusion** — A powerful closing and altar call direction
6. **Discussion Questions** — 3-4 small group questions

Format with clear markdown headings and bullets.`,

      exegesis: `You are a biblical scholar. Provide a thorough exegetical analysis of:

Scripture: ${scripture}
${title ? `Context: ${title}` : ""}

Include:
1. **Historical Context** — When, where, who, and why this was written
2. **Original Language Notes** — Key Hebrew/Greek words and their deeper meanings
3. **Literary Structure** — How the passage is organized
4. **Theological Themes** — Core doctrines and themes present
5. **Cross-References** — Related passages throughout Scripture
6. **Pastoral Application** — How this applies to modern life

Be thorough but accessible. Use markdown formatting.`,

      devotional: `You are a spiritual writer crafting a devotional based on:

Scripture: ${scripture}
${title ? `Theme: ${title}` : ""}

Write a warm, personal devotional (500-700 words) that includes:
1. The full scripture text (paraphrased)
2. A relatable opening story or observation
3. What God is speaking through this passage
4. A prayer prompt
5. A reflection question

Tone: Warm, conversational, Spirit-led. Use markdown formatting.`,

      points: `You are a sermon coach. Based on this scripture, generate creative sermon angles:

Scripture: ${scripture}
${title ? `Working Title: ${title}` : ""}

Provide 5 different sermon approaches, each with:
- **Angle/Title** — A compelling sermon title
- **Big Idea** — One sentence thesis
- **Key Tension** — The question or conflict the sermon resolves
- **Target Audience** — Who this angle serves best

Then recommend which angle is strongest and why. Use markdown formatting.`,
    };

    const systemPrompt = (prompts[mode] || prompts.outline) + selectedCommentaryText;
    const userPrompt = `Prepare content for: ${scripture}${title ? ` — "${title}"` : ""}`;

    let content: string;
    const modelId = llm as ModelId;

    switch (modelId) {
      case "gpt-4o":
        content = await generateOpenAI("gpt-4o", systemPrompt, userPrompt);
        break;
      case "gpt-4o-mini":
        content = await generateOpenAI("gpt-4o-mini", systemPrompt, userPrompt);
        break;
      case "gemini-flash":
        content = await generateGemini(systemPrompt, userPrompt);
        break;
      default:
        content = await generateOpenAI("gpt-4o", systemPrompt, userPrompt);
    }

    return NextResponse.json({ success: true, content, model: modelId });
  } catch (err: unknown) {
    console.error("AI error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
