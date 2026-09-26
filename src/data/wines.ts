// 酒款资料：盲品用酒清单、学员名册与错因选项。
// 只放参考资料，不含状态迁移逻辑。

import type { CauseKey } from "../domain/diagnosis";

export interface Wine {
  id: string;
  name: string;
  region: string;
  variety: string;
  vintage: string;
  structure: string;
  aromas: string[];
  /** 易混点提示 */
  trap: string;
}

export const WINES: Wine[] = [
  {
    id: "w-bordeaux-left",
    name: "左岸混酿",
    region: "法国 · 波尔多左岸",
    variety: "赤霞珠为主的混酿",
    vintage: "2018",
    structure: "高酸 · 高单宁 · 中偏饱满",
    aromas: ["黑醋栗", "雪松", "铅笔芯", "烟草"],
    trap: "与纳帕赤霞珠相比果味更收敛，雪松与石墨感更强",
  },
  {
    id: "w-burgundy-village",
    name: "勃艮第村级",
    region: "法国 · 勃艮第",
    variety: "黑皮诺",
    vintage: "2019",
    structure: "高酸 · 低单宁 · 中等酒体",
    aromas: ["红樱桃", "蘑菇", "湿叶", "丁香"],
    trap: "浅宝石红加森林地表气息，容易与博若莱混淆",
  },
  {
    id: "w-rioja-reserva",
    name: "里奥哈珍藏",
    region: "西班牙 · 里奥哈",
    variety: "丹魄",
    vintage: "2016",
    structure: "中酸 · 中单宁 · 中等酒体",
    aromas: ["香草", "椰子", "熟李子", "皮革"],
    trap: "美国橡木的香草、椰子是分水岭，别只盯果香",
  },
  {
    id: "w-napa-cab",
    name: "纳帕赤霞珠",
    region: "美国 · 纳帕谷",
    variety: "赤霞珠",
    vintage: "2018",
    structure: "中酸 · 高单宁 · 酒体饱满",
    aromas: ["黑莓", "黑醋栗", "香草", "摩卡"],
    trap: "与左岸混酿相比更成熟甜美，酒精感更明显",
  },
  {
    id: "w-rhone-syrah",
    name: "北隆西拉",
    region: "法国 · 北罗讷河谷",
    variety: "西拉",
    vintage: "2017",
    structure: "中高酸 · 中高单宁 · 中偏饱满",
    aromas: ["黑胡椒", "紫罗兰", "橄榄", "烟熏"],
    trap: "胡椒与橄榄是西拉指纹，别误判成赤霞珠",
  },
  {
    id: "w-marlborough-sb",
    name: "马尔堡长相思",
    region: "新西兰 · 马尔堡",
    variety: "长相思",
    vintage: "2021",
    structure: "高酸 · 酒体轻盈",
    aromas: ["百香果", "青草", "醋栗叶", "柑橘"],
    trap: "奔放的百香果指向新西兰，旧世界更内敛",
  },
];

export function wineById(id: string): Wine | undefined {
  return WINES.find((w) => w.id === id);
}

export const STUDENTS = ["林岚", "陈默", "赵启", "孙茉"];

export interface CauseOption {
  key: CauseKey;
  label: string;
  hint: string;
}

export const CAUSES: CauseOption[] = [
  { key: "variety", label: "品种误判", hint: "葡萄品种认错，例如把丹魄当成赤霞珠" },
  { key: "region", label: "产区误判", hint: "产区风格没抓住，例如把里奥哈当成波尔多" },
  { key: "aroma", label: "香气线索遗漏", hint: "漏掉决定性香气，例如香草、椰子指向美国橡木" },
];

export function causeLabel(key: CauseKey): string {
  return CAUSES.find((c) => c.key === key)?.label ?? key;
}
