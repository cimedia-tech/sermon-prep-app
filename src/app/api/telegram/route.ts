import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LOG_FILE = "H:\\Anti-mediacreator\\telegram_chat_log.json";
const BOT_TOKEN = "8410327735:AAFe9xetcTnDnQDXz2dXTJJvHrKi_RbOKH0";
const CHAT_ID_FILE = "H:\\Anti-mediacreator\\.tg_chat_id";

export async function GET() {
  try {
    const data = await fs.readFile(LOG_FILE, "utf-8");
    const logs = JSON.parse(data);
    // Return last 30 messages
    return NextResponse.json({ success: true, logs: logs.slice(-30) });
  } catch (err: any) {
    console.error("Failed to read telegram chat log:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to read logs" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Get chat ID
    let chat_id: string;
    try {
      chat_id = (await fs.readFile(CHAT_ID_FILE, "utf-8")).trim();
    } catch {
      return NextResponse.json({ error: "No chat ID found. Please send a message to the bot first." }, { status: 400 });
    }

    // 2. Send to Telegram
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: parseInt(chat_id),
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(tgData)}`);
    }

    // 3. Log to telegram_chat_log.json
    let logs = [];
    try {
      const currentData = await fs.readFile(LOG_FILE, "utf-8");
      logs = JSON.parse(currentData);
    } catch {}

    const entry = {
      timestamp: new Date().toISOString(),
      user: "bot",
      direction: "outgoing",
      text: message,
    };
    logs.push(entry);
    if (logs.length > 500) logs = logs.slice(-500);

    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    console.error("Failed to send telegram message:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to send message" });
  }
}
