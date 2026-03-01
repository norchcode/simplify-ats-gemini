"use client";

import { useMemo, useState } from "react";
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
        <Card className="bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">AI Resume Studio</p>
                <CardTitle className="mt-2 text-2xl sm:text-3xl">
                  Resume ATS Scanner <span className="text-indigo-300">+ Gemini Career Chat</span>
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm sm:text-base">
                  UI phase 2 dengan gaya komponen ala shadcn: lebih rapi, konsisten, dan mobile-friendly.
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

        <div className="mt-4 md:hidden">
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

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className={`${activeView !== "scan" ? "hidden md:block" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Step 1</Badge>
                <CardTitle>ATS Resume Scan</CardTitle>
              </div>
              <CardDescription>Upload CV + optional JD untuk matching yang lebih akurat.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="space-y-3">
                <label className="block text-sm text-slate-200">
                  Upload CV / Resume (PDF, DOCX, TXT)
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-white file:hover:bg-indigo-600"
                  />
                </label>

                <label className="block text-sm text-slate-200">
                  Job Description (opsional)
                  <Textarea
                    rows={6}
                    placeholder="Paste job description di sini..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-2"
                  />
                </label>

                <Button className="w-full" type="submit" disabled={scanLoading}>
                  {scanLoading ? "Scanning..." : "Scan Resume"}
                </Button>

                {scanError ? <p className="text-sm text-rose-400">{scanError}</p> : null}
              </form>

              {scanResult ? (
                <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">ATS Match Score</p>
                      <span className="text-base font-bold text-indigo-300">{score}/100</span>
                    </div>
                    <Progress value={score} />
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
                <div className="mt-5 rounded-xl border border-dashed border-slate-600/70 bg-slate-900/30 p-4 text-sm text-slate-300">
                  Belum ada hasil scan. Upload CV dulu, lalu klik <span className="font-semibold text-white">Scan Resume</span>.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${activeView !== "chat" ? "hidden md:block" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Step 2</Badge>
                <CardTitle>Gemini Career Chatbot</CardTitle>
              </div>
              <CardDescription>Minta rewrite bullet point, simulasi interview, atau strategi keyword ATS.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={chatLoading}
                  >
                    {prompt}
                  </Button>
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

              <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 p-2">
                <Input
                  type="text"
                  placeholder="Tulis pertanyaan kamu..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <Button type="submit" disabled={chatLoading}>
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

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute top-12 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
    </div>
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
