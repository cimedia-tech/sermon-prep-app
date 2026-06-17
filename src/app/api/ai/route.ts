import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

type ModelId = "gpt-4o" | "gpt-4o-mini" | "gemini-flash" | "groq" | "ollama";

function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  
  // Remove markdown wrapping if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  }
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("Direct JSON parsing failed, attempting cleanup:", err);
  }
  
  // Simple syntax fixes for common LLM issues:
  try {
    let fixed = cleaned
      .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
      .replace(/\\n/g, "\\n")        // Escape literal newlines
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove invalid control characters
      
    return JSON.parse(fixed);
  } catch (err2) {
    console.error("JSON cleanup parse failed:", err2);
    throw new Error("Invalid JSON returned by the AI model: " + (err2 as Error).message);
  }
}

function deepValidateAndDefault(obj: any): any {
  if (!obj || typeof obj !== "object") {
    throw new Error("AI output is not a JSON object");
  }
  
  const defaults = {
    framework_name: "AFCoD Weekly Scripture Framework",
    version: "1.0",
    study: {
      anchor_scripture: {
        reference: "",
        translation: "KJV",
        text: "",
        historical_context: {
          author: "",
          audience: "",
          setting: "",
          context: ""
        }
      },
      central_theme: {
        title: "",
        summary: "",
        kingdom_principle: ""
      },
      anchor_amplification: {
        then: "",
        through_jesus: "",
        now: ""
      },
      vocabulary_study: [],
      teaching_outline: {
        observation: [],
        interpretation: [],
        application: []
      },
      hidden_insights: {
        symbolism: [],
        patterns: [],
        repeated_words: [],
        prophetic_shadows: [],
        deeper_revelations: []
      },
      matthew_henry_perspective: {
        summary: "",
        warnings: [],
        encouragements: [],
        practical_lessons: []
      },
      prophetic_parallel: {
        church_age_application: "",
        end_time_implications: "",
        personal_prophetic_significance: "",
        kingdom_fulfillment: ""
      },
      psychological_contrast: {
        world_response: "",
        kingdom_response: ""
      },
      devotional_reflection: {
        reflection_question: "",
        prayer: "",
        action_step: ""
      },
      teaching_script: {
        introduction: "",
        main_points: [],
        illustration: "",
        challenge: "",
        closing_prayer: ""
      },
      short_sermon: {
        title: "",
        introduction: "",
        scripture_reading: "",
        main_points: [],
        illustration: "",
        invitation: "",
        conclusion: ""
      },
      jesus_connection: {
        messianic_relevance: "",
        fulfillment: "",
        gospel_application: ""
      },
      biblical_character_study: [],
      cross_references: [],
      leadership_principles: [],
      worship_connection: {
        theme: "",
        response: "",
        worship_application: ""
      },
      faith_declarations: [],
      memory_verse: {
        reference: "",
        text: ""
      },
      discussion_questions: [],
      ministry_application: {
        individual: "",
        family: "",
        church: "",
        community: ""
      },
      story_illustration: {
        title: "",
        story: "",
        lesson: ""
      },
      weekly_action_plan: {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: ""
      },
      study_metadata: {
        week_of: "",
        theme_year: "A Destiny by Divine Design",
        speaker: "",
        church: "",
        generated_date: "",
        tags: []
      }
    }
  };

  const merge = (target: any, source: any): any => {
    if (source === null || source === undefined) return target;
    if (Array.isArray(target)) {
      return Array.isArray(source) ? source : [source];
    }
    if (typeof target === "object" && typeof source === "object") {
      const result = { ...target };
      for (const key of Object.keys(target)) {
        result[key] = merge(target[key], source[key]);
      }
      for (const key of Object.keys(source)) {
        if (!(key in target)) {
          result[key] = source[key];
        }
      }
      return result;
    }
    return source;
  };

  return merge(defaults, obj);
}

async function generateAndValidate(modelId: ModelId, systemPrompt: string, userPrompt: string): Promise<string> {
  let rawResponse: string;
  switch (modelId) {
    case "gpt-4o":
      rawResponse = await generateOpenAI("gpt-4o", systemPrompt, userPrompt);
      break;
    case "gpt-4o-mini":
      rawResponse = await generateOpenAI("gpt-4o-mini", systemPrompt, userPrompt);
      break;
    case "gemini-flash":
      rawResponse = await generateGemini(systemPrompt, userPrompt);
      break;
    case "groq":
      rawResponse = await generateGroq(systemPrompt, userPrompt);
      break;
    case "ollama":
      rawResponse = await generateOllama(systemPrompt, userPrompt);
      break;
    default:
      rawResponse = await generateOpenAI("gpt-4o", systemPrompt, userPrompt);
  }
  
  const parsed = cleanAndParseJSON(rawResponse);
  const validated = deepValidateAndDefault(parsed);
  return JSON.stringify(validated, null, 2);
}

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
    response_format: { type: "json_object" },
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
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text() || "No response generated.";
}

