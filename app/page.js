"use client";

import { useMemo, useState } from "react";

const initialBotMessage = {
  role: "assistant",
  text: "Hi! Aku bisa bantu review CV kamu dan kasih saran ATS. Upload resume dulu, ya ✨"
};

const quickPrompts = [
  "Tolong identifikasi 3 peningkatan paling berdampak untuk CV aku.",
  "Bantu rewrite pengalaman kerja biar ATS friendly.",
  "Keyword apa yang paling kurang di CV aku?"
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
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-12 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                Resume ATS Scanner <span className="text-indigo-300">+ Gemini Career Chat</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Upload CV, cek ATS score, lalu ngobrol dengan AI buat dapetin perbaikan yang actionable.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Pill text="⚡ Fast" />
              <Pill text="📱 Mobile Friendly" />
              <Pill text="🤖 Gemini" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur md:hidden">
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

        <section className="grid gap-4 md:grid-cols-2">
          <article
            className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 ${
              activeView !== "scan" ? "hidden md:block" : ""
            }`}
          >
            <h2 className="text-lg font-semibold text-white">1) ATS Resume Scan</h2>
            <p className="mt-1 text-sm text-slate-300">
              Upload CV kamu, lalu compare dengan job description biar ATS score lebih akurat.
            </p>

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
                Job Description (opsional tapi disarankan)
                <textarea
                  rows={6}
                  placeholder="Paste job description di sini untuk ATS matching yang lebih akurat..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-600/70 bg-slate-900/60 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </label>

              <button
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={scanLoading}
              >
                {scanLoading ? "Scanning..." : "Scan Resume"}
              </button>

              {scanError ? <p className="text-sm text-rose-400">{scanError}</p> : null}
            </form>

            {scanResult ? (
              <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-[90px] w-[90px] place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#6366f1 ${score * 3.6}deg, rgba(148, 163, 184, 0.35) 0deg)`
                    }}
                  >
                    <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">
                      {score}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">ATS Match Score</p>
                    <p className="text-xs text-slate-300">Semakin tinggi, semakin cocok dengan role target.</p>
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
            ) : null}
          </article>

          <article
            className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 ${
              activeView !== "chat" ? "hidden md:block" : ""
            }`}
          >
            <h2 className="text-lg font-semibold text-white">2) Gemini Career Chatbot</h2>
            <p className="mt-1 text-sm text-slate-300">
              Lanjut ngobrol: minta rewrite bullet point, mock interview, atau strategi keyword ATS.
            </p>

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
                <div
                  key={i}
                  className={`mb-2 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-md ${
                    msg.role === "user"
                      ? "ml-auto bg-indigo-500/85 text-white"
                      : "mr-auto bg-slate-700/70 text-slate-100"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {chatLoading ? (
                <div className="mr-auto max-w-[85%] rounded-2xl bg-slate-700/70 px-3 py-2 text-sm text-slate-100 shadow-md">
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
