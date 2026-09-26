// 讲师工作台：确认错因并安排复练；分歧时写清取舍再裁定

import { useState } from "react";
import type { AppState, Diagnosis, ErrorCause } from "./types";
import { ERROR_CAUSES, causeLabel } from "./diagnosis";
import { formatDateTime, studentName, todayISO, wineName } from "./viewHelpers";

interface Props {
  state: AppState;
  onConfirm: (p: {
    diagnosisId: string;
    cause: ErrorCause;
    date: string;
    note?: string;
  }) => void;
  onResolve: (p: {
    diagnosisId: string;
    cause: ErrorCause;
    note: string;
    date: string;
  }) => void;
}

export function InstructorPage({ state, onConfirm, onResolve }: Props) {
  const pending = state.diagnoses.filter(
    (d) => d.status === "pending_review"
  );
  const disputed = state.diagnoses.filter((d) => d.status === "disputed");
  const confirmed = state.diagnoses
    .filter((d) => d.status === "confirmed")
    .slice(-8)
    .reverse();

  return (
    <div className="instructor-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>待裁定（{disputed.length}）</p>
            <h2>错因分歧</h2>
          </div>
        </div>
        <p className="muted rule-note">
          两人对同款酒选择了不同错因，记录先停在这里；讲师写清取舍理由后再更新复练顺序。
        </p>
        {disputed.length === 0 && <p className="muted">当前没有待裁定记录。</p>}
        <div className="card-list">
          {disputed.map((d) => (
            <DisputeCard key={d.id} state={state} diagnosis={d} onResolve={onResolve} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>待确认（{pending.length}）</p>
            <h2>学员错因诊断</h2>
          </div>
        </div>
        {pending.length === 0 && <p className="muted">当前没有待确认记录。</p>}
        <div className="card-list">
          {pending.map((d) => (
            <ReviewCard key={d.id} state={state} diagnosis={d} onConfirm={onConfirm} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>已处理</p>
            <h2>最近确认记录</h2>
          </div>
        </div>
        <div className="card-list">
          {confirmed.length === 0 && <p className="muted">暂无</p>}
          {confirmed.map((d) => (
            <article key={d.id} className="diag-card done">
              <header>
                <strong>{wineName(state, d.wineId)}</strong>
                <span className="tag">最终错因：{d.finalCause && causeLabel(d.finalCause)}</span>
              </header>
              <p className="muted">
                复练排期：{d.scheduledFor} · 确认时间：
                {d.reviewedAt ? formatDateTime(d.reviewedAt) : "—"}
              </p>
              {d.rulingNote && <p className="ruling">讲师取舍：{d.rulingNote}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PickList({ state, diagnosis }: { state: AppState; diagnosis: Diagnosis }) {
  return (
    <div className="pick-list">
      {diagnosis.picks.map((p) => (
        <div key={p.id} className="pick-row">
          <span className="cause-badge">{causeLabel(p.cause)}</span>
          <strong>{studentName(state, p.studentId)}</strong>
          <span className="clue-text">“{p.clue}”</span>
          <span className="muted">{formatDateTime(p.at)}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({
  state,
  diagnosis,
  onConfirm,
}: {
  state: AppState;
  diagnosis: Diagnosis;
  onConfirm: Props["onConfirm"];
}) {
  const [cause, setCause] = useState<ErrorCause>(diagnosis.picks[0]?.cause ?? "variety");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  return (
    <article className="diag-card">
      <header>
        <strong>{wineName(state, diagnosis.wineId)}</strong>
        <span className="tag tag-wait">待确认</span>
      </header>
      <PickList state={state} diagnosis={diagnosis} />
      <div className="review-form">
        <label>
          <span>确认错因</span>
          <select value={cause} onChange={(e) => setCause(e.target.value as ErrorCause)}>
            {ERROR_CAUSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} · {c.hint}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>下一次复练日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <label className="full-line">
        <span>补充说明（可选）</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="给学员的复练提示"
        />
      </label>
      <button
        className="primary-action"
        onClick={() =>
          onConfirm({
            diagnosisId: diagnosis.id,
            cause,
            date,
            note: note.trim() || undefined,
          })
        }
      >
        确认并安排复练
      </button>
    </article>
  );
}

function DisputeCard({
  state,
  diagnosis,
  onResolve,
}: {
  state: AppState;
  diagnosis: Diagnosis;
  onResolve: Props["onResolve"];
}) {
  const causes = Array.from(new Set(diagnosis.picks.map((p) => p.cause)));
  const [cause, setCause] = useState<ErrorCause>(causes[0] ?? "variety");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  const submit = () => {
    if (!note.trim()) {
      setError("必须写清取舍：采纳哪一种错因、另一种为什么不对。");
      return;
    }
    setError("");
    onResolve({ diagnosisId: diagnosis.id, cause, note: note.trim(), date });
  };

  return (
    <article className="diag-card disputed">
      <header>
        <strong>{wineName(state, diagnosis.wineId)}</strong>
        <span className="tag tag-danger">待裁定</span>
      </header>
      <PickList state={state} diagnosis={diagnosis} />
      <div className="review-form">
        <label>
          <span>采纳的错因</span>
          <select value={cause} onChange={(e) => setCause(e.target.value as ErrorCause)}>
            {causes.map((c) => (
              <option key={c} value={c}>
                {causeLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>下一次复练日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <label className="full-line">
        <span>取舍说明（必填）</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如：香草/椰子来自美国橡木桶，但黑醋栗与高单宁更支持赤霞珠，香气线索应服务于品种判断……"
        />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button className="danger-action" onClick={submit}>
        写清取舍并更新复练顺序
      </button>
    </article>
  );
}
