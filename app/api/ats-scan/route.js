import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel, normalizeFileMime, safeJsonParse } from "@/lib/gemini";

export const runtime = "nodejs";

function buildAtsPrompt(jobDescription = "") {
  return `You are an ATS (Applicant Tracking System) reviewer for technical resumes.

Task:
1) Analyze the resume file against the job description.
2) Give a practical ATS-style evaluation.
3) Return STRICT JSON only.

Job description:
${jobDescription || "No job description provided. Use generic software/web role ATS checks."}

Return JSON format:
{
  "score": 0,
  "summary": "",
  "strengths": [""],
  "missingKeywords": [""],
  "suggestions": [""],
  "improvedSummary": ""
}

Rules:
- score must be integer 0-100.
- strengths, missingKeywords, suggestions: 3-8 concise bullets each.
- improvedSummary: rewrite a stronger ATS-friendly professional summary in Indonesian + English mix (natural style).
- Keep output concise and actionable.
- Return JSON only, without markdown.`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    const jobDescription = String(formData.get("jobDescription") || "").trim();

    if (!resume || typeof resume === "string") {
      return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
    }

    const mimeType = normalizeFileMime(resume);
    const fileBuffer = Buffer.from(await resume.arrayBuffer());

    const ai = getGeminiClient();
    const model = getGeminiModel();

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: buildAtsPrompt(jobDescription) },
            {
              inlineData: {
                mimeType,
                data: fileBuffer.toString("base64")
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.25,
        responseMimeType: "application/json"
      }
    });

    const parsed = safeJsonParse(response.text, {});

    const payload = {
      score: Number.isFinite(parsed.score) ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 0,
      summary: parsed.summary || "No summary generated.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      improvedSummary: parsed.improvedSummary || ""
    };

    return NextResponse.json({ result: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to scan resume." },
      { status: 500 }
    );
  }
}
