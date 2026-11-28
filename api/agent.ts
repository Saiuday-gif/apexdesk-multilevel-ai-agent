export interface AgentRequest {
  message: string;
  sessionId?: string;
  channel?: "web" | "telegram" | "whatsapp";
}

export interface AgentResponse {
  reply: string;
  model: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are ApexDesk AI, an autonomous, fast, and secure enterprise operations assistant for Saiuday Somidi.
Execute requests concisely and accurately in Asia/Kolkata (IST, +05:30) timezone.
Never expose API keys, tokens, webhook URLs, or internal IDs.
Do not include any sign-off footer in your output.`;

export async function runApexDeskAgent(
  payload: AgentRequest
): Promise<AgentResponse> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables.");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: payload.message },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const reply =
    data?.choices?.[0]?.message?.content?.trim() ||
    "Unable to generate a response at the moment.";

  return {
    reply,
    model: "llama-3.3-70b-versatile",
    timestamp: new Date().toISOString(),
  };
}