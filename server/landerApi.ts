import type { IncomingMessage, ServerResponse } from "node:http";
import { completeLanderChat } from "./deepseekChat";

type RequestWithBody = IncomingMessage & { body?: unknown; originalUrl?: string };

function readBody(req: RequestWithBody): Promise<string> {
  if (typeof req.body === "string") return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
  if (req.body && typeof req.body === "object") return Promise.resolve(JSON.stringify(req.body));

  return new Promise((resolve, reject) => {
    if (req.readableEnded) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (payload && typeof payload === "object" && "usage" in payload && payload.usage) {
    res.setHeader("x-deepseek-usage", JSON.stringify(payload.usage));
  }
  res.end(JSON.stringify(payload));
}

export async function handleLanderRequest(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
) {
  const request = req as RequestWithBody;
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = env.DEEPSEEK_API_KEY;
  const baseUrl = (env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");

  if (!apiKey) {
    sendJson(res, 500, { error: "DeepSeek API key is not configured." });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request)) as {
      messages?: { role: string; content: string }[];
    };

    if (!body.messages?.length) {
      sendJson(res, 400, { error: "Missing messages." });
      return;
    }

    const result = await completeLanderChat({
      apiKey,
      baseUrl,
      messages: body.messages,
    });

    if (!result.ok) {
      sendJson(res, result.status, { error: result.error });
      return;
    }

    sendJson(res, 200, {
      content: result.content,
      usage: result.usage,
      model: result.model,
    });
  } catch {
    sendJson(res, 500, { error: "I couldn't process that request. Please try again." });
  }
}
