// 领域模型：酒款、学员、错因诊断、复练名单

export type ErrorCause =
  | "variety" // 品种判断错误
  | "region" // 产区判断错误
  | "aroma"; // 香气线索误读

export type WineCategory = "红葡萄酒" | "白葡萄酒" | "起泡酒" | "加强酒";

export interface Wine {
  id: string;
  name: string;
  region: string;
  variety: string;
  category: WineCategory;
  vintage?: number;
  acidity: string;
  tannin: string;
  body: string;
  aromas: string[];
}

export interface Student {
  id: string;
  name: string;
}

/** 一次作答记录（答对/答错） */
export interface Attempt {
  id: string;
  studentId: string;
  wineId: string;
  correct: boolean;
  at: string; // ISO 时间
}

/** 一条学员自填的错因判断 */
export interface CausePick {
  id: string;
  studentId: string;
  cause: ErrorCause;
  clue: string; // 学员写下的线索
  at: string;
}

export type DiagnosisStatus =
  | "pending_review" // 学员已交，待讲师确认
  | "disputed" // 同款酒出现不同错因，待讲师裁定
  | "confirmed"; // 讲师已确认/裁定

export interface Diagnosis {
  id: string;
  wineId: string;
  picks: CausePick[];
  status: DiagnosisStatus;
  /** 讲师确认/裁定后写入的最终错因 */
  finalCause?: ErrorCause;
  /** 讲师的取舍说明（裁定时必填） */
  rulingNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  /** 确认后生成的复练计划日期 YYYY-MM-DD */
  scheduledFor?: string;
  createdAt: string;
}

export type RosterStatus =
  | "active" // 在复练名单中
  | "cleared"; // 连续答对两回，离开名单

/** 名单条目：某学员对某款酒的复练状态 */
export interface RosterEntry {
  id: string; // `${studentId}:${wineId}`
  studentId: string;
  wineId: string;
  status: RosterStatus;
  streak: number; // 当前连续答对次数（0-2，到 2 即 cleared）
  /** 关联的进行中诊断（待确认/待裁定时存在） */
  openDiagnosisId?: string;
  /** 下一次复练日期 YYYY-MM-DD（讲师安排后写入） */
  nextPracticeAt?: string;
  lastAttemptAt?: string;
}

export interface AppState {
  students: Student[];
  wines: Wine[];
  attempts: Attempt[];
  diagnoses: Diagnosis[];
  roster: RosterEntry[];
}
