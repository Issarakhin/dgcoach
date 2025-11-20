import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let cachedContext: string | null = null;

function getContext(): string {
  if (cachedContext) return cachedContext;
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'context.txt');
    cachedContext = fs.readFileSync(filePath, 'utf8');
    return cachedContext;
  } catch (error) {
    console.error("Error reading context file:", error);
    return "DG Academy is an AI education platform.";
  }
}

export async function askAI(userQuestion: string): Promise<string> {
  const context = getContext();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      temperature: 0.6,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `You are the AI Coach for DG Academy. 
          KNOWLEDGE BASE:
          ${context}

          INSTRUCTIONS:
          1. Answer questions based strictly on the KNOWLEDGE BASE.
          2. If the user asks for links/registration, mention you can provide a button.
          3. Keep answers concise.
          4. If unsure, refer them to contact@dgdemy.org.`
        },
        { role: "user", content: userQuestion },
      ],
    });

    return completion.choices[0].message.content || "I'm not sure, please try again.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "I am currently experiencing high traffic. Please ask again in a moment.";
  }
}
