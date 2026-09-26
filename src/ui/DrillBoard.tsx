// 页面 · 复练名单：按顺序复练，连对两回出名单。

import { causeLabel, wineById } from "../data/wines";
import {
  activeDrills,
  clearedDrills,
  pausedDrills,
  REQUIRED_STREAK,
  type BookState,
} from "../domain/diagnosis";

interface DrillProps {
  book: BookState;
  onResult: (drillId: string, result: "hit" | "miss") => void;
}

export default function DrillBoard({ book, onResult }: DrillProps) {
  const active = activeDrills(book);
  const paused = pausedDrills(book);
  const cleared = clearedDrills(book);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>复练排程</p>
          <h2>复练名单</h2>
        </div>
        <span className="hint">连续答对 {REQUIRED_STREAK} 回才能离开名单；答错清零排队尾</span>
      </div>

      {active.length === 0 && paused.length === 0 ? (
        <p className="empty">名单还是空的：先让学员记错因，讲师确认后会排进来。</p>
      ) : (
        <ol className="drill-list">
          {active.map((drill, index) => {
            const wine = wineById(drill.wineId);
            return (
              <li key={drill.id} className="drill-row">
                <span className="drill-order">{index + 1}</span>
                <div className="drill-main">
                  <strong>{drill.student}</strong> · {wine?.name ?? drill.wineId}
                  <span className="tag">{causeLabel(drill.cause)}</span>
                  {drill.log.length > 0 && (
                    <span className="log-count">已练 {drill.log.length} 次</span>
                  )}
                  <p className="clue">复练重点：“{drill.clue}”</p>
                </div>
                <span className="streak" title={`连对 ${drill.streak}/${REQUIRED_STREAK}`}>
                  {Array.from({ length: REQUIRED_STREAK }, (_, k) => (
                    <i key={k} className={k < drill.streak ? "dot on" : "dot"} />
                  ))}
                </span>
                <div className="drill-actions">
                  <button className="hit" onClick={() => onResult(drill.id, "hit")}>
                    答对
                  </button>
                  <button className="miss" onClick={() => onResult(drill.id, "miss")}>
                    答错
                  </button>
                </div>
              </li>
            );
          })}
          {paused.map((drill) => {
            const wine = wineById(drill.wineId);
            return (
              <li key={drill.id} className="drill-row paused">
                <span className="drill-order">–</span>
                <div className="drill-main">
                  <strong>{drill.student}</strong> · {wine?.name ?? drill.wineId}
                  <span className="tag">{causeLabel(drill.cause)}</span>
                  <p className="clue">复练暂停，等讲师写清取舍。</p>
                </div>
                <span className="badge badge-disputed">待裁定</span>
              </li>
            );
          })}
        </ol>
      )}

      {cleared.length > 0 && (
        <div className="cleared-block">
          <h3 className="desk-title">
            已出名单 <em>{cleared.length}</em>
          </h3>
          <ul className="cleared-list">
            {cleared.map((drill) => {
              const wine = wineById(drill.wineId);
              return (
                <li key={drill.id}>
                  <strong>{drill.student}</strong> · {wine?.name ?? drill.wineId}
                  <span className="log">
                    {drill.log.map((e, i) => (
                      <i key={i} className={e.result === "hit" ? "ok" : "no"}>
                        {e.result === "hit" ? "对" : "错"}
                      </i>
                    ))}
                  </span>
                  <span className="badge badge-cleared">已出名单</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
