import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

function normalizeMessages(messages = []) {
  return messages
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text.trim() }]
    }));
}

function buildSystemInstruction(context) {
  const atsContext = context?.atsSummary
    ? `ATS context from previous scan:\n${context.atsSummary}`
    : "No ATS context provided.";

  return `You are a CV/Resume assistant chatbot.
- Give concise, practical answers.
- Keep tone supportive and professional.
- If asked about ATS improvement, give concrete edits.
- Prefer bullet points when giving recommendations.
- If user asks in Indonesian, reply in Indonesian.
${atsContext}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context || {};

    if (!messages.length) {
      return NextResponse.json({ error: "messages is required." }, { status: 400 });
    }

    const ai = getGeminiClient();
    const model = getGeminiModel();

    const contents = normalizeMessages(messages);

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.5,
        systemInstruction: buildSystemInstruction(context)
      }
    });

    const reply = response?.text?.trim() || "Sorry, no response received.";

    return NextResponse.json({ result: reply });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to get response from server." },
      { status: 500 }
    );
  }
}
