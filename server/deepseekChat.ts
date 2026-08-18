export async function completeLanderChat(args: {
  apiKey: string;
  baseUrl?: string;
  messages: { role: string; content: string }[];
}): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  const baseUrl = (args.baseUrl || "https://api.deepseek.com").replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: args.messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      error: data.error?.message ?? "I couldn't process that request. Please try again.",
    };
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return {
      ok: false,
      status: 502,
      error: "I couldn't process that request. Please try again.",
    };
  }

  return { ok: true, content };
}
