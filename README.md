# Final Project — CV/Resume ATS Scanner + Gemini Chatbot

## Chosen Stack (Simple but Interesting)
- **Next.js (App Router)**
- **React (built into Next.js)**
- **Gemini API via `@google/genai`**
- **Custom CSS (no Tailwind required)**

This stack was chosen because:
1. **No Vanilla-only + No Express** (as requested).
2. **Single full-stack project** (frontend + backend API routes in one codebase).
3. **Simple deployment** and easy to explain for final project demo.
4. Still looks modern and interactive.

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

## Notes
- Keep `.env` private (do not upload to GitHub)
- This project follows session materials: API endpoint + frontend chat integration + Gemini model usage
