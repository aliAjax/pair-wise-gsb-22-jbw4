// 页面 · 讲师工作台：确认诊断、裁定分歧。

import { useState } from "react";
import { CAUSES, causeLabel, wineById } from "../data/wines";
import {
  disputedGroups,
  pendingDiagnoses,
  type BookState,
  type CauseKey,
  type Diagnosis,
} from "../domain/diagnosis";

interface DeskProps {
  book: BookState;
  onConfirm: (diagnosisId: string) => void;
  onAdjudicate: (wineId: string, acceptedCause: CauseKey, verdict: string) => void;
}

export default function InstructorDesk({ book, onConfirm, onAdjudicate }: DeskProps) {
  const pending = pendingDiagnoses(book);
  const disputes = disputedGroups(book);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>判定与排程 · 讲师操作</p>
          <h2>讲师工作台</h2>
        </div>
        <span className="hint">确认后排入复练；分歧写清取舍再更新顺序</span>
      </div>

      <div className="desk-grid">
        <div>
          <h3 className="desk-title">
            待确认 <em>{pending.length}</em>
          </h3>
          {pending.length === 0 ? (
            <p className="empty">没有待确认的诊断。</p>
          ) : (
            <ul className="desk-list">
              {pending.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.student}</strong> · {wineById(d.wineId)?.name ?? d.wineId}
                    <span className="tag">{causeLabel(d.cause)}</span>
                    <p className="clue">“{d.clue}”</p>
                  </div>
                  <button className="primary-action" onClick={() => onConfirm(d.id)}>
                    确认并排入复练
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="desk-title">
            待裁定 <em>{disputes.length}</em>
          </h3>
          {disputes.length === 0 ? (
            <p className="empty">同款酒暂时没有出现不同错因。</p>
          ) : (
            disputes.map((g) => (
              <DisputeCard
                key={g.wineId}
                wineId={g.wineId}
                entries={g.entries}
                onAdjudicate={onAdjudicate}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

interface DisputeProps {
  wineId: string;
  entries: Diagnosis[];
  onAdjudicate: (wineId: string, acceptedCause: CauseKey, verdict: string) => void;
}

function DisputeCard({ wineId, entries, onAdjudicate }: DisputeProps) {
  const wine = wineById(wineId);
  const [accepted, setAccepted] = useState<CauseKey>(entries[0]?.cause ?? "variety");
  const [verdict, setVerdict] = useState("");

  const submit = () => {
    if (!verdict.trim()) return;
    onAdjudicate(wineId, accepted, verdict);
    setVerdict("");
  };

  return (
    <div className="dispute-card">
      <h4>
        {wine?.name ?? wineId}
        <span className="badge badge-disputed">错因分歧</span>
      </h4>
      <ul className="dispute-entries">
        {entries.map((d) => (
          <li key={d.id}>
            <strong>{d.student}</strong> 选了 <span className="tag">{causeLabel(d.cause)}</span>
            <p className="clue">“{d.clue}”</p>
          </li>
        ))}
      </ul>
      <label className="verdict-select">
        <span>取舍后采用的错因</span>
        <select value={accepted} onChange={(e) => setAccepted(e.target.value as CauseKey)}>
          {CAUSES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        rows={2}
        value={verdict}
        onChange={(e) => setVerdict(e.target.value)}
        placeholder="写清取舍：为什么采用这个错因，其余线索怎么看……"
      />
      <button className="primary-action" disabled={!verdict.trim()} onClick={submit}>
        写入取舍并更新复练顺序
      </button>
    </div>
  );
}
