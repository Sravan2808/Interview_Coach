"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StartInterviewResponse = {
  first_message: string;
  conversation_history: { role: string; content: string }[];
};

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!topic.trim() || !difficulty) {
      setError("Enter an interview topic and choose a difficulty level.");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty }),
      });
      if (!response.ok) throw new Error("Interview start request failed");

      const data = (await response.json()) as StartInterviewResponse;
      const query = [
        `topic=${encodeURIComponent(topic.trim())}`,
        `difficulty=${encodeURIComponent(difficulty)}`,
        `firstMessage=${encodeURIComponent(data.first_message)}`,
        `conversationHistory=${encodeURIComponent(JSON.stringify(data.conversation_history))}`,
      ].join("&");
      router.push(`/interview?${query}`);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Can't connect to the interview API. Start the backend at http://localhost:8000 and try again."
          : "The interview could not be started. Please try again.",
      );
      setIsLoading(false);
    }
  }

  return (
    <main className="animate-fade-in relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-5 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-950 to-slate-950" />
      <div className="relative z-10 w-full max-w-xl">
        <header className="mb-8 text-center sm:mb-9">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-lg font-bold text-slate-200 shadow-lg shadow-black/20" aria-hidden="true">
            AI
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">AI Interview Coach</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400">
            Practice technical interviews with an AI-powered interviewer. Get real feedback. Improve fast.
          </p>
        </header>

        <Card className="p-5 sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="topic">Interview Topic</Label>
              <Input
                id="topic"
                name="topic"
                type="text"
                placeholder="e.g. Binary Trees, Sorting Algorithms, Dynamic Programming"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty" aria-label="Difficulty Level">
                  <SelectValue placeholder="Select a difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="rounded-md border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300" role="alert">
                {error}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Starting Interview..." : "Start Interview"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">Powered by AI. Built for learners.</p>
      </div>
    </main>
  );
}