async function generateGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured. Add it in Vercel env vars.");
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

async function generateOllama(systemPrompt: string, userPrompt: string): Promise<string> {
  // 1. Check available models
  let availableModels: string[] = [];
  try {
    const tagsRes = await fetch("http://127.0.0.1:11434/api/tags");
    if (tagsRes.ok) {
      const tagsData = await tagsRes.json();
      availableModels = tagsData.models?.map((m: any) => m.name) || [];
    }
  } catch (err) {
    throw new Error("Cannot connect to Ollama at http://127.0.0.1:11434. Note: Local Ollama is only supported when running this app locally on your machine.");
  }

  if (availableModels.length === 0) {
    throw new Error("Ollama is running, but no models are downloaded. Please open your terminal and run 'ollama pull llama3.2' to download a model.");
  }

  // 2. Select the best available model (prefer llama3.2, then llama3, then fallback to first available)
  let selectedModel = availableModels[0];
  const preferences = ["llama3.2:latest", "llama3.2", "llama3:latest", "llama3"];
  for (const pref of preferences) {
    if (availableModels.includes(pref)) {
      selectedModel = pref;
      break;
    }
  }

  // 3. Generate response
  const res = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: false,
      format: "json",
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.statusText} for model '${selectedModel}'.`);
  }

  const data = await res.json();
  return data.message?.content || "No response generated.";
}

export async function POST(req: NextRequest) {
  try {
    const { scripture, title, mode, commentaries = [], llm = "gpt-4o", selectedArtifacts = [] } = await req.json();

    if (!scripture) {
      return NextResponse.json(
        { error: "Scripture reference is required" },
        { status: 400 }
      );
    }

    // Generate stable cache key based on query parameters
    const crypto = await import("crypto");
    const cacheInput = JSON.stringify({ scripture, title, mode, commentaries, llm, selectedArtifacts });
    const hash = crypto.createHash("sha256").update(cacheInput).digest("hex");
    const cacheDir = path.join(process.cwd(), "cache");
    const cacheFilePath = path.join(cacheDir, `${hash}.json`);

    try {
      const cachedData = await fs.readFile(cacheFilePath, "utf-8");
      console.log(`[Cache] HIT for ${scripture}`);
      return NextResponse.json(JSON.parse(cachedData));
    } catch (cacheErr) {
      // Cache miss - proceed to generate content
    }

    const commentaryNames: Record<string, string> = {
      matthew_henry: "Matthew Henry's Commentary",
      spurgeon: "Charles Spurgeon's Sermons & Treasury of David",
      john_calvin: "John Calvin's Commentaries",
      adam_clarke: "Adam Clarke's Commentary",
      john_macarthur: "John MacArthur's Study Bible Commentary",
    };

    const selectedCommentaryText = commentaries.length > 0
      ? `\n\n**IMPORTANT: Include dedicated commentary sections from the following sources:**\n${commentaries.map((c: string) => `- ${commentaryNames[c] || c}`).join("\n")}\n\nFor each selected commentary, add summary and warning/lessons elements to 'matthew_henry_perspective' (or include them in the historical study as appropriate).`
      : "";

    // Artifact and prompt selection mapping
    const artifactMapping: Record<string, string[]> = {
      context: ["anchor_scripture", "cross_references"],
      theme: ["central_theme", "anchor_amplification", "hidden_insights", "prophetic_parallel", "psychological_contrast"],
      lexicon: ["vocabulary_study"],
      outline: ["teaching_outline", "leadership_principles"],
      script: ["teaching_script"],
      sermon: ["short_sermon", "jesus_connection", "story_illustration"],
      commentary: ["matthew_henry_perspective", "biblical_character_study"],
      devotional: ["devotional_reflection", "memory_verse", "discussion_questions"],
      worship: ["worship_connection", "faith_declarations"],
      action: ["weekly_action_plan", "ministry_application"]
    };

    let activeFields = new Set<string>();
    if (!selectedArtifacts || selectedArtifacts.length === 0) {
      Object.values(artifactMapping).forEach(fields => {
        fields.forEach(f => activeFields.add(f));
      });
    } else {
      selectedArtifacts.forEach((a: string) => {
        if (artifactMapping[a]) {
          artifactMapping[a].forEach(f => activeFields.add(f));
        }
      });
    }
    // Metadata is always active
    activeFields.add("study_metadata");

    // Dynamically build requested JSON schema strings
    const schemaParts: string[] = [];
    
    if (activeFields.has("anchor_scripture")) {
      schemaParts.push(`"anchor_scripture": {
        "reference": "String (scripture reference)",
        "translation": "String (e.g. KJV)",
        "text": "String (full scripture text in KJV)",
        "historical_context": {
          "author": "String (author notes)",
          "audience": "String (audience notes)",
          "setting": "String (historical setting notes)",
          "context": "String (literary/historical context)"
        }
      }`);
    } else {
      schemaParts.push(`"anchor_scripture": null`);
    }

    if (activeFields.has("central_theme")) {
      schemaParts.push(`"central_theme": {
        "title": "String (theme title)",
        "summary": "String (theme summary)",
        "kingdom_principle": "String (kingdom principle revealed)"
      }`);
    } else {
      schemaParts.push(`"central_theme": null`);
    }

    if (activeFields.has("anchor_amplification")) {
      schemaParts.push(`"anchor_amplification": {
        "then": "String (original historical meaning)",
        "through_jesus": "String (fulfillment in Christ)",
        "now": "String (application for today)"
      }`);
    } else {
      schemaParts.push(`"anchor_amplification": null`);
    }

    if (activeFields.has("vocabulary_study")) {
      schemaParts.push(`"vocabulary_study": [
        {
          "word": "String (Hebrew/Greek word)",
          "language": "String (Hebrew or Greek)",
          "strongs_number": "String (Strong's concordance ID)",
          "pronunciation": "String (pronunciation guide)",
          "definition": "String (lexical definition)",
          "spiritual_significance": "String (significance and insight)"
        }
      ]`);
    } else {
      schemaParts.push(`"vocabulary_study": []`);
    }

    if (activeFields.has("teaching_outline")) {
      schemaParts.push(`"teaching_outline": {
        "observation": ["String (observation point 1)"],
        "interpretation": ["String (interpretation point 1)"],
        "application": ["String (application point 1)"]
      }`);
    } else {
      schemaParts.push(`"teaching_outline": { "observation": [], "interpretation": [], "application": [] }`);
    }

    if (activeFields.has("hidden_insights")) {
      schemaParts.push(`"hidden_insights": {
        "symbolism": ["String (symbolism 1)"],
        "patterns": ["String (structural pattern 1)"],
        "repeated_words": ["String (repeated word 1)"],
        "prophetic_shadows": ["String (prophetic shadow 1)"],
        "deeper_revelations": ["String (deeper revelation 1)"]
      }`);
    } else {
      schemaParts.push(`"hidden_insights": { "symbolism": [], "patterns": [], "repeated_words": [], "prophetic_shadows": [], "deeper_revelations": [] }`);
    }

    if (activeFields.has("matthew_henry_perspective")) {
      schemaParts.push(`"matthew_henry_perspective": {
        "summary": "String (summary of Matthew Henry's/commentators' perspective)",
        "warnings": ["String (warning/danger warning 1)"],
        "encouragements": ["String (encouragement 1)"],
        "practical_lessons": ["String (practical lesson 1)"]
      }`);
    } else {
      schemaParts.push(`"matthew_henry_perspective": null`);
    }

    if (activeFields.has("prophetic_parallel")) {
      schemaParts.push(`"prophetic_parallel": {
        "church_age_application": "String (relevance to the church age)",
        "end_time_implications": "String (eschatological implications)",
        "personal_prophetic_significance": "String (personal prophetic application)",
        "kingdom_fulfillment": "String (kingdom fulfillment)"
      }`);
    } else {
      schemaParts.push(`"prophetic_parallel": null`);
    }

    if (activeFields.has("psychological_contrast")) {
      schemaParts.push(`"psychological_contrast": {
        "world_response": "String (secular/worldly response)",
        "kingdom_response": "String (believer/kingdom response)"
      }`);
    } else {
      schemaParts.push(`"psychological_contrast": null`);
    }

    if (activeFields.has("devotional_reflection")) {
      schemaParts.push(`"devotional_reflection": {
        "reflection_question": "String (personal reflection question)",
        "prayer": "String (prayer prompt)",
        "action_step": "String (concrete daily action step)"
      }`);
    } else {
      schemaParts.push(`"devotional_reflection": null`);
    }

    if (activeFields.has("teaching_script")) {
      schemaParts.push(`"teaching_script": {
        "introduction": "String (complete introduction script)",
        "main_points": [
          {
            "title": "String (point title)",
            "content": "String (complete script content for this point)"
          }
        ],
        "illustration": "String (narrative illustration)",
        "challenge": "String (challenge call)",
        "closing_prayer": "String (closing prayer)"
      }`);
    } else {
      schemaParts.push(`"teaching_script": null`);
    }

    if (activeFields.has("short_sermon")) {
      schemaParts.push(`"short_sermon": {
        "title": "String (sermon title)",
        "introduction": "String (intro script)",
        "scripture_reading": "String (scripture reading direction)",
        "main_points": [
          {
            "title": "String (point title)",
            "content": "String (point content)"
          }
        ],
        "illustration": "String (compelling story)",
        "invitation": "String (invitation/altar call script)",
        "conclusion": "String (concluding remarks)"
      }`);
    } else {
      schemaParts.push(`"short_sermon": null`);
    }

    if (activeFields.has("jesus_connection")) {
      schemaParts.push(`"jesus_connection": {
        "messianic_relevance": "String (messianic shadows/connections)",
        "fulfillment": "String (how Christ fulfills this theme)",
        "gospel_application": "String (relevance to the gospel message)"
      }`);
    } else {
      schemaParts.push(`"jesus_connection": null`);
    }

    if (activeFields.has("biblical_character_study")) {
      schemaParts.push(`"biblical_character_study": [
        {
          "name": "String (character name)",
          "role": "String (their role)",
          "significance": "String (their historical significance)",
          "lesson": "String (lesson for modern believers)"
        }
      ]`);
    } else {
      schemaParts.push(`"biblical_character_study": []`);
    }

    if (activeFields.has("cross_references")) {
      schemaParts.push(`"cross_references": [
        {
          "reference": "String (scripture reference)",
          "relationship": "String (how it connects to and reinforces the main text)"
        }
      ]`);
    } else {
      schemaParts.push(`"cross_references": []`);
    }

    if (activeFields.has("leadership_principles")) {
      schemaParts.push(`"leadership_principles": [
        {
          "principle": "String (leadership principle)",
          "application": "String (application context)"
        }
      ]`);
    } else {
      schemaParts.push(`"leadership_principles": []`);
    }

    if (activeFields.has("worship_connection")) {
      schemaParts.push(`"worship_connection": {
        "theme": "String (worship connection theme)",
        "response": "String (devotional response)",
        "worship_application": "String (application to congregational worship)"
      }`);
    } else {
      schemaParts.push(`"worship_connection": null`);
    }

    if (activeFields.has("faith_declarations")) {
      schemaParts.push(`"faith_declarations": ["String (faith declaration 1)", "String (faith declaration 2)"]`);
    } else {
      schemaParts.push(`"faith_declarations": []`);
    }

    if (activeFields.has("memory_verse")) {
      schemaParts.push(`"memory_verse": {
        "reference": "String (scripture reference)",
        "text": "String (verse text)"
      }`);
    } else {
      schemaParts.push(`"memory_verse": null`);
    }

    if (activeFields.has("discussion_questions")) {
      schemaParts.push(`"discussion_questions": ["String (discussion question 1)", "String (discussion question 2)"]`);
    } else {
      schemaParts.push(`"discussion_questions": []`);
    }

    if (activeFields.has("ministry_application")) {
      schemaParts.push(`"ministry_application": {
        "individual": "String (application for individuals)",
        "family": "String (application for families)",
        "church": "String (application for local churches)",
        "community": "String (application for communities)"
      }`);
    } else {
      schemaParts.push(`"ministry_application": null`);
    }

    if (activeFields.has("story_illustration")) {
      schemaParts.push(`"story_illustration": {
        "title": "String (illustration title)",
        "story": "String (full narrative text)",
        "lesson": "String (moral/lesson)"
      }`);
    } else {
      schemaParts.push(`"story_illustration": null`);
    }

    if (activeFields.has("weekly_action_plan")) {
      schemaParts.push(`"weekly_action_plan": {
        "monday": "String (Monday activity)",
        "tuesday": "String (Tuesday activity)",
        "wednesday": "String (Wednesday activity)",
        "thursday": "String (Thursday activity)",
        "friday": "String (Friday activity)",
        "saturday": "String (Saturday activity)",
        "sunday": "String (Sunday activity)"
      }`);
    } else {
      schemaParts.push(`"weekly_action_plan": null`);
    }

    schemaParts.push(`"study_metadata": {
      "week_of": "String (liturgical week date)",
      "theme_year": "String (default: A Destiny by Divine Design)",
      "speaker": "String (optional)",
      "church": "String (optional)",
      "generated_date": "String (current date)",
      "tags": ["String"]
    }`);

    const systemPrompt = `You are a world-class biblical scholar, theologian, and experienced pastor's assistant.
