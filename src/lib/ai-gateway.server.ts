// Lovable AI Gateway helper (OpenAI-compatible)
export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

export async function callLovableAI(opts: {
  model?: string;
  messages: ChatMessage[];
  responseFormat?: "json_object" | "text";
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const model = opts.model ?? "google/gemini-3-flash-preview";
  const body: Record<string, unknown> = { model, messages: opts.messages };
  if (opts.responseFormat === "json_object") body.response_format = { type: "json_object" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit — try again in a moment.");
    if (res.status === 402) throw new Error("Lovable AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}
