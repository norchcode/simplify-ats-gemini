import { NextResponse } from "next/server";
import mammoth from "mammoth";
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

function buildAtsPromptFromExtractedText(jobDescription = "", extractedResumeText = "") {
  return `${buildAtsPrompt(jobDescription)}

Resume text content (already extracted from uploaded file):
${extractedResumeText}`;
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

    if (mimeType === "application/msword") {
      return NextResponse.json(
        {
          error:
            "Legacy .doc is not supported yet. Please upload .docx, .pdf, or .txt for ATS scan."
        },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const model = getGeminiModel();

    let response;

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const extracted = await mammoth.extractRawText({ buffer: fileBuffer });
      const cleanedText = (extracted?.value || "").trim();

      if (!cleanedText) {
        return NextResponse.json({ error: "Could not extract text from DOCX file." }, { status: 400 });
      }

      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildAtsPromptFromExtractedText(
                  jobDescription,
                  cleanedText.slice(0, 25000)
                )
              }
            ]
          }
        ],
        config: {
          temperature: 0.25,
          responseMimeType: "application/json"
        }
      });
    } else if (mimeType === "text/plain") {
      const extractedText = fileBuffer.toString("utf-8").trim();
      if (!extractedText) {
        return NextResponse.json({ error: "TXT file is empty." }, { status: 400 });
      }

      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildAtsPromptFromExtractedText(
                  jobDescription,
                  extractedText.slice(0, 25000)
                )
              }
            ]
          }
        ],
        config: {
          temperature: 0.25,
          responseMimeType: "application/json"
        }
      });
    } else {
      // PDF and other Gemini-supported MIME types use inlineData directly.
      response = await ai.models.generateContent({
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
    }

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
