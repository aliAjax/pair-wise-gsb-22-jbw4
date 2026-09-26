// 页面 · 酒款作答区：每款酒答错后选错因、写线索。

import { useState } from "react";
import { CAUSES, causeLabel, WINES, type Wine } from "../data/wines";
import {
  canSubmitDiagnosis,
  DIAGNOSIS_STATUS_TEXT,
  openDiagnosisFor,
  openDrillFor,
  REQUIRED_STREAK,
  type BookState,
  type CauseKey,
} from "../domain/diagnosis";

interface BoardProps {
  book: BookState;
  student: string;
  onSubmit: (wineId: string, cause: CauseKey, clue: string) => void;
}

export default function WineBoard({ book, student, onSubmit }: BoardProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>酒款资料 · 学员作答</p>
          <h2>答错一款，记一笔错因</h2>
        </div>
        <span className="hint">当前学员：{student}</span>
      </div>
      <div className="wine-grid">
        {WINES.map((wine) => (
          <WineCard key={wine.id} wine={wine} book={book} student={student} onSubmit={onSubmit} />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  wine: Wine;
  book: BookState;
  student: string;
  onSubmit: (wineId: string, cause: CauseKey, clue: string) => void;
}

function WineCard({ wine, book, student, onSubmit }: CardProps) {
  const [editing, setEditing] = useState(false);
  const [cause, setCause] = useState<CauseKey | null>(null);
  const [clue, setClue] = useState("");

  const myDrill = openDrillFor(book, wine.id, student);
  const myDiag = openDiagnosisFor(book, wine.id, student);
  const submittable = canSubmitDiagnosis(book, wine.id, student);
  const related = book.diagnoses.filter((d) => d.wineId === wine.id && d.status !== "resolved");

  const submit = () => {
    if (!cause || !clue.trim()) return;
    onSubmit(wine.id, cause, clue);
    setEditing(false);
    setCause(null);
    setClue("");
  };

  const badge = statusBadge(myDrill?.status, myDiag?.status);

  return (
    <article className="wine-card">
      <header>
        <div>
          <h3>{wine.name}</h3>
          <p className="wine-meta">
            {wine.region} · {wine.vintage}
          </p>
        </div>
        {badge}
      </header>

      <dl className="wine-facts">
        <div>
          <dt>品种</dt>
          <dd>{wine.variety}</dd>
        </div>
        <div>
          <dt>结构</dt>
          <dd>{wine.structure}</dd>
        </div>
      </dl>

      <div className="aromas">
        {wine.aromas.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>

      <p className="trap">易混点：{wine.trap}</p>

      {related.length > 0 && (
        <div className="related">
          {related.map((d) => (
            <span key={d.id} className={`tag tag-${d.status}`}>
              {d.student} · {causeLabel(d.cause)} · {DIAGNOSIS_STATUS_TEXT[d.status]}
            </span>
          ))}
        </div>
      )}

      {submittable &&
        (editing ? (
          <div className="diag-form">
            <div className="cause-options">
              {CAUSES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.hint}
                  className={cause === c.key ? "cause-chip selected" : "cause-chip"}
                  onClick={() => setCause(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              placeholder="写下你记住的线索：当时闻到了什么、在哪里犹豫了……"
            />
            <div className="form-actions">
              <button
                className="primary-action"
                disabled={!cause || !clue.trim()}
                onClick={submit}
              >
                提交诊断
              </button>
              <button type="button" onClick={() => setEditing(false)}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="record-btn" onClick={() => setEditing(true)}>
            答错了，记一笔
          </button>
        ))}
    </article>
  );
}

function statusBadge(
  drillStatus: "active" | "paused" | "cleared" | undefined,
  diagStatus: "pending" | "confirmed" | "disputed" | "resolved" | undefined
) {
  if (drillStatus === "active") {
    return <span className="badge badge-drill">复练中 · 连对进度见名单（满 {REQUIRED_STREAK} 回出名单）</span>;
  }
  if (drillStatus === "paused") {
    return <span className="badge badge-disputed">待裁定 · 复练暂停</span>;
  }
  if (diagStatus === "pending") {
    return <span className="badge badge-pending">待讲师确认</span>;
  }
  if (diagStatus === "disputed") {
    return <span className="badge badge-disputed">待裁定</span>;
  }
  return null;
}
