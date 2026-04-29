"use client";

import { useEffect, useState } from "react";
import { featureApi, type InternLessonResponse, type InternModuleSummary, type InternQuizResponse } from "@/lib/api";
import { BookOpen, CheckSquare, Scale, ClipboardList, HelpCircle, CheckCircle, XCircle, Loader2, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/api";

type Tab = "lesson" | "quiz";

export default function InternTrainingPage() {
  const [modules, setModules] = useState<InternModuleSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [lesson, setLesson] = useState<InternLessonResponse | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<InternQuizResponse | null>(null);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [tab, setTab] = useState<Tab>("lesson");

  useEffect(() => {
    featureApi.internModules()
      .then((res) => {
        const mods = res.data.modules ?? [];
        setModules(mods);
        if (mods[0]) setSelected(mods[0].module_id);
      })
      .catch(() => toast.error("Failed to load modules"))
      .finally(() => setLoadingModules(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingLesson(true);
    setLesson(null);
    setQuizResult(null);
    setTab("lesson");
    featureApi.internLesson({ module_id: selected })
      .then((res) => {
        setLesson(res.data);
        setAnswers(new Array(res.data.quiz.length).fill(-1));
      })
      .catch((err: any) => toast.error(getApiError(err, "Failed to load lesson")))
      .finally(() => setLoadingLesson(false));
  }, [selected]);

  async function handleQuizSubmit() {
    if (!selected || answers.some((a) => a === -1)) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    setLoadingQuiz(true);
    try {
      const { data } = await featureApi.internQuiz({ module_id: selected, answers });
      setQuizResult(data);
    } catch (err: any) {
      toast.error(getApiError(err, "Failed to grade quiz"));
    } finally {
      setLoadingQuiz(false);
    }
  }

  const scorePercent = quizResult ? Math.round((quizResult.score / quizResult.total_questions) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Intern Training Academy</h1>
        <p className="text-sm text-muted-fg mt-1">
          Structured legal modules with checklists, key cases, and self-assessment quizzes.
        </p>
      </div>

      {loadingModules ? (
        <div className="flex items-center gap-2 text-sm text-muted-fg"><Loader2 className="w-4 h-4 animate-spin" /> Loading modules...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <button
              key={mod.module_id}
              onClick={() => setSelected(mod.module_id)}
              className={`text-left px-4 py-3.5 rounded-xl border transition-all ${selected === mod.module_id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-surface hover:border-primary/30"}`}
            >
              <div className="font-semibold text-sm">{mod.title}</div>
              <p className="text-xs text-muted-fg mt-1 line-clamp-2">{mod.summary}</p>
            </button>
          ))}
        </div>
      )}

      {loadingLesson && (
        <div className="flex items-center gap-2 text-sm text-muted-fg animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading lesson...
        </div>
      )}

      {lesson && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-border">
            {(["lesson", "quiz"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-fg hover:text-foreground"}`}
              >
                {t === "lesson" ? "Lesson" : `Quiz (${lesson.quiz.length}Q)`}
              </button>
            ))}
          </div>

          {tab === "lesson" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-lg font-bold mb-1">{lesson.title}</h2>
                <p className="text-sm text-muted-fg leading-relaxed">{lesson.summary}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 font-semibold mb-3">
                  <CheckSquare className="w-4 h-4 text-primary" /> Study Checklist
                </div>
                <ul className="space-y-2">
                  {lesson.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded border border-border mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {lesson.key_cases.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <Scale className="w-4 h-4 text-primary" /> Key Cases & Principles
                  </div>
                  <div className="space-y-3">
                    {lesson.key_cases.map((kc: any, i) => (
                      <div key={i} className="pl-4 border-l-2 border-primary/40">
                        <div className="text-sm font-medium">{typeof kc === "string" ? kc : kc.case}</div>
                        {typeof kc !== "string" && kc.principle && (
                          <p className="text-xs text-muted-fg mt-0.5">{kc.principle}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lesson.sample_tasks.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <ClipboardList className="w-4 h-4 text-primary" /> Practice Tasks
                  </div>
                  <ul className="space-y-2">
                    {lesson.sample_tasks.map((task, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setTab("quiz")}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition"
              >
                Take Quiz →
              </button>
            </div>
          )}

          {tab === "quiz" && (
            <div className="space-y-5">
              {quizResult ? (
                <div className="rounded-2xl border border-border bg-surface p-6 text-center space-y-4">
                  <Trophy className={`w-12 h-12 mx-auto ${scorePercent >= 80 ? "text-amber-500" : scorePercent >= 60 ? "text-blue-500" : "text-muted-fg"}`} />
                  <div>
                    <div className="text-4xl font-bold">{quizResult.score}<span className="text-xl text-muted-fg">/{quizResult.total_questions}</span></div>
                    <div className={`text-sm font-semibold mt-1 ${scorePercent >= 80 ? "text-emerald-600" : scorePercent >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {scorePercent >= 80 ? "Excellent!" : scorePercent >= 60 ? "Good effort!" : "Needs more study"}
                    </div>
                  </div>
                  <div className="space-y-3 text-left">
                    {lesson.quiz.map((q, i) => {
                      const isCorrect = quizResult.correct_indices.includes(i);
                      return (
                        <div key={i} className={`rounded-xl p-4 border ${isCorrect ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10" : "border-red-200 bg-red-50 dark:bg-red-900/10"}`}>
                          <div className="flex items-start gap-2">
                            {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                            <div>
                              <div className="text-sm font-medium">{q.question}</div>
                              {quizResult.explanations[i] && (
                                <p className="text-xs text-muted-fg mt-1">{quizResult.explanations[i]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { setQuizResult(null); setAnswers(new Array(lesson.quiz.length).fill(-1)); }}
                    className="px-6 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface transition"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <>
                  {lesson.quiz.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold">{q.question}</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {q.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${answers[qIdx] === oIdx ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-border/30"}`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${answers[qIdx] === oIdx ? "border-primary bg-primary" : "border-muted-fg"}`} />
                            <input type="radio" name={`q-${qIdx}`} className="hidden" checked={answers[qIdx] === oIdx} onChange={() => {
                              const next = [...answers]; next[qIdx] = oIdx; setAnswers(next);
                            }} />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={loadingQuiz}
                    className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loadingQuiz ? <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</> : "Submit Answers"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
