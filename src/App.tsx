import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { AppState, ErrorCause } from "./types";
import {
  dueToday,
  practiceQueue,
  recordAttempt,
  resolveDispute,
  submitCause,
  confirmDiagnosis,
} from "./diagnosis";
import { clearSavedState, loadState, saveState } from "./storage";
import { todayISO } from "./viewHelpers";
import { PracticePage } from "./PracticePage";
import { InstructorPage } from "./InstructorPage";
import { RosterPage } from "./RosterPage";

type Tab = "practice" | "instructor" | "roster";

const project = {
  id: "hxwl-08",
  port: 5108,
  title: "盲品错因诊断本",
  subtitle:
    "答错后分清是品种、产区还是香气线索：学员自诊、讲师确认排期、连续答对两回才离开名单",
};

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <i className={tone} />
    </article>
  );
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>("practice");

  // 每次变更即保存，重开页面接着处理
  useEffect(() => {
    saveState(state);
  }, [state]);

  const now = () => new Date().toISOString();

  const handleAnswer = (p: {
    studentId: string;
    wineId: string;
    correct: boolean;
  }) =>
    setState((s) =>
      recordAttempt(s, { ...p, at: now() })
    );

  const handleSubmitCause = (p: {
    studentId: string;
    wineId: string;
    cause: ErrorCause;
    clue: string;
  }) =>
    setState((s) =>
      submitCause(s, { ...p, at: now() })
    );

  const handleConfirm = (p: {
    diagnosisId: string;
    cause: ErrorCause;
    date: string;
    note?: string;
  }) =>
    setState((s) =>
      confirmDiagnosis(s, { ...p, at: now() })
    );

  const handleResolve = (p: {
    diagnosisId: string;
    cause: ErrorCause;
    note: string;
    date: string;
  }) =>
    setState((s) =>
      resolveDispute(s, { ...p, at: now() })
    );

  const pendingCount = state.diagnoses.filter(
    (d) => d.status === "pending_review"
  ).length;
  const disputeCount = state.diagnoses.filter(
    (d) => d.status === "disputed"
  ).length;
  const queue = useMemo(() => practiceQueue(state), [state]);
  const due = useMemo(() => dueToday(state, todayISO()).length, [state]);
  const cleared = state.roster.filter((r) => r.status === "cleared").length;

  const tabs: { key: Tab; label: string; badge?: number; danger?: boolean }[] = [
    { key: "practice", label: "学员作答" },
    { key: "instructor", label: "讲师工作台", badge: pendingCount + disputeCount, danger: disputeCount > 0 },
    { key: "roster", label: "复练名单", badge: queue.length },
  ];

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">{project.id} · port {project.port}</p>
          <h1>{project.title}</h1>
          <p className="subtitle">{project.subtitle}</p>
        </div>
        <div className="stack-card">
          <span>模块划分</span>
          <strong>酒款资料 · 判定与排程 · 保存 · 页面</strong>
          <button
            className="reset-btn"
            onClick={() => {
              if (confirm("清空全部诊断与排程记录？")) {
                clearSavedState();
                setState(loadState());
              }
            }}
          >
            清空记录重开
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="待讲师确认" value={pendingCount} tone="status-watch" />
        <MetricCard label="待裁定分歧" value={disputeCount} tone="status-danger" />
        <MetricCard label="复练名单人数" value={queue.length} tone="status-watch" />
        <MetricCard label={`今日到期（已离开 ${cleared} 人）`} value={due} tone="status-ok" />
      </section>

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={t.danger ? "tab-badge danger" : "tab-badge"}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "practice" && (
        <PracticePage
          state={state}
          onAnswer={handleAnswer}
          onSubmitCause={handleSubmitCause}
        />
      )}
      {tab === "instructor" && (
        <InstructorPage state={state} onConfirm={handleConfirm} onResolve={handleResolve} />
      )}
      {tab === "roster" && <RosterPage state={state} />}
    </main>
  );
}

export default App;
