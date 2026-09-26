// 作答台：选学员 → 选酒款作答 → 答错后选错因并写线索

import { useMemo, useState } from "react";
import type { AppState, ErrorCause } from "./types";
import { ERROR_CAUSES } from "./diagnosis";
import { formatDateTime, studentName, wineName } from "./viewHelpers";

interface Props {
  state: AppState;
  onAnswer: (p: { studentId: string; wineId: string; correct: boolean }) => void;
  onSubmitCause: (p: {
    studentId: string;
    wineId: string;
    cause: ErrorCause;
    clue: string;
  }) => void;
}

export function PracticePage({ state, onAnswer, onSubmitCause }: Props) {
  const [studentId, setStudentId] = useState(state.students[0]?.id ?? "");
  const [wineId, setWineId] = useState(state.wines[0]?.id ?? "");
  const [cause, setCause] = useState<ErrorCause>("variety");
  const [clue, setClue] = useState("");
  const [feedback, setFeedback] = useState<string>("");

  const student = state.students.find((s) => s.id === studentId);
  const wine = state.wines.find((w) => w.id === wineId);

  // 该学员对这款酒是否还有未交的错因（最近一次答错且无进行中诊断）
  const pendingCause = useMemo(() => {
    if (!studentId || !wineId) return false;
    const last = [...state.attempts]
      .filter((a) => a.studentId === studentId && a.wineId === wineId)
      .sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    if (!last || last.correct) return false;
    const open = state.diagnoses.find(
      (d) =>
        d.wineId === wineId &&
        d.status !== "confirmed" &&
        d.picks.some((p) => p.studentId === studentId)
    );
    return !open;
  }, [state, studentId, wineId]);

  const myOpenDiagnosis = state.diagnoses.find(
    (d) =>
      d.wineId === wineId &&
      d.status !== "confirmed" &&
      d.picks.some((p) => p.studentId === studentId)
  );

  const handleAnswer = (correct: boolean) => {
    onAnswer({ studentId, wineId, correct });
    if (correct) {
      setFeedback("记录为答对，连续答对计数 +1。");
    } else {
      setFeedback("记录为答错，请在下方选择错因并写下当时的线索。");
    }
  };

  const handleSubmit = () => {
    if (!clue.trim()) {
      setFeedback("请先写下判断时依赖的线索。");
      return;
    }
    onSubmitCause({ studentId, wineId, cause, clue: clue.trim() });
    setClue("");
    setFeedback("错因已提交，等待讲师确认。");
  };

  const recent = state.attempts
    .filter((a) => a.studentId === studentId)
    .slice(-6)
    .reverse();

  return (
    <div className="practice-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>盲品作答</p>
            <h2>作答台</h2>
          </div>
        </div>

        <div className="select-row">
          <label>
            <span>学员</span>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setFeedback("");
              }}
            >
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>酒款</span>
            <select
              value={wineId}
              onChange={(e) => {
                setWineId(e.target.value);
                setFeedback("");
              }}
            >
              {state.wines.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.region}
                </option>
              ))}
            </select>
          </label>
        </div>

        {wine && (
          <div className="wine-facts">
            <span className="tag">{wine.category}</span>
            <span>产区：{wine.region}</span>
            <span>品种：{wine.variety}</span>
            <span>
              酸/单宁/酒体：{wine.acidity} · {wine.tannin} · {wine.body}
            </span>
            <span className="aroma-line">
              参考香气：{wine.aromas.join("、")}
            </span>
          </div>
        )}

        <div className="answer-buttons">
          <button className="ok-btn" onClick={() => handleAnswer(true)}>
            这次答对了
          </button>
          <button className="bad-btn" onClick={() => handleAnswer(false)}>
            这次答错了
          </button>
        </div>

        {feedback && <p className="feedback">{feedback}</p>}

        {student && (
          <p className="streak-hint">
            {student.name} 当前连续答对：
            <strong>
              {state.roster.find(
                (r) => r.id === `${studentId}:${wineId}`
              )?.streak ?? 0}
            </strong>
            / 2（连续两回答对才离开复练名单）
          </p>
        )}
      </section>

      <section className="panel cause-panel">
        <p className="eyebrow">错因诊断</p>
        <h2>错在哪一步？</h2>

        {pendingCause ? (
          <>
            <div className="cause-options">
              {ERROR_CAUSES.map((c) => (
                <button
                  key={c.value}
                  className={cause === c.value ? "cause-option selected" : "cause-option"}
                  onClick={() => setCause(c.value)}
                  type="button"
                >
                  <strong>{c.label}</strong>
                  <span>{c.hint}</span>
                </button>
              ))}
            </div>
            <label className="clue-input">
              <span>判断时依赖的线索（必填）</span>
              <textarea
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="例如：闻到明显香草和椰子，就猜了美国橡木的新世界酒……"
                rows={3}
              />
            </label>
            <button className="primary-action" onClick={handleSubmit}>
              提交错因与线索
            </button>
          </>
        ) : myOpenDiagnosis ? (
          <p className="status-note">
            错因已提交，状态：
            {myOpenDiagnosis.status === "disputed"
              ? "与他人选择不同，记录已停在待裁定，等讲师写清取舍。"
              : "待讲师确认。"}
          </p>
        ) : (
          <p className="status-note muted">
            答错后在此选择错因（品种 / 产区 / 香气线索）并写下线索。
          </p>
        )}

        <div className="recent-list">
          <h3>最近作答</h3>
          {recent.length === 0 && <p className="muted">暂无记录</p>}
          {recent.map((a) => (
            <div key={a.id} className="recent-row">
              <span className={a.correct ? "dot ok" : "dot bad"} />
              <span>{wineName(state, a.wineId)}</span>
              <span className="muted">{formatDateTime(a.at)}</span>
              <strong className={a.correct ? "ok-text" : "bad-text"}>
                {a.correct ? "对" : "错"}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
