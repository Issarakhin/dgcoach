import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import OpenAI from "openai";

// 🚀 PERFORMANCE: Use Edge Runtime (Prevents 504 Timeouts)
export const runtime = 'edge';
export const config = {
  maxDuration: 60,

};
  
// --- 1. VALIDATION ---
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is missing");
if (!process.env.TELEGRAM_SECRET_TOKEN) throw new Error("TELEGRAM_SECRET_TOKEN is missing");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");

// --- 2. INIT ---
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 3. KNOWLEDGE BASE (Hardcoded for Edge Speed) ---
const CONTEXT_DATA = `
SYSTEM_NAME: DG Academy AI Coach
WEBSITE: https://dgnext.org
CONTEXT: DG Academy (DG Next) is a premier AI education platform in Cambodia.
OFFERINGS:
- AI & Data Science Courses
- Digital Leadership Training
- VR/AR Experiences
ACTIONS:
- Register: https://dgnext.org/authstudent
- Contact: contact@dgdemy.org
INSTRUCTIONS: Answer concisely (max 3 sentences). Be friendly and encouraging.
`;

// --- 4. AI LOGIC ---
async function askAI(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        { role: "system", content: CONTEXT_DATA },
        { role: "user", content: text }
      ]
    });
    return completion.choices[0].message.content || "Please try again.";
  } catch (e) {
    console.error("AI Error:", e);
    return "I am currently experiencing high traffic. Please try again later.";
  }
}

// --- 5. BOT COMMANDS ---
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("🌐 Visit DG Next", "https://dgnext.org");
  await ctx.reply("👋 **Welcome to DG Academy!**\n\nI am your AI Coach. Ask me about our courses or how to register!", { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  
  // Smart Button Check
  if (/register|sign up|join/i.test(text)) {
    const keyboard = new InlineKeyboard().url("📝 Register Now", "https://dgnext.org/authstudent");
    return ctx.reply("Click below to start your journey:", { reply_markup: keyboard });
  }

  await ctx.replyWithChatAction("typing");
  const response = await askAI(text);
  await ctx.reply(response);
});

// --- 6. THE "MAGIC" SETUP HANDLER (GET) ---
// Visits to this URL will automatically set the Webhook
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const webhookUrl = `${url.protocol}//${url.host}/api/bot`;

    // 1. Delete old webhook to clear jams
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    // 2. Set new webhook with the Secret Token from .env
    await bot.api.setWebhook(webhookUrl, {
      secret_token: process.env.TELEGRAM_SECRET_TOKEN
    });

    return new Response(`✅ Success! Webhook set to: ${webhookUrl}`, { status: 200 });
  } catch (e: any) {
    return new Response(`❌ Error: ${e.message}`, { status: 500 });
  }
}

// --- 7. THE BOT HANDLER (POST) ---
// Telegram sends messages here
export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    return await webhookCallback(bot, "std/http")(req);
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
}
