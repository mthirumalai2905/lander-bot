import type { VercelRequest, VercelResponse } from "@vercel/node";
import { completeLanderChat } from "../server/deepseekChat";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "DeepSeek API key is not configured." });
    return;
  }

  const messages = req.body?.messages as { role: string; content: string }[] | undefined;
  if (!messages?.length) {
    res.status(400).json({ error: "Missing messages." });
    return;
  }

  const result = await completeLanderChat({
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL,
    messages,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(200).json({ content: result.content });
}
