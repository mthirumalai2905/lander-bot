import type { IncomingMessage, ServerResponse } from "node:http";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function handleLanderRequest(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
) {
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
    const body = JSON.parse(await readBody(req)) as {
      messages?: { role: string; content: string }[];
    };

    if (!body.messages?.length) {
      sendJson(res, 400, { error: "Missing messages." });
      return;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: body.messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!response.ok) {
      sendJson(res, 502, {
        error: data.error?.message ?? "I couldn't process that request. Please try again.",
      });
      return;
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      sendJson(res, 502, { error: "I couldn't process that request. Please try again." });
      return;
    }

    sendJson(res, 200, { content });
  } catch {
    sendJson(res, 500, { error: "I couldn't process that request. Please try again." });
  }
}
