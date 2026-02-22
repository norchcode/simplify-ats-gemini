# Final Project — CV/Resume ATS Scanner + Gemini Chatbot

## Chosen Stack
- **Next.js (App Router)**
- **React (built into Next.js)**
- **Gemini API via `@google/genai`**
- **Tailwind CSS**

Why this stack:
1. **Single full-stack project** (frontend + backend API routes in one codebase).
2. **Simple deployment** and easy to present.
3. Modern, responsive UI with minimal setup.

## Features
- Upload resume (PDF/DOC/DOCX/TXT)
- Optional job description input
- ATS-style score + strengths + missing keywords + suggestions
- Improved professional summary suggestion
- Embedded Gemini chatbot for follow-up coaching
- Chatbot can use ATS scan context
- Mobile-optimized UI (section switcher + touch-friendly input)

## API Endpoints
- `POST /api/ats-scan` (multipart/form-data)
  - fields: `resume` (file), `jobDescription` (text, optional)
- `POST /api/chat` (application/json)
  - body:
    ```json
    {
      "messages": [{ "role": "user", "text": "..." }],
      "context": { "atsSummary": "..." }
    }
    ```

## Setup
1. Copy `.env.example` to `.env`
2. Fill:
   - `GEMINI_API_KEY=...`
   - `GEMINI_MODEL=gemini-2.5-flash`
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`
