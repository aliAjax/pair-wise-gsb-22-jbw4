// 页面 · 组装：学员作答、讲师判定、复练排程与本地保存。

import { useEffect, useState } from "react";
import "./styles.css";
import { STUDENTS } from "./data/wines";
import {
  addStudent,
  adjudicate,
  confirmDiagnosis,
  emptyBook,
  recordDrillResult,
  stats,
  submitDiagnosis,
  type BookState,
  type CauseKey,
} from "./domain/diagnosis";
import { clearBook, initialBook, saveBook } from "./storage/persist";
import WineBoard from "./ui/WineBoard";
import InstructorDesk from "./ui/InstructorDesk";
import DrillBoard from "./ui/DrillBoard";
import DiagnosisLog from "./ui/DiagnosisLog";

function App() {
  const [book, setBook] = useState<BookState>(initialBook);
  const [student, setStudent] = useState<string>(book.students[0] ?? "");
  const [newName, setNewName] = useState("");

  // 每次变化都落盘，重开页面接着处理
  useEffect(() => {
    saveBook(book);
  }, [book]);

  const counts = stats(book);
  const metrics = [
    { label: "待确认诊断", value: counts.pending, cls: "status-watch" },
    { label: "待裁定分歧", value: counts.disputed, cls: "status-danger" },
    { label: "复练名单", value: counts.drilling, cls: "status-ok" },
    { label: "已出名单", value: counts.cleared, cls: "status-muted" },
  ];

  const handleSubmit = (wineId: string, cause: CauseKey, clue: string) =>
    setBook((b) => submitDiagnosis(b, { wineId, student, cause, clue }));

  const handleConfirm = (diagnosisId: string) =>
    setBook((b) => confirmDiagnosis(b, diagnosisId));

  const handleAdjudicate = (wineId: string, acceptedCause: CauseKey, verdict: string) =>
    setBook((b) => adjudicate(b, wineId, acceptedCause, verdict));

  const handleResult = (drillId: string, result: "hit" | "miss") =>
    setBook((b) => recordDrillResult(b, drillId, result));

  const handleAddStudent = () => {
    const name = newName.trim();
    if (!name) return;
    setBook((b) => addStudent(b, name));
    setStudent(name);
    setNewName("");
  };

  const handleReset = () => {
    if (!window.confirm("确定清空全部诊断与复练记录？此操作不可撤销。")) return;
    clearBook();
    const fresh = emptyBook(STUDENTS);
    setBook(fresh);
    setStudent(fresh.students[0] ?? "");
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-08 · 盲品复习</p>
          <h1>错因诊断本</h1>
          <p className="subtitle">
            答错一款酒，先选错因、写下线索；讲师确认后进入复练名单，连续答对两回才能离开名单。
            同款酒出现不同错因时先停在待裁定，由讲师写清取舍后再更新复练顺序。
          </p>
        </div>
        <div className="student-card">
          <span>当前学员</span>
          <select value={student} onChange={(e) => setStudent(e.target.value)}>
            {book.students.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="add-student">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
              placeholder="新增学员姓名"
            />
            <button onClick={handleAddStudent} disabled={!newName.trim()}>
              加入
            </button>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((m) => (
          <article key={m.label} className="metric-card">
            <span>{m.label}</span>
            <strong>{m.value}</strong>
            <i className={m.cls} />
          </article>
        ))}
      </section>

      <section className="flow-strip">
        <div>
          <b>1</b> 答错记一笔：选错因、写线索
        </div>
        <div>
          <b>2</b> 讲师确认后排入复练
        </div>
        <div>
          <b>3</b> 同款不同错因 → 待裁定，写清取舍
        </div>
        <div>
          <b>4</b> 连对两回，离开名单
        </div>
      </section>

      <WineBoard book={book} student={student} onSubmit={handleSubmit} />
      <InstructorDesk book={book} onConfirm={handleConfirm} onAdjudicate={handleAdjudicate} />
      <DrillBoard book={book} onResult={handleResult} />
      <DiagnosisLog book={book} />

      <footer className="footer-bar">
        <p>诊断与复练进度保存在本机浏览器，重开页面可继续处理。</p>
        <button onClick={handleReset}>清空重来</button>
      </footer>
    </main>
  );
}

export default App;
