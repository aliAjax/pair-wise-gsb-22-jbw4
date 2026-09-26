// 判定与排程模块：错因选项、答题判定、分歧检测、讲师确认/裁定、复练排序

import type {
  AppState,
  CausePick,
  Diagnosis,
  ErrorCause,
  RosterEntry,
} from "./types";

export const STREAK_GOAL = 2; // 连续答对两回离开名单

export const ERROR_CAUSES: { value: ErrorCause; label: string; hint: string }[] =
  [
    { value: "variety", label: "品种", hint: "葡萄品种判断错误" },
    { value: "region", label: "产区", hint: "产区归属判断错误" },
    { value: "aroma", label: "香气线索", hint: "关键香气误读或遗漏" },
  ];

export const causeLabel = (cause: ErrorCause): string =>
  ERROR_CAUSES.find((c) => c.value === cause)?.label ?? cause;

export const rosterEntryId = (studentId: string, wineId: string) =>
  `${studentId}:${wineId}`;

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function upsertRoster(
  roster: RosterEntry[],
  entry: RosterEntry
): RosterEntry[] {
  const idx = roster.findIndex((r) => r.id === entry.id);
  if (idx === -1) return [...roster, entry];
  const next = [...roster];
  next[idx] = entry;
  return next;
}

/**
 * 记录一次作答。
 * - 答对：连续计数 +1，达两回则离开名单（cleared）
 * - 答错：连续计数清零，保留在名单（active），等待学员填错因
 */
export function recordAttempt(
  state: AppState,
  params: { studentId: string; wineId: string; correct: boolean; at: string }
): AppState {
  const { studentId, wineId, correct, at } = params;
  const id = uid();
  const old =
    state.roster.find((r) => r.id === rosterEntryId(studentId, wineId)) ??
    ({
      id: rosterEntryId(studentId, wineId),
      studentId,
      wineId,
      status: "active",
      streak: 0,
    } as RosterEntry);

  const streak = correct
    ? (old.status === "cleared" ? 0 : old.streak) + 1
    : 0;
  const updated: RosterEntry = {
    ...old,
    streak,
    status:
      correct && streak >= STREAK_GOAL
        ? "cleared"
        : "active",
    lastAttemptAt: at,
    // 一次新作答后，旧的排期作废，等待新一轮确认
    nextPracticeAt: correct && streak >= STREAK_GOAL ? undefined : old.nextPracticeAt,
    openDiagnosisId: correct ? undefined : old.openDiagnosisId,
  };

  return {
    ...state,
    attempts: [
      ...state.attempts,
      { id, studentId, wineId, correct, at },
    ],
    roster: upsertRoster(state.roster, updated),
  };
}

/**
 * 学员答错后提交错因 + 线索。
 * 同款酒若已有进行中的诊断：
 *  - 错因相同 → 并入同一条，仍待确认
 *  - 错因不同 → 整条记录转为「待裁定」，等讲师取舍
 */
export function submitCause(
  state: AppState,
  params: {
    studentId: string;
    wineId: string;
    cause: ErrorCause;
    clue: string;
    at: string;
  }
): AppState {
  const { studentId, wineId, cause, clue, at } = params;
  const pick: CausePick = { id: uid(), studentId, cause, clue, at };

  const openIdx = state.diagnoses.findIndex(
    (d) =>
      d.wineId === wineId &&
      (d.status === "pending_review" || d.status === "disputed")
  );

  let diagnoses: Diagnosis[];
  let diagnosisId: string;

  if (openIdx === -1) {
    const created: Diagnosis = {
      id: uid(),
      wineId,
      picks: [pick],
      status: "pending_review",
      createdAt: at,
    };
    diagnoses = [...state.diagnoses, created];
    diagnosisId = created.id;
  } else {
    const existing = state.diagnoses[openIdx];
    // 同一学员重复提交：替换其原选择
    const otherPicks = existing.picks.filter(
      (p) => p.studentId !== studentId
    );
    const picks = [...otherPicks, pick];
    const causes = new Set(picks.map((p) => p.cause));
    const status = causes.size > 1 ? "disputed" : "pending_review";
    const merged: Diagnosis = { ...existing, picks, status };
    diagnoses = state.diagnoses.map((d, i) => (i === openIdx ? merged : d));
    diagnosisId = merged.id;
  }

  // 名单条目挂上进行中诊断
  const oldEntry = state.roster.find(
    (r) => r.id === rosterEntryId(studentId, wineId)
  );
  const entry: RosterEntry = {
    id: rosterEntryId(studentId, wineId),
    studentId,
    wineId,
    streak: 0,
    ...oldEntry,
    status: "active",
    openDiagnosisId: diagnosisId,
  };

  return {
    ...state,
    diagnoses,
    roster: upsertRoster(state.roster, entry),
  };
}

/** 讲师确认（无分歧）：写入最终错因并安排复练日期 */
export function confirmDiagnosis(
  state: AppState,
  params: { diagnosisId: string; cause: ErrorCause; date: string; note?: string; at: string }
): AppState {
  return finalize(state, { ...params, rulingNote: params.note });
}

/** 讲师裁定分歧：必须写清取舍说明 */
export function resolveDispute(
  state: AppState,
  params: { diagnosisId: string; cause: ErrorCause; note: string; date: string; at: string }
): AppState {
  if (!params.note.trim()) {
    throw new Error("裁定必须写清取舍说明");
  }
  return finalize(state, {
    diagnosisId: params.diagnosisId,
    cause: params.cause,
    date: params.date,
    rulingNote: params.note,
    at: params.at,
  });
}

function finalize(
  state: AppState,
  params: { diagnosisId: string; cause: ErrorCause; date: string; rulingNote?: string; at: string }
): AppState {
  const d = state.diagnoses.find((x) => x.id === params.diagnosisId);
  if (!d || d.status === "confirmed") return state;

  const finalized: Diagnosis = {
    ...d,
    status: "confirmed",
    finalCause: params.cause,
    rulingNote: params.rulingNote,
    reviewedAt: params.at,
    scheduledFor: params.date,
  };

  // 所有涉及学员的名单条目更新排期
  let roster = state.roster;
  for (const pick of d.picks) {
    const id = rosterEntryId(pick.studentId, d.wineId);
    const old = roster.find((r) => r.id === id);
    const entry: RosterEntry = {
      id,
      studentId: pick.studentId,
      wineId: d.wineId,
      streak: 0,
      ...old,
      status: "active",
      openDiagnosisId: undefined,
      nextPracticeAt: params.date,
    };
    roster = upsertRoster(roster, entry);
  }

  return {
    ...state,
    diagnoses: state.diagnoses.map((x) =>
      x.id === params.diagnosisId ? finalized : x
    ),
    roster,
  };
}

/** 复练名单：在名单中的条目按排期日期升序（未排期排最后） */
export function practiceQueue(
  state: AppState
): (RosterEntry & { _sort: number })[] {
  const far = Number.MAX_SAFE_INTEGER;
  return state.roster
    .filter((r) => r.status === "active")
    .map((r) => ({
      ...r,
      _sort: r.nextPracticeAt ? Date.parse(r.nextPracticeAt) : far,
    }))
    .sort((a, b) => a._sort - b._sort);
}

/** 今天该练的：排期日期 <= 今天 */
export function dueToday(
  state: AppState,
  today: string
): RosterEntry[] {
  return practiceQueue(state).filter(
    (r) => r.nextPracticeAt && r.nextPracticeAt <= today
  );
}
