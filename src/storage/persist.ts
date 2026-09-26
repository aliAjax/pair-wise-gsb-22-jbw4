// 保存：诊断本的 localStorage 读写与重置。
// 数据存在本机浏览器，重开页面接着处理。

import { emptyBook, type BookState } from "../domain/diagnosis";
import { STUDENTS } from "../data/wines";

const STORAGE_KEY = "hxwl-08.diagnosis-book";
const VERSION = 1;

interface Envelope {
  version: number;
  savedAt: number;
  state: BookState;
}

function isBookState(value: unknown): value is BookState {
  if (!value || typeof value !== "object") return false;
  const v = value as BookState;
  return (
    Array.isArray(v.students) &&
    Array.isArray(v.diagnoses) &&
    Array.isArray(v.drills) &&
    typeof v.seq === "number"
  );
}

export function loadBook(): BookState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Envelope>;
    if (parsed.version !== VERSION || !isBookState(parsed.state)) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveBook(state: BookState): void {
  try {
    const envelope: Envelope = { version: VERSION, savedAt: Date.now(), state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // 存储不可用（隐私模式等）时静默失败，不影响当次使用
  }
}

export function clearBook(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}

/** 启动时取上次进度；没有则开一本新的 */
export function initialBook(): BookState {
  return loadBook() ?? emptyBook(STUDENTS);
}
