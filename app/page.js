"use client";

import { useMemo, useState } from "react";

const initialBotMessage = {
  role: "assistant",
  text: "Hi! Aku bisa bantu review CV kamu dan kasih saran ATS. Upload resume dulu, ya ✨"
};

const quickPrompts = [
  "Tolong identifikasi 3 peningkatan paling berdampak untuk CV aku.",
  "Bantu tulis ulang pengalaman kerja agar lebih ATS-friendly.",
  "Keyword penting apa yang masih kurang di CV aku?"
];

export default function HomePage() {
  const [activeView, setActiveView] = useState("scan");

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);

  const [messages, setMessages] = useState([initialBotMessage]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const score = useMemo(() => {
    if (!scanResult?.score && scanResult?.score !== 0) return 0;
    return Math.max(0, Math.min(100, Number(scanResult.score) || 0));
  }, [scanResult]);

  async function handleScan(e) {
    e.preventDefault();
    setScanError("");

    if (!resumeFile) {
      setScanError("Please upload your resume file first.");
      return;
    }

    try {
      setScanLoading(true);

      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const res = await fetch("/api/ats-scan", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan resume.");

      setScanResult(data.result);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `ATS scan selesai. Skor kamu ${data.result.score}/100. Kamu bisa tanya aku untuk perbaikan detail ya.`
        }
      ]);
      setActiveView("chat");
    } catch (err) {
      setScanError(err.message || "Something went wrong.");
    } finally {
      setScanLoading(false);
    }
  }

  async function sendChatMessage(userText) {
    const nextMessages = [...messages, { role: "user", text: userText }];
    setMessages(nextMessages);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            atsSummary: scanResult
              ? `Score: ${scanResult.score}\nSummary: ${scanResult.summary}\nMissing Keywords: ${(scanResult.missingKeywords || []).join(", ")}`
              : ""
          }
        })
      });

      const data = await res.json();
      const botText = res.ok
        ? data.result || "Sorry, no response received."
        : data.error || "Failed to get response from server.";

      setMessages((prev) => [...prev, { role: "assistant", text: botText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Failed to get response from server." }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    const userText = chatInput.trim();
    if (!userText || chatLoading) return;

    setChatInput("");
    await sendChatMessage(userText);
  }

  async function handleQuickPrompt(text) {
    if (chatLoading) return;
    await sendChatMessage(text);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <BackgroundGlow />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">AI Resume Studio</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
                Resume ATS Scanner <span className="text-indigo-300">+ Gemini Career Chat</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Revamped UI: lebih clean, lebih modern, mobile-friendly, tetap pakai mekanisme backend yang sama.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Pill text="⚡ Fast" />
              <Pill text="📱 Mobile Friendly" />
              <Pill text="🤖 Gemini" />
            </div>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur md:hidden">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeView === "scan" ? "bg-indigo-500 text-white" : "text-slate-300"
            }`}
            onClick={() => setActiveView("scan")}
            type="button"
          >
            ATS Scan
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeView === "chat" ? "bg-indigo-500 text-white" : "text-slate-300"
            }`}
            onClick={() => setActiveView("chat")}
            type="button"
          >
            Chatbot
          </button>
        </div>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <article
            className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 ${
              activeView !== "scan" ? "hidden md:block" : ""
            }`}
          >
            <SectionTitle step="1" title="ATS Resume Scan" subtitle="Upload CV + optional JD untuk matching yang lebih akurat." />

            <form onSubmit={handleScan} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-200">
                Upload CV / Resume (PDF, DOCX, TXT)
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full rounded-xl border border-slate-600/70 bg-slate-900/60 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-white file:hover:bg-indigo-600"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Job Description (opsional)
                <textarea
                  rows={6}
                  placeholder="Paste job description di sini..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-600/70 bg-slate-900/60 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </label>

              <button
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={scanLoading}
              >
                {scanLoading ? "Scanning..." : "Scan Resume"}
              </button>

              {scanError ? <p className="text-sm text-rose-400">{scanError}</p> : null}
            </form>

            {scanResult ? (
              <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">ATS Match Score</p>
                    <span className="text-base font-bold text-indigo-300">{score}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-indigo-500/15 p-3 text-sm leading-relaxed text-slate-100">
                  {scanResult.summary}
                </div>

                <List title="Strengths" items={scanResult.strengths} />
                <List title="Missing Keywords" items={scanResult.missingKeywords} />
                <List title="Suggestions" items={scanResult.suggestions} />

                {scanResult.improvedSummary ? (
                  <div className="rounded-xl border border-indigo-400/35 bg-indigo-500/10 p-3">
                    <h4 className="text-sm font-semibold text-indigo-200">Improved Professional Summary</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-100">{scanResult.improvedSummary}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-600/70 bg-slate-900/30 p-4 text-sm text-slate-300">
                Belum ada hasil scan. Upload CV dulu, lalu klik <span className="font-semibold text-white">Scan Resume</span>.
              </div>
            )}
          </article>

          <article
            className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 ${
              activeView !== "chat" ? "hidden md:block" : ""
            }`}
          >
            <SectionTitle
              step="2"
              title="Gemini Career Chatbot"
              subtitle="Minta rewrite bullet point, simulasi interview, atau strategi keyword ATS."
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-slate-500/60 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-100 transition hover:border-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={chatLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="chat-scroll mt-3 h-[52vh] min-h-[360px] overflow-y-auto rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} text={msg.text} />
              ))}

              {chatLoading ? (
                <div className="mr-auto mb-2 max-w-[85%] rounded-2xl bg-slate-700/70 px-3 py-2 text-sm text-slate-100 shadow-md">
                  Gemini is thinking...
                </div>
              ) : null}
            </div>

            <form
              onSubmit={handleSendChat}
              className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 p-2 md:sticky md:bottom-0"
            >
              <input
                type="text"
                placeholder="Tulis pertanyaan kamu..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="w-full rounded-lg border border-slate-600/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={chatLoading}
              >
                Send
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute top-12 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
    </div>
  );
}

function SectionTitle({ step, title, subtitle }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-indigo-300/40 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-200">
          Step {step}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div
      className={`mb-2 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-md ${
        isUser ? "ml-auto bg-indigo-500/85 text-white" : "mr-auto bg-slate-700/70 text-slate-100"
      }`}
    >
      {text}
    </div>
  );
}

function Pill({ text }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-100 backdrop-blur">
      {text}
    </span>
  );
}

function List({ title, items = [] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-indigo-200">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-100">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
