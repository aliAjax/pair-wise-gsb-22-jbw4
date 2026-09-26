// 判定与排程：错因诊断的状态迁移、待裁定处理与复练名单排序。
// 本模块只做纯数据运算，不关心页面渲染和持久化。

export type CauseKey = "variety" | "region" | "aroma";

export type DiagnosisStatus = "pending" | "confirmed" | "disputed" | "resolved";

export interface Diagnosis {
  id: string;
  wineId: string;
  student: string;
  cause: CauseKey;
  clue: string;
  createdAt: number;
  status: DiagnosisStatus;
  /** 讲师写下的取舍说明（裁定时填入） */
  verdict?: string;
  /** 裁定后该条错因是否被采纳 */
  accepted?: boolean;
}

export type DrillStatus = "active" | "paused" | "cleared";

export interface DrillEvent {
  at: number;
  result: "hit" | "miss";
}

export interface Drill {
  id: string;
  wineId: string;
  student: string;
  /** 复练重点（裁定时以讲师取舍为准） */
  cause: CauseKey;
  clue: string;
  /** 连续答对次数 */
  streak: number;
  /** 复练顺序 */
  order: number;
  status: DrillStatus;
  log: DrillEvent[];
}

export interface BookState {
  students: string[];
  diagnoses: Diagnosis[];
  drills: Drill[];
  seq: number;
}

/** 连续答对两回才离开名单 */
export const REQUIRED_STREAK = 2;

export const DIAGNOSIS_STATUS_TEXT: Record<DiagnosisStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  disputed: "待裁定",
  resolved: "已裁定",
};

export function emptyBook(students: string[]): BookState {
  return { students: [...students], diagnoses: [], drills: [], seq: 1 };
}

// ---------- 查询 ----------

/**
 * 诊断是否还在流程中。
 * 已出名单酒款的旧诊断不再参与同款冲突判定。
 */
function isLive(state: BookState, d: Diagnosis): boolean {
  if (d.status === "pending" || d.status === "disputed") return true;
  if (d.status === "confirmed") {
    return state.drills.some(
      (dr) => dr.wineId === d.wineId && dr.student === d.student && dr.status !== "cleared"
    );
  }
  return false;
}

export function openDiagnosisFor(
  state: BookState,
  wineId: string,
  student: string
): Diagnosis | undefined {
  return state.diagnoses.find(
    (d) => d.wineId === wineId && d.student === student && isLive(state, d)
  );
}

export function openDrillFor(
  state: BookState,
  wineId: string,
  student: string
): Drill | undefined {
  return state.drills.find(
    (dr) => dr.wineId === wineId && dr.student === student && dr.status !== "cleared"
  );
}

/** 同一学员对同一款酒，同一时间只允许一笔未了结的诊断 */
export function canSubmitDiagnosis(state: BookState, wineId: string, student: string): boolean {
  return !openDiagnosisFor(state, wineId, student) && !openDrillFor(state, wineId, student);
}

// ---------- 状态迁移 ----------

export interface DiagnosisInput {
  wineId: string;
  student: string;
  cause: CauseKey;
  clue: string;
}

/** 学员作答后提交错因与线索 */
export function submitDiagnosis(state: BookState, input: DiagnosisInput): BookState {
  const clue = input.clue.trim();
  if (!clue || !canSubmitDiagnosis(state, input.wineId, input.student)) return state;
  const diagnosis: Diagnosis = {
    id: `dg-${state.seq}`,
    wineId: input.wineId,
    student: input.student,
    cause: input.cause,
    clue,
    createdAt: Date.now(),
    status: "pending",
  };
  const next: BookState = {
    ...state,
    seq: state.seq + 1,
    diagnoses: [...state.diagnoses, diagnosis],
  };
  return refreshDisputes(next, input.wineId);
}

/**
 * 同款酒出现不同错因时，相关记录全部停在待裁定，
 * 已排入复练的条目暂停，等讲师写清取舍。
 */
function refreshDisputes(state: BookState, wineId: string): BookState {
  const live = state.diagnoses.filter((d) => d.wineId === wineId && isLive(state, d));
  const causes = new Set(live.map((d) => d.cause));
  if (causes.size < 2) return state;
  const disputedStudents = new Set(live.map((d) => d.student));
  return {
    ...state,
    diagnoses: state.diagnoses.map((d) =>
      d.wineId === wineId && isLive(state, d) ? { ...d, status: "disputed" as const } : d
    ),
    drills: state.drills.map((dr) =>
      dr.wineId === wineId && dr.status === "active" && disputedStudents.has(dr.student)
        ? { ...dr, status: "paused" as const }
        : dr
    ),
  };
}

