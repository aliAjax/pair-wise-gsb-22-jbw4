// 保存模块：localStorage 持久化，重开页面可接着处理

import { initialState } from "./wineData";
import type { AppState } from "./types";

const STORAGE_KEY = "hxwl-08.diagnosis-book.v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // 以最新种子资料为准（酒款/学员档案可更新），只恢复流程数据
    return {
      students: initialState.students,
      wines: initialState.wines,
      attempts: parsed.attempts ?? [],
      diagnoses: parsed.diagnoses ?? [],
      roster: parsed.roster ?? [],
    };
  } catch {
    return structuredClone(initialState);
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默降级，不影响当次使用
  }
}

export function clearSavedState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
