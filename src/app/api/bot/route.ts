import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { askAI } from "@/lib/openai";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");
if (!process.env.TELEGRAM_SECRET_TOKEN) throw new Error("TELEGRAM_SECRET_TOKEN missing");

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// 1. START COMMAND
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("🌐 Visit DGNext", "https://dgnext.org")
    .row()
    .url("🎓 View Courses", "https://dgnext.org/services");

  await ctx.reply(
    "👋 **Hello! I am the DG Academy AI Coach.**\n\nI can answer questions about our AI courses, mission, and registration.\n\n*Type your question below!*",
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// 2. MESSAGE HANDLER
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;

  // Check for keywords to send buttons
  if (/register|sign up|join|login/i.test(text)) {
    const keyboard = new InlineKeyboard()
      .url("📝 Register / Login", "https://dgnext.org/authstudent");
      
    await ctx.reply("To join DG Academy, please register or login here:", { reply_markup: keyboard });
    return;
  }

  // Use AI for everything else
  await ctx.replyWithChatAction("typing");
  
  const aiResponse = await askAI(text);
  await ctx.reply(aiResponse);
});

// 3. WEBHOOK HANDLER
export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    return webhookCallback(bot, "std/http")(req);
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
}