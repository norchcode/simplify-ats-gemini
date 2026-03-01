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

export default function MobilePage() {
  const [activeView, setActiveView] = useState("scan");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);

  const [messages, setMessages] = useState([initialBotMessage]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatLoading]);

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

      const res = await fetch("/api/ats-scan", { method: "POST", body: formData });
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
      const botText = res.ok ? data.result || "Sorry, no response received." : data.error || "Failed to get response from server.";
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090a0f] text-slate-100 pb-20">
      <div className="relative mx-auto w-full max-w-xl px-4 py-4">
        <Card className="glass-dark border-orange-200/10">
          <CardHeader className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/80">AI Career Studio • Mobile</p>
            <CardTitle className="text-xl">Resume ATS Scanner + Gemini Career Chat</CardTitle>
            <CardDescription className="text-slate-300">Upload CV, cek ATS score, lalu ngobrol dengan AI buat dapetin perbaikan yang actionable.</CardDescription>
          </CardHeader>
        </Card>

        <div className="mt-4">
          <Tabs>
            <TabsList>
              <TabsTrigger type="button" active={activeView === "scan"} onClick={() => setActiveView("scan")}>ATS Scan</TabsTrigger>
              <TabsTrigger type="button" active={activeView === "chat"} onClick={() => setActiveView("chat")}>Chatbot</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeView === "scan" ? (
          <Card className="glass-dark mt-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500/20 text-orange-100">Step 1</Badge>
                <CardTitle>ATS Resume Scan</CardTitle>
              </div>
              <CardDescription className="text-slate-300">Upload CV kamu, lalu bandingkan dengan job description biar ATS score lebih akurat.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="space-y-4">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />

                <Button type="button" className="btn-accent w-full" onClick={() => fileInputRef.current?.click()}>
                  {resumeFile ? "Change Resume File" : "Choose Resume File"}
                </Button>

                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                  {resumeFile ? `Selected: ${resumeFile.name}` : "No file selected yet"}
                </div>

                <label className="block text-sm text-slate-200">
                  Job Description (opsional tapi disarankan)
                  <Textarea
                    rows={5}
                    placeholder="Paste job description di sini untuk ATS matching yang lebih akurat..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-2"
                  />
                </label>

                <Button className="btn-accent h-11 w-full" type="submit" disabled={scanLoading}>
                  {scanLoading ? "Scanning..." : "Scan Resume"}
                </Button>

                {scanError ? <p className="text-sm text-rose-400">{scanError}</p> : null}
              </form>

              {scanResult ? (
                <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">ATS Match Score</p>
                      <p className="text-lg font-bold text-orange-300">{score}/100</p>
                    </div>
                    <Progress value={score} />
                  </div>
                  <div className="rounded-xl bg-orange-500/10 p-3 text-sm text-slate-100">{scanResult.summary}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-dark mt-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500/20 text-orange-100">Step 2</Badge>
                <CardTitle>Gemini Career Chatbot</CardTitle>
              </div>
              <CardDescription className="text-slate-300">Lanjut ngobrol: minta rewrite bullet point, mock interview, atau strategi keyword ATS.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button key={prompt} type="button" variant="outline" size="sm" className="rounded-full border-orange-300/25 bg-orange-500/5" onClick={() => sendChatMessage(prompt)} disabled={chatLoading}>
                    {prompt}
                  </Button>
                ))}
              </div>

              <div className="chat-scroll h-[52vh] overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-orange-500/85 text-white" : "bg-slate-700/75 text-slate-100"}`}>
                      <p className="mb-1 text-[10px] uppercase tracking-wide opacity-75">{msg.role === "user" ? "You" : "Gemini"}</p>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading ? <p className="text-xs text-slate-300">Gemini is thinking...</p> : null}
                <div ref={chatBottomRef} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <form onSubmit={handleSendChat} className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0a0d14]/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2">
          <Input
            type="text"
            placeholder="Tulis pertanyaan kamu..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
          />
          <Button type="submit" className="btn-accent" disabled={chatLoading}>Send</Button>
        </div>
      </form>
    </main>
  );
}
