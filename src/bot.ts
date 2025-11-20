import { Bot, InlineKeyboard } from "grammy";
import OpenAI from "openai";
import http from "http"; // Needed to keep Render happy

// 1. VALIDATION
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("Token missing");
if (!process.env.OPENAI_API_KEY) throw new Error("AI Key missing");

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 2. KNOWLEDGE BASE
const CONTEXT_DATA = `
SYSTEM: DG Academy AI Coach
WEBSITE: https://dgnext.org
INFO: DG Academy is a premier AI education platform in Cambodia.
ACTIONS: Register at https://dgnext.org/authstudent
`;

// 3. AI LOGIC
async function askAI(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Context: ${CONTEXT_DATA}. Be concise.` },
        { role: "user", content: text }
      ]
    });
    return completion.choices[0].message.content || "Try again.";
  } catch (e) {
    console.error(e);
    return "I need a moment. Ask again.";
  }
}

// 4. BOT HANDLERS
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().url("🌐 Visit DG Next", "https://dgnext.org");
  await ctx.reply("👋 **I am the DG Academy AI Coach.** (Running on Render)", { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (/register|sign up/i.test(text)) {
    const keyboard = new InlineKeyboard().url("📝 Register", "https://dgnext.org/authstudent");
    return ctx.reply("Click below to register:", { reply_markup: keyboard });
  }
  await ctx.replyWithChatAction("typing");
  const response = await askAI(text);
  await ctx.reply(response);
});

// 5. START THE BOT
bot.start();
console.log("🚀 Bot is running...");

// 6. DUMMY SERVER (Crucial for Render)
// Render checks if a port is open. If not, it kills the app.
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("DG Bot is Alive!");
}).listen(process.env.PORT || 3000);
