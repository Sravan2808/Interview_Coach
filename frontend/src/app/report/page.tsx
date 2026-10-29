"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ConversationMessage = {
  role: string;
  content: string;
};

type InterviewReport = {
  score: number;
  strengths: string;
  weaknesses: string;
  revision_areas: string;
  verdict: string;
  recommendation: string;
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

export default function ReportPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const generateReport = useCallback(
    async (
      reportTopic: string,
      reportDifficulty: string,
      history: ConversationMessage[],
    ) => {
      setIsLoading(true);
      setError("");
      setReport(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/report/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: reportTopic,
            difficulty: reportDifficulty,
            conversation_history: history,
          }),
        });
        if (!response.ok) throw new Error("Report request failed");
        setReport((await response.json()) as InterviewReport);
      } catch (requestError) {
        setError(
          requestError instanceof TypeError
            ? "Can't connect to the report API. Check that the backend is running at http://localhost:8000."
            : "We couldn't generate your report. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const reportTopic = readEncodedParameter("topic");
    const reportDifficulty = readEncodedParameter("difficulty");
    const historyValue = readEncodedParameter("conversationHistory");
    try {
      const parsed: unknown = JSON.parse(historyValue);
      if (!Array.isArray(parsed)) throw new Error("Conversation history must be a list");
      const history = parsed.filter(
        (item): item is ConversationMessage =>
          typeof item === "object" &&
          item !== null &&
          "role" in item &&
          "content" in item &&
          typeof item.role === "string" &&
          typeof item.content === "string",
      );
      setTopic(reportTopic);
      setDifficulty(reportDifficulty);
      setConversationHistory(history);
      void generateReport(reportTopic, reportDifficulty, history);
    } catch {
      setError("The interview conversation could not be loaded. Please start a new interview.");
      setIsLoading(false);
    }
  }, [generateReport]);

  const score = report?.score ?? 0;
  const scoreColor = score >= 70 ? "text-emerald-700" : score >= 50 ? "text-amber-700" : "text-rose-700";
  const passed = report?.recommendation?.toLowerCase() === "pass";

  if (isLoading) {
    return (
      <main className="animate-fade-in min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-12" role="status" aria-live="polite">
        <div className="mx-auto w-full max-w-[800px] rounded-3xl bg-slate-100 p-5 text-slate-900 shadow-2xl shadow-black/30 sm:p-8 md:p-10">
          <div className="mb-8 flex flex-col items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-9 w-64 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:justify-center sm:gap-8">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-4 rounded-xl border border-slate-200 border-l-4 border-l-slate-300 bg-white p-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
          <span className="sr-only">Generating your report...</span>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="animate-fade-in flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <Card className="w-full max-w-md border-slate-200 bg-white text-slate-900 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Report unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-slate-600" role="alert">
              {error || "We couldn't generate your report. Please try again."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void generateReport(topic, difficulty, conversationHistory)}>
                  <RefreshCw aria-hidden="true" /> Retry
                </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="animate-fade-in min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-12">
      <div className="mx-auto w-full max-w-[800px] rounded-3xl bg-slate-100 p-5 text-slate-900 shadow-2xl shadow-black/30 sm:p-8 md:p-10">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Interview Complete</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="bg-slate-200 text-slate-800 hover:bg-slate-200">{topic}</Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-700">{difficulty}</Badge>
          </div>
        </header>

        <section className="mb-6 flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:gap-8" aria-label="Interview score and recommendation">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your score</p>
            <p className={`mt-1 text-5xl font-bold tracking-tight ${scoreColor}`}>
              {score}<span className="text-2xl font-medium text-slate-400"> / 100</span>
            </p>
          </div>
          <div className="hidden h-14 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <Badge className={`px-5 py-2 text-sm font-bold tracking-wider ${passed ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-600" : "border-transparent bg-rose-600 text-white hover:bg-rose-600"}`}>
            {passed ? "PASS" : "FAIL"}
          </Badge>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Interview evaluation">
          <Card className="border-slate-200 border-l-4 border-l-emerald-500 bg-white shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-slate-900">Strengths</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.strengths}</p></CardContent>
          </Card>
          <Card className="border-slate-200 border-l-4 border-l-amber-500 bg-white shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-slate-900">Areas for Improvement</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.weaknesses}</p></CardContent>
          </Card>
          <Card className="border-slate-200 border-l-4 border-l-blue-500 bg-white shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-slate-900">Topics to Revise</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.revision_areas}</p></CardContent>
          </Card>
          <Card className="border-slate-200 border-l-4 border-l-slate-400 bg-white shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-slate-900">Interviewer's Verdict</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.verdict}</p></CardContent>
          </Card>
        </section>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push("/")} className="px-6">
            Start New Interview
          </Button>
        </div>
      </div>
    </main>
  );
}
