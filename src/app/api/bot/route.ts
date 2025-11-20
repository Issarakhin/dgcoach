import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { askAI } from "@/lib/openai";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'edge';

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");
if (!process.env.TELEGRAM_SECRET_TOKEN) throw new Error("TELEGRAM_SECRET_TOKEN missing");

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// 1. Start Command
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("🌐 DGNext.org", "https://dgnext.org")
    .row()
    .url("🎓 Courses", "https://dgnext.org/services");

  await ctx.reply(
    "👋 **Hello! I am the DG Academy AI Coach.**\n\nI can answer questions about our AI courses, mission, and how to join.\n\n*Try asking: 'What courses do you offer?'*",
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// 2. Message Handler
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;

  if (/register|sign up|join|login/i.test(text)) {
    const keyboard = new InlineKeyboard().url("📝 Register / Login", "https://dgnext.org/authstudent");
    await ctx.reply("To join DG Academy, please register or login below:", { reply_markup: keyboard });
    return;
  }

  await ctx.replyWithChatAction("typing");
  const aiResponse = await askAI(text);
  await ctx.reply(aiResponse);
});

// 3. Webhook Handler (The critical part)
export async function POST(req: Request) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }
  return webhookCallback(bot, "std/http")(req);
}