/** 讲师确认诊断后，安排下一次复练 */
export function confirmDiagnosis(state: BookState, id: string): BookState {
  const target = state.diagnoses.find((d) => d.id === id);
  if (!target || target.status !== "pending") return state;
  const next: BookState = {
    ...state,
    diagnoses: state.diagnoses.map((d) =>
      d.id === id ? { ...d, status: "confirmed" as const } : d
    ),
  };
  return ensureDrill(next, target);
}

/**
 * 讲师写清取舍后，分歧记录结案，并更新复练顺序：
 * 涉及的学员都按裁定后的错因进入（或回到）复练名单。
 */
export function adjudicate(
  state: BookState,
  wineId: string,
  acceptedCause: CauseKey,
  verdict: string
): BookState {
  const note = verdict.trim();
  const disputed = state.diagnoses.filter(
    (d) => d.wineId === wineId && d.status === "disputed"
  );
  if (!note || disputed.length === 0) return state;
  let next: BookState = {
    ...state,
    diagnoses: state.diagnoses.map((d) =>
      d.wineId === wineId && d.status === "disputed"
        ? {
            ...d,
            status: "resolved" as const,
            accepted: d.cause === acceptedCause,
            verdict: note,
          }
        : d
    ),
  };
  for (const d of disputed) {
    next = ensureDrill(next, d, acceptedCause);
  }
  return next;
}

/** 把（学员, 酒款）放进复练名单；已暂停的恢复并刷新复练重点 */
function ensureDrill(state: BookState, d: Diagnosis, causeOverride?: CauseKey): BookState {
  const existing = state.drills.find(
    (dr) => dr.wineId === d.wineId && dr.student === d.student && dr.status !== "cleared"
  );
  if (existing) {
    return {
      ...state,
      drills: state.drills.map((dr) =>
        dr.id === existing.id
          ? { ...dr, status: "active" as const, cause: causeOverride ?? dr.cause }
          : dr
      ),
    };
  }
  const drill: Drill = {
    id: `dr-${state.seq}`,
    wineId: d.wineId,
    student: d.student,
    cause: causeOverride ?? d.cause,
    clue: d.clue,
    streak: 0,
    order: nextOrder(state),
    status: "active",
    log: [],
  };
  return { ...state, seq: state.seq + 1, drills: [...state.drills, drill] };
}

function nextOrder(state: BookState): number {
  return state.drills.reduce((max, dr) => Math.max(max, dr.order), 0) + 1;
}

/** 复练结果：答对累计连对、满两回出名单；答错清零并排到队尾 */
export function recordDrillResult(
  state: BookState,
  drillId: string,
  result: "hit" | "miss"
): BookState {
  const drill = state.drills.find((d) => d.id === drillId);
  if (!drill || drill.status !== "active") return state;
  const event: DrillEvent = { at: Date.now(), result };
  if (result === "hit") {
    const streak = drill.streak + 1;
    const cleared = streak >= REQUIRED_STREAK;
    return {
      ...state,
      drills: state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              streak,
              status: cleared ? ("cleared" as const) : ("active" as const),
              log: [...d.log, event],
            }
          : d
      ),
    };
  }
  return {
    ...state,
    drills: state.drills.map((d) =>
      d.id === drillId
        ? { ...d, streak: 0, order: nextOrder(state), log: [...d.log, event] }
        : d
    ),
  };
}

export function addStudent(state: BookState, name: string): BookState {
  const trimmed = name.trim();
  if (!trimmed || state.students.includes(trimmed)) return state;
  return { ...state, students: [...state.students, trimmed] };
}

// ---------- 派生列表 ----------

export function pendingDiagnoses(state: BookState): Diagnosis[] {
  return state.diagnoses.filter((d) => d.status === "pending");
}

export interface DisputeGroup {
  wineId: string;
  entries: Diagnosis[];
}

export function disputedGroups(state: BookState): DisputeGroup[] {
  const map = new Map<string, Diagnosis[]>();
  for (const d of state.diagnoses) {
    if (d.status !== "disputed") continue;
    const list = map.get(d.wineId) ?? [];
    list.push(d);
    map.set(d.wineId, list);
  }
  return [...map.entries()].map(([wineId, entries]) => ({ wineId, entries }));
}

export function activeDrills(state: BookState): Drill[] {
  return state.drills
    .filter((d) => d.status === "active")
    .sort((a, b) => a.order - b.order);
}

export function pausedDrills(state: BookState): Drill[] {
  return state.drills
    .filter((d) => d.status === "paused")
    .sort((a, b) => a.order - b.order);
}

export function clearedDrills(state: BookState): Drill[] {
  return state.drills.filter((d) => d.status === "cleared");
}

export function stats(state: BookState) {
  return {
    pending: state.diagnoses.filter((d) => d.status === "pending").length,
    disputed: state.diagnoses.filter((d) => d.status === "disputed").length,
    drilling: state.drills.filter((d) => d.status === "active").length,
    cleared: state.drills.filter((d) => d.status === "cleared").length,
  };
}
