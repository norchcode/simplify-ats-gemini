# Stack Selection Notes

## Input Documents Used
- `AI_Framework_Comparison_Report_2026.md`
- `Sesi 2 - Materi Developers.pdf` (API endpoint patterns + file upload via Gemini)
- `Sesi 3 - Materi Developers.pdf` (chat endpoint flow + frontend integration pattern)

## Candidate Stacks from Comparison
- Next.js
- Vue.js
- Nuxt.js

## Why Next.js is selected
1. **Simple full-stack** in one repo (UI + API route handlers).
2. **No Express required** while still supporting backend logic.
3. Easier to convert from starter chatbot flow (`Thinking...`, POST, response handling).
4. Good ecosystem for production-ready UI and deployment.

## Mapping from Session Materials
- Session 2 pattern: file upload + Gemini generateContent => used in `/api/ats-scan`.
- Session 3 pattern: chat request/response with JSON body => used in `/api/chat`.
- Added final-project use case: **ATS resume scan + chatbot coaching**.
