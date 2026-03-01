"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatLoading]);

  const score = useMemo(() => {
    if (!scanResult?.score && scanResult?.score !== 0) return 0;
    return Math.max(0, Math.min(100, Number(scanResult.score) || 0));
  }, [scanResult]);

  const scoreLabel = useMemo(() => {
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Needs Optimization";
    return "Low Match";
  }, [score]);

  const scoreTone = useMemo(() => {
    if (score >= 80) return "text-emerald-300";
    if (score >= 60) return "text-amber-300";
    return "text-rose-300";
  }, [score]);

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
      setMessages((prev) => [...prev, { role: "assistant", text: "Failed to get response from server." }]);
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
        <Hero />

        <WorkflowStrip />

        <div className="mt-5 md:hidden">
          <Tabs>
            <TabsList>
              <TabsTrigger type="button" active={activeView === "scan"} onClick={() => setActiveView("scan")}>
                ATS Scan
              </TabsTrigger>
              <TabsTrigger type="button" active={activeView === "chat"} onClick={() => setActiveView("chat")}>
                Chatbot
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <section className="mt-5 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <Card className={`fancy-card ${activeView !== "scan" ? "hidden md:block" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Step 1</Badge>
                <CardTitle>1) ATS Resume Scan</CardTitle>
              </div>
              <CardDescription>Upload CV kamu, lalu bandingkan dengan job description biar ATS score lebih akurat.</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleScan} className="space-y-4">
                <div className="upload-surface rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-indigo-100">Upload CV / Resume (PDF, DOCX, TXT)</p>
                      <p className="mt-1 text-xs text-slate-300">Keep it concise, role-focused, and keyword-rich.</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-indigo-100">ATS-ready mode</div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button type="button" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => fileInputRef.current?.click()}>
                      Choose Resume File
                    </Button>
                    <div className="min-w-[220px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200">
                      {resumeFile ? (
                        <>
                          <span className="text-emerald-300">●</span> Selected: {resumeFile.name}
                        </>
                      ) : (
                        "No file selected yet"
                      )}
                    </div>
                  </div>
                </div>

                <label className="block text-sm text-slate-200">
                  Job Description (opsional tapi disarankan)
                  <Textarea
                    rows={6}
                    placeholder="Paste job description di sini untuk ATS matching yang lebih akurat..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-2"
                  />
                </label>

                <Button className="h-11 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-[15px] font-semibold hover:brightness-110" type="submit" disabled={scanLoading}>
                  {scanLoading ? "Scanning..." : "Scan Resume"}
                </Button>

                {scanError ? <p className="text-sm text-rose-400">{scanError}</p> : null}
              </form>

              {scanLoading ? <ScanSkeleton /> : null}

              {scanResult ? (
                <div className="mt-5 space-y-4 border-t border-white/10 pt-4 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">ATS Match Score</p>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${scoreTone}`}>{score}/100</p>
                        <p className="text-[11px] text-slate-400">{scoreLabel}</p>
                      </div>
                    </div>
                    <Progress value={score} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <InfoPill label="Strengths" value={scanResult.strengths?.length || 0} tone="from-emerald-500/20 to-transparent" />
                    <InfoPill label="Keywords" value={scanResult.missingKeywords?.length || 0} tone="from-amber-500/20 to-transparent" />
                    <InfoPill label="Suggestions" value={scanResult.suggestions?.length || 0} tone="from-indigo-500/20 to-transparent" />
                  </div>

                  <div className="rounded-xl bg-indigo-500/15 p-3 text-sm leading-relaxed text-slate-100">{scanResult.summary}</div>

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
                <EmptyAnalysisState />
              )}
            </CardContent>
          </Card>

          <Card className={`fancy-card ${activeView !== "chat" ? "hidden md:block" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Step 2</Badge>
                <CardTitle>2) Gemini Career Chatbot</CardTitle>
              </div>
              <CardDescription>Lanjut ngobrol: minta rewrite bullet point, mock interview, atau strategi keyword ATS.</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={chatLoading}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>

              <div className="chat-scroll mt-3 h-[52vh] min-h-[360px] overflow-y-auto rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} role={msg.role} text={msg.text} />
                ))}

                {chatLoading ? (
                  <div className="mr-auto mb-2 max-w-[85%] rounded-2xl bg-slate-700/70 px-3 py-2 text-sm text-slate-100 shadow-md">
                    Gemini is thinking...
                  </div>
                ) : null}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/80 p-2">
                <Input
                  type="text"
                  placeholder="Tulis pertanyaan kamu..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-violet-500" disabled={chatLoading}>
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Hero() {
  return (
    <Card className="border-white/15 bg-gradient-to-br from-white/10 via-indigo-500/10 to-violet-500/10 backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">AI Career Studio</p>
            <CardTitle className="mt-2 text-2xl sm:text-3xl">
              Resume ATS Scanner <span className="text-indigo-300">+ Gemini Career Chat</span>
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm sm:text-base">
              Upload CV, cek ATS score, lalu ngobrol dengan AI buat dapetin perbaikan yang actionable.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">⚡ Fast</Badge>
            <Badge variant="outline">📱 Mobile Friendly</Badge>
            <Badge variant="outline">🤖 Gemini</Badge>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function WorkflowStrip() {
  return (
    <div className="mt-4 hidden rounded-xl border border-white/10 bg-white/5 p-3 md:flex md:items-center md:justify-between">
      <WorkflowStep index="01" title="Upload Resume" desc="CV + optional job description" />
      <WorkflowStep index="02" title="Analyze ATS" desc="Score, gaps, suggestions" />
      <WorkflowStep index="03" title="Refine in Chat" desc="Rewrite with Gemini" />
    </div>
  );
}

function WorkflowStep({ index, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2 py-1 text-[11px] font-semibold text-indigo-200">{index}</span>
      <div>
        <p className="text-xs font-semibold text-slate-100">{title}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="glow-slow absolute -top-28 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="glow-slower absolute top-12 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="glow-slow absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
    </div>
  );
}

function EmptyAnalysisState() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-300">
      <p className="font-semibold text-slate-100">No ATS result yet.</p>
      <p className="mt-1">Upload CV dan klik Scan Resume untuk mulai analisis.</p>
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-md ${isUser ? "bg-indigo-500/90 text-white" : "bg-slate-700/75 text-slate-100"}`}>
        <p className="mb-1 text-[10px] uppercase tracking-wide opacity-75">{isUser ? "You" : "Gemini"}</p>
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </div>
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

function InfoPill({ label, value, tone = "from-white/10 to-transparent" }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-gradient-to-b ${tone} px-2 py-2`}>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function ScanSkeleton() {
  return (
    <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
      <div className="skeleton h-20 rounded-xl" />
      <div className="skeleton h-24 rounded-xl" />
      <div className="skeleton h-16 rounded-xl" />
    </div>
  );
}
