// 页面 · 诊断档案：全部错因记录与讲师取舍。

import { causeLabel, wineById } from "../data/wines";
import { DIAGNOSIS_STATUS_TEXT, type BookState } from "../domain/diagnosis";

const timeFmt = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function DiagnosisLog({ book }: { book: BookState }) {
  const rows = [...book.diagnoses].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>诊断档案</p>
          <h2>错因记录</h2>
        </div>
        <span className="hint">记录保存在本机，重开页面接着处理</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">还没有诊断记录。</p>
      ) : (
        <ul className="log-list">
          {rows.map((d) => (
            <li key={d.id}>
              <span className="log-time">{timeFmt.format(d.createdAt)}</span>
              <div>
                <strong>{d.student}</strong> · {wineById(d.wineId)?.name ?? d.wineId} ·{" "}
                {causeLabel(d.cause)}
                <span className={`tag tag-${d.status}`}>
                  {DIAGNOSIS_STATUS_TEXT[d.status]}
                  {d.status === "resolved" ? (d.accepted ? " · 采纳" : " · 未采纳") : ""}
                </span>
                <p className="clue">“{d.clue}”</p>
                {d.verdict && <p className="verdict">讲师取舍：{d.verdict}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