Your task is to generate a comprehensive, magazine-quality scripture study and sermon preparation breakdown following the "Homiletic Framework" version 1.0.

You MUST respond ONLY with a valid JSON object conforming exactly to the following JSON schema. Do not wrap the response in any markdown formatting (do not wrap in \`\`\`json or similar), just return the raw JSON string.

Requested JSON Schema:
{
  "framework_name": "AFCoD Weekly Scripture Framework",
  "version": "1.0",
  "study": {
    ${schemaParts.join(",\n    ")}
  }
}

Guidelines:
1. Ensure all active fields are filled with deep, rich theological insights. Do not leave strings empty.
2. For any field explicitly marked as null, empty array [], or empty object {} in the schema above, you MUST return it as null or empty (do not generate content for it).
3. "teaching_script" and "short_sermon" should contain complete, word-for-word text ready to preach, not summaries.
4. Make sure the JSON is perfectly formatted and valid. Escaping quotes and newlines appropriately.
5. The user will supply: Scripture: ${scripture} and optional title: ${title}.${selectedCommentaryText}`;

    const userPrompt = `Prepare content for: ${scripture}${title ? ` — "${title}"` : ""}`;

    let content: string;
    const modelId = llm as ModelId;
    let actualModelUsed: string = modelId;
    let fallbackUsed = false;

    try {
      content = await generateAndValidate(modelId, systemPrompt, userPrompt);
    } catch (primaryError: any) {
      console.warn(`Primary model ${modelId} failed (network or JSON schema validation):`, primaryError);
      
      let groqFailedOrSkipped = false;
      let groqErrorMsg = "";

      // 1. Try falling back to Groq if the primary model wasn't Groq/Ollama and we have a key
      if (modelId !== "groq" && modelId !== "ollama" && process.env.GROQ_API_KEY) {
        console.log("Attempting fallback to Groq (Cloud)...");
        try {
          content = await generateAndValidate("groq", systemPrompt, userPrompt);
          fallbackUsed = true;
          actualModelUsed = "groq";
          return NextResponse.json({
            success: true,
            content,
            model: actualModelUsed,
            fallbackUsed,
            primaryModel: modelId
          });
        } catch (groqError: any) {
          console.warn("Fallback to Groq failed:", groqError);
          groqFailedOrSkipped = true;
          groqErrorMsg = groqError instanceof Error ? groqError.message : String(groqError);
        }
      } else {
        groqFailedOrSkipped = true;
        groqErrorMsg = !process.env.GROQ_API_KEY ? "GROQ_API_KEY not configured" : "Skipped (primary model was Groq or Ollama)";
      }

      // 2. Try falling back to Ollama if the primary model wasn't Ollama (and Groq was skipped or failed)
      if (modelId !== "ollama" && groqFailedOrSkipped) {
        console.log("Attempting fallback to local Ollama...");
        try {
          content = await generateAndValidate("ollama", systemPrompt, userPrompt);
          fallbackUsed = true;
          actualModelUsed = "ollama";
        } catch (ollamaError: any) {
          console.error("Fallback to Ollama failed as well:", ollamaError);
          const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
          const ollamaMsg = ollamaError instanceof Error ? ollamaError.message : String(ollamaError);
          throw new Error(
            `Primary model error (${modelId}): ${primaryMsg}. ` +
            (modelId !== "groq" && process.env.GROQ_API_KEY ? `Groq fallback error: ${groqErrorMsg}. ` : "") +
            `Local Ollama fallback also failed: ${ollamaMsg}`
          );
        }
      } else {
        throw primaryError;
      }
    }

    const resultJson = {
      success: true,
      content,
      model: actualModelUsed,
      fallbackUsed,
      primaryModel: modelId
    };

    // Save generated response to cache
    try {
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cacheFilePath, JSON.stringify(resultJson, null, 2), "utf-8");
      console.log(`[Cache] Saved response cache for ${scripture}`);
    } catch (cacheErr) {
      console.warn("Failed to save AI response cache:", cacheErr);
    }

    return NextResponse.json(resultJson);
  } catch (err: unknown) {
    console.error("AI error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
