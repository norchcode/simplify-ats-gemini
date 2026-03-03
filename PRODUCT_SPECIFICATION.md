# Product Specification Document (PSD)

## 1) Product Overview

**Product Name:** Resume ATS Scanner + Gemini Career Chat

**Type:** Web application (Next.js full-stack)

**Core Value:**
Help users quickly evaluate resume quality against ATS-style criteria, then immediately improve resume content through a contextual chatbot.

---

## 2) Problem Statement

Job seekers often:
- Submit resumes that are not ATS-friendly
- Don’t know which keywords are missing
- Need practical rewrite guidance, not generic advice

Current manual review is slow and inconsistent. This product shortens that loop by combining:
1. ATS-style scan
2. Actionable recommendations
3. AI chat refinement in one flow

---

## 3) Goals

### Primary Goals
- Provide ATS-style scan output in seconds
- Surface concrete, editable recommendations
- Allow instant follow-up coaching in chat using scan context

### Secondary Goals
- Keep UI simple and mobile-friendly
- Avoid login friction for project/demo usage
- Keep deployment lightweight (single codebase)

### Non-Goals (for current version)
- User accounts/authentication
- Resume version history
- Multi-user collaboration
- Enterprise ATS integrations

---

## 4) Target Users

- Fresh graduates preparing first CV
- Junior/mid candidates improving ATS match
- Job switchers tailoring resume per role

---

## 5) User Journey

1. User uploads resume (PDF/DOCX/TXT)
2. Optional: paste job description
3. Click **Scan Resume**
4. System returns:
   - ATS score (0–100)
   - summary
   - strengths
   - missing keywords
   - suggestions
   - improved summary
5. User opens chatbot and asks follow-up questions
6. Chatbot uses ATS context to provide targeted edits

---

## 6) Functional Requirements

### FR-1 Resume Upload & Parsing
- Support file types: `.pdf`, `.docx`, `.txt`
- Reject `.doc` with clear error message
- Extract text from `.docx` and `.txt`
- For PDF and other supported MIME, pass inline data to Gemini

### FR-2 ATS Analysis
- Input: resume + optional job description
- Output JSON structure:
  - `score` (integer 0–100)
  - `summary`
  - `strengths[]`
  - `missingKeywords[]`
  - `suggestions[]`
  - `improvedSummary`
- Output must be concise and actionable

### FR-3 Chat Assistant
- Accept conversation history + optional ATS context
- Maintain supportive, practical coaching tone
- Prefer Indonesian responses when user asks in Indonesian
- Normalize output to plain text formatting

### FR-4 Mobile/Desktop UX
- Desktop default route: `/`
- Mobile-specific route: `/mobile`
- Middleware redirects mobile UA from `/` to `/mobile`
- Mobile shows a compact ATS/Chat tab experience

### FR-5 Error Handling
- Show validation and runtime errors in UI
- Return API errors with proper HTTP status
- Never crash app on malformed model output

---

## 7) Non-Functional Requirements

- **Performance:** ATS and chat responses should feel interactive for demo use
- **Reliability:** Safe JSON parsing and schema normalization for AI output
- **Maintainability:** Single Next.js project with clear API route separation
- **Usability:** Mobile and desktop both first-class, touch-friendly controls

---

## 8) UI/UX Specification

### Visual Direction
- Dark premium theme with soft violet accent gradients
- Minimal, modern layout
- Clear hierarchy between ATS workspace and chat workspace

### Key UI Components
- Hero/product header
- Resume upload surface (custom file picker)
- Score panel with progress bar
- Insight lists (strengths/keywords/suggestions)
- Chat window with message bubbles
- Quick prompt chips for common coaching requests

### UX States
- Loading skeletons for ATS processing
- Error text for invalid file/input failures
- Empty state before first scan

---

## 9) API Specification

### `POST /api/ats-scan`
**Request:** `multipart/form-data`
- `resume` (required file)
- `jobDescription` (optional text)

**Response:**
```json
{
  "result": {
    "score": 0,
    "summary": "",
    "strengths": [],
    "missingKeywords": [],
    "suggestions": [],
    "improvedSummary": ""
  }
}
```

### `POST /api/chat`
**Request:** `application/json`
```json
{
  "messages": [{ "role": "user", "text": "..." }],
  "context": { "atsSummary": "..." }
}
```

**Response:**
```json
{
  "result": "assistant reply"
}
```

---

## 10) Technical Architecture

- **Framework:** Next.js (App Router)
- **Frontend:** React + Tailwind CSS
- **Backend:** Next.js route handlers
- **AI:** Gemini via `@google/genai`
- **DOCX extraction:** `mammoth`
- **Runtime:** Node.js (API routes set to `runtime = "nodejs"`)

---

## 11) Environment & Config

Required env vars:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (recommended: `gemini-2.5-flash`)

---

## 12) Acceptance Criteria

A build is accepted when:
- User can upload PDF/DOCX/TXT and receive ATS result
- ATS result contains all required fields
- Chatbot can answer follow-up requests using ATS context
- Mobile users are redirected to `/mobile`
- Desktop users remain on `/`
- `npm run build` passes without errors

---

## 13) Known Risks / Constraints

- AI output variability may affect consistency of suggestions
- ATS score is heuristic, not tied to a real external ATS engine
- Mobile UA detection is heuristic-based (middleware)

---

## 14) Future Enhancements

- Per-job resume versioning
- Export improved summary/sections to downloadable format
- Richer ATS rubric and customizable weighting
- Optional account system and saved sessions
- Analytics for most common missing keyword patterns

---

## 15) Revision Notes

- Created to document current shipped scope and behavior of final project implementation.
- Aligned with existing codebase behavior in `/app`, `/app/api`, and middleware routing.
