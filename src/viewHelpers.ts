// 页面共用的展示辅助

import type { AppState } from "./types";

export const wineName = (state: AppState, wineId: string): string =>
  state.wines.find((w) => w.id === wineId)?.name ?? wineId;

export const studentName = (state: AppState, studentId: string): string =>
  state.students.find((s) => s.id === studentId)?.name ?? studentId;

export const todayISO = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
