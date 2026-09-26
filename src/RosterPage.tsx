// 复练名单：按排期排序；连续答对两回后离开名单

import type { AppState } from "./types";
import { practiceQueue, dueToday, STREAK_GOAL } from "./diagnosis";
import { studentName, todayISO, wineName } from "./viewHelpers";

export function RosterPage({ state }: { state: AppState }) {
  const queue = practiceQueue(state);
  const due = new Set(dueToday(state, todayISO()).map((r) => r.id));
  const cleared = state.roster.filter((r) => r.status === "cleared");

  return (
    <div className="instructor-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>按排期日期升序</p>
            <h2>复练名单（{queue.length}）</h2>
          </div>
        </div>
        <p className="muted rule-note">
          讲师确认/裁定后写入下次复练日期；连续答对 {STREAK_GOAL}{" "}
          回自动离开名单。
        </p>

        {queue.length === 0 && <p className="muted">名单为空，没有待复练项目。</p>}

        <div className="roster-table">
          {queue.map((r, i) => {
            const blocked = !!state.diagnoses.find(
              (d) =>
                d.id === r.openDiagnosisId && d.status !== "confirmed"
            );
            return (
              <div key={r.id} className="roster-row">
                <span className="queue-no">{i + 1}</span>
                <div className="roster-main">
                  <strong>{studentName(state, r.studentId)}</strong>
                  <span>×</span>
                  <strong>{wineName(state, r.wineId)}</strong>
                  <div className="streak-pips">
                    {[0, 1].map((n) => (
                      <i
                        key={n}
                        className={n < r.streak ? "pip filled" : "pip"}
                      />
                    ))}
                    <span className="muted">
                      连对 {r.streak}/{STREAK_GOAL}
                    </span>
                  </div>
                </div>
                <div className="roster-meta">
                  {blocked ? (
                    <span className="tag tag-danger">
                      {state.diagnoses.find(
                        (d) => d.id === r.openDiagnosisId
                      )?.status === "disputed"
                        ? "待裁定，排期暂停"
                        : "待讲师确认"}
                    </span>
                  ) : r.nextPracticeAt ? (
                    <span className={due.has(r.id) ? "tag tag-now" : "tag"}>
                      {due.has(r.id) ? "今天该练 · " : "复练 · "}
                      {r.nextPracticeAt}
                    </span>
                  ) : (
                    <span className="tag tag-wait">等讲师排期</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>连续答对两回</p>
            <h2>已离开名单（{cleared.length}）</h2>
          </div>
        </div>
        {cleared.length === 0 && (
          <p className="muted">还没有学员达成连续两回答对。</p>
        )}
        <div className="chips">
          {cleared.map((r) => (
            <span key={r.id}>
              {studentName(state, r.studentId)} · {wineName(state, r.wineId)} ✓✓
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
