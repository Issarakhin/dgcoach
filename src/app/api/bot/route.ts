import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import OpenAI from 'openai';

// ⚡️ CONFIG: EDGE RUNTIME (This makes it fast & bypasses timeout)
export const runtime = 'edge'; 

// 1. VALIDATION
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");
if (!process.env.TELEGRAM_SECRET_TOKEN) throw new Error("TELEGRAM_SECRET_TOKEN missing");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

// 2. SETUP
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 3. HARDCODED CONTEXT (Because Edge cannot read files)
const CONTEXT_DATA = `
SYSTEM_NAME: DG Academy AI Coach
WEBSITE: https://dgnext.org
ORGANIZATION: DG Academy (DG Next) is a premier AI & Tech education platform in Cambodia.
COURSES: AI & Data Science, Digital Leadership, Soft Skills.
ACTIONS: 
- Register: https://dgnext.org/authstudent
- Contact: contact@dgdemy.org
INSTRUCTIONS: Be concise. Max 2 sentences. Use emojis.
`;

// 4. AI FUNCTION (Inside this file now)
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
    return completion.choices[0].message.content || "Try again.";
  } catch (e) {
    console.error(e);
    return "I'm thinking too hard. Please ask again!";
  }
}

// 5. BOT LOGIC
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("🌐 Visit DGNext", "https://dgnext.org");
  await ctx.reply("👋 **I am the DG Academy AI Coach!**\n\nAsk me about our courses.", { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  
  // Quick keyword check for buttons
  if (/register|sign up/i.test(text)) {
    const keyboard = new InlineKeyboard().url("📝 Register Here", "https://dgnext.org/authstudent");
    return ctx.reply("Click below to register:", { reply_markup: keyboard });
  }

  // Show typing status
  await ctx.replyWithChatAction("typing");
  
  // Get AI Answer
  const response = await askAI(text);
  await ctx.reply(response);
});

// 6. WEBHOOK HANDLER
export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) return new Response("Unauthorized", { status: 401 });

  try {
    return await webhookCallback(bot, "std/http")(req);
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
}
