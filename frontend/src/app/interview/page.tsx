"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type HistoryMessage = {
  role: string;
  content: string;
};

type AnswerResponse = {
  ai_message: string;
  is_complete: boolean;
  conversation_history: HistoryMessage[];
};

function readEncodedParameter(name: string): string {
  const query = window.location.search.slice(1);
  const pair = query.split("&").find((part) => part.split("=", 1)[0] === name);
  if (!pair) return "";
  const encodedValue = pair.slice(pair.indexOf("=") + 1).replace(/\+/g, " ");
  try {
    return decodeURIComponent(encodedValue);
  } catch {
    return encodedValue;
  }
}

export default function InterviewPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<HistoryMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialTopic = readEncodedParameter("topic");
    const initialDifficulty = readEncodedParameter("difficulty");
    const firstMessage = readEncodedParameter("firstMessage");
    const historyParam = readEncodedParameter("conversationHistory");

    let parsedHistory: HistoryMessage[] = [];
    if (historyParam) {
      try {
        const parsed: unknown = JSON.parse(historyParam);
        if (Array.isArray(parsed)) {
          parsedHistory = parsed.filter(
            (item): item is HistoryMessage =>
              typeof item === "object" &&
              item !== null &&
              "role" in item &&
              "content" in item &&
              typeof item.role === "string" &&
              typeof item.content === "string",
          );
        }
      } catch {
        parsedHistory = [];
      }
    }

    setTopic(initialTopic);
    setDifficulty(initialDifficulty);
    setMessages([{ role: "assistant", content: firstMessage }]);
    setConversationHistory(parsedHistory);
    setIsReady(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentInput.trim() || isLoading || !isReady) return;

    const answer = currentInput;
    setError("");
    setMessages((current) => [...current, { role: "user", content: answer }]);
    setCurrentInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/interview/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          user_answer: answer,
          conversation_history: conversationHistory,
        }),
      });
      if (!response.ok) throw new Error("Interview answer request failed");

      const data = (await response.json()) as AnswerResponse;
      setMessages((current) => [...current, { role: "assistant", content: data.ai_message }]);
      setConversationHistory(data.conversation_history);

      if (data.is_complete) {
        const query = [
          `topic=${encodeURIComponent(topic)}`,
          `difficulty=${encodeURIComponent(difficulty)}`,
          `conversationHistory=${encodeURIComponent(JSON.stringify(data.conversation_history))}`,
        ].join("&");
        router.push(`/report?${query}`);
      }
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      setCurrentInput(answer);
      setError(
        requestError instanceof TypeError
          ? "Can't connect to the interview API. Check that the backend is running at http://localhost:8000."
          : "Your answer could not be submitted. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="animate-fade-in flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex shrink-0 flex-col items-start justify-between gap-3 border-b sm:flex-row sm:items-center sm:gap-4 border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="secondary" className="max-w-full truncate bg-slate-800 text-slate-100 hover:bg-slate-800">
            {topic || "Interview Topic"}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            {difficulty || "Difficulty"}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400 sm:text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Interview in progress
        </div>
      </header>

      <section
        className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-6 overflow-y-auto overscroll-contain scroll-smooth px-4 py-5 sm:px-8 sm:py-8"
        aria-label="Interview conversation"
        aria-live="polite"
      >
        {messages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          return (
            <div
              key={`${message.role}-${index}`}
              className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[88%] sm:max-w-[76%] ${isAssistant ? "items-start" : "items-end"} flex flex-col`}>
                <span className="mb-2 px-1 text-xs font-medium text-slate-400">
                  {isAssistant ? "Interviewer" : "You"}
                </span>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:px-5 sm:py-4 ${
                    isAssistant
                      ? "rounded-tl-md border border-slate-800 bg-slate-900 text-slate-100"
                      : "rounded-tr-md bg-blue-600 text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start" aria-label="Interviewer is preparing a response">
            <div className="rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </section>

      <footer className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <Textarea
            value={currentInput}
            onChange={(event) => setCurrentInput(event.target.value)}
            placeholder="Type your answer here..."
            aria-label="Your answer"
            disabled={isLoading || !isReady}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="min-h-[52px] max-h-40 resize-none border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-slate-500 sm:resize-y"
          />
          <Button type="submit" disabled={isLoading || !isReady} className="h-[52px] shrink-0 px-4 sm:px-6">
            {isLoading ? "AI is thinking..." : "Submit Answer"}
          </Button>
        </form>
        {error && (
          <p className="mx-auto mt-3 w-full max-w-4xl text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
      </footer>
    </main>
  );
}
