const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the SeekMY AI Guide, a concise and safety-conscious outdoor guide for Malaysia.
Answer in the same language as the user. Focus on Malaysian hiking, diving, cycling, camping, swimming,
trail running, climbing, water sports, equipment, seasons, budgets, and safety. Use only the supplied SeekMY
location list when naming a location as being in the app. Never invent ratings, prices, opening hours, weather,
or availability. State when current conditions should be verified with official authorities or local operators.
For emergencies in Malaysia, direct users to 999. Keep normal answers below 180 words.
Write like a warm, natural chat companion. Do not use Markdown headings, hashtags, asterisks, quotation marks,
or numbered lists. Start with one short direct answer. If several points are helpful, put each one on a new line
and begin it with one relevant emoji, such as 📍 for locations, 🎒 for equipment, ⚠️ for safety, 🌤️ for weather,
or 💡 for a useful tip. Use emojis lightly, keep the wording conversational, and avoid overly formal language.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function clean(value: unknown, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "AI service is not configured." }, 503);

    const body = await request.json();
    const message = clean(body?.message, 1000);
    if (!message) return json({ error: "Message is required." }, 400);

    const rawHistory = Array.isArray(body?.history) ? body.history.slice(-10) : [];
    let history = rawHistory.map((entry: Record<string, unknown>) => ({
      role: entry?.role === "assistant" ? "model" : "user",
      parts: [{ text: clean(entry?.content, 1000) }],
    })).filter((entry: { parts: { text: string }[] }) => entry.parts[0].text);
    while (history[0]?.role === "model") history.shift();
    history = history.filter((entry: { role: string }, index: number) =>
      index === 0 || entry.role !== history[index - 1].role
    );
    if (history.at(-1)?.role === "user") history.pop();

    const locations = (Array.isArray(body?.locations) ? body.locations.slice(0, 50) : [])
      .map((location: Record<string, unknown>) => ({
        name: clean(location?.name, 160),
        state: clean(location?.state, 80),
        activity: clean(location?.activity, 80),
        difficulty: clean(location?.difficulty, 30),
      }))
      .filter((location: { name: string }) => location.name);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history,
            {
              role: "user",
              parts: [{ text: `SeekMY locations (JSON): ${JSON.stringify(locations)}\n\nUser request: ${message}` }],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini request failed", response.status, (await response.text()).slice(0, 1000));
      return json({ error: "The AI guide is temporarily unavailable." }, 503);
    }
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || "").join("").trim();
    return text ? json({ text }) : json({ error: "The AI guide returned no answer." }, 503);
  } catch (error) {
    console.error("chat-with-guide failed", error);
    return json({ error: "The AI guide is temporarily unavailable." }, 500);
  }
});
