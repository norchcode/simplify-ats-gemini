"use client";

import { useMemo, useState } from "react";

const initialBotMessage = {
  role: "assistant",
  text: "Hi! Aku bisa bantu review CV kamu dan kasih saran ATS. Upload resume dulu, ya ✨"
};

const quickPrompts = [
  "Tolong cek 3 perbaikan terbesar dari CV aku.",
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
    <main className="page">
      <header className="hero">
        <div className="hero-main">
          <h1>Resume ATS Scanner + Gemini Career Chat</h1>
          <p>
            Final project stack: <strong>Next.js + Gemini API</strong>. No login, simple flow, mobile-first.
          </p>
          <div className="hero-pills">
            <span>⚡ Fast Scan</span>
            <span>📱 Mobile Friendly</span>
            <span>🤖 Gemini Powered</span>
          </div>
        </div>
      </header>

      <div className="view-switch" role="tablist" aria-label="Main sections">
        <button
          className={activeView === "scan" ? "active" : ""}
          onClick={() => setActiveView("scan")}
          type="button"
        >
          ATS Scan
        </button>
        <button
          className={activeView === "chat" ? "active" : ""}
          onClick={() => setActiveView("chat")}
          type="button"
        >
          Chatbot
        </button>
      </div>

      <section className="grid">
        <article className={`card ${activeView !== "scan" ? "mobile-hidden" : ""}`}>
          <h2>1) ATS Resume Scan</h2>
          <p className="muted">Upload CV kamu, lalu compare dengan job description biar ATS score lebih akurat.</p>

          <form onSubmit={handleScan} className="form">
            <label className="label">
              Upload CV / Resume (PDF, DOC, DOCX, TXT)
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </label>

            <label className="label">
              Job Description (opsional tapi disarankan)
              <textarea
                rows={6}
                placeholder="Paste job description di sini untuk ATS matching yang lebih akurat..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </label>

            <button className="btn" type="submit" disabled={scanLoading}>
              {scanLoading ? "Scanning..." : "Scan Resume"}
            </button>

            {scanError ? <p className="error">{scanError}</p> : null}
          </form>

          {scanResult ? (
            <div className="result">
              <div className="score-wrap">
                <div
                  className="score-ring"
                  style={{
                    background: `conic-gradient(#4f46e5 ${score * 3.6}deg, #e5e7eb 0deg)`
                  }}
                >
                  <div className="score-inner">{score}</div>
                </div>
                <div>
                  <p className="score-label">ATS Match Score</p>
                  <p className="muted">Semakin tinggi, semakin cocok dengan keyword/job role target.</p>
                </div>
              </div>

              <p className="summary">{scanResult.summary}</p>

              <List title="Strengths" items={scanResult.strengths} />
              <List title="Missing Keywords" items={scanResult.missingKeywords} />
              <List title="Suggestions" items={scanResult.suggestions} />

              {scanResult.improvedSummary ? (
                <div className="improved">
                  <h4>Improved Professional Summary</h4>
                  <p>{scanResult.improvedSummary}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className={`card ${activeView !== "chat" ? "mobile-hidden" : ""}`}>
          <h2>2) Gemini Career Chatbot</h2>
          <p className="muted">Lanjut ngobrol: minta rewrite bullet point, mock interview, atau strategi keyword ATS.</p>

          <div className="quick-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chip"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={chatLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-box">
            {messages.map((msg, i) => (
              <div key={i} className={`bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {chatLoading ? <div className="bubble assistant">Gemini is thinking...</div> : null}
          </div>

          <form onSubmit={handleSendChat} className="chat-form">
            <input
              type="text"
              placeholder="Tulis pertanyaan kamu..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" className="btn" disabled={chatLoading}>
              Send
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}

function List({ title, items = [] }) {
  if (!items?.length) return null;
  return (
    <div className="list">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
