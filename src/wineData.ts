// 酒款资料模块：档案与初始数据

import type { AppState, Student, Wine } from "./types";

export const wineSeeds: Wine[] = [
  {
    id: "wine-left-bank",
    name: "左岸混酿",
    region: "波尔多",
    variety: "赤霞珠",
    category: "红葡萄酒",
    vintage: 2018,
    acidity: "中高",
    tannin: "高",
    body: "饱满",
    aromas: ["黑醋栗", "雪松", "铅笔芯"],
  },
  {
    id: "wine-bourgogne",
    name: "勃艮第村级",
    region: "勃艮第",
    variety: "黑皮诺",
    category: "红葡萄酒",
    vintage: 2020,
    acidity: "高",
    tannin: "低-中",
    body: "中等",
    aromas: ["红樱桃", "蘑菇", "湿叶"],
  },
  {
    id: "wine-rioja",
    name: "里奥哈珍藏",
    region: "里奥哈",
    variety: "丹魄",
    category: "红葡萄酒",
    vintage: 2016,
    acidity: "中",
    tannin: "中",
    body: "中等-饱满",
    aromas: ["香草", "椰子", "熟李子"],
  },
  {
    id: "wine-napa-cab",
    name: "纳帕赤霞珠",
    region: "纳帕",
    variety: "赤霞珠",
    category: "红葡萄酒",
    vintage: 2019,
    acidity: "中",
    tannin: "高",
    body: "饱满",
    aromas: ["黑樱桃果酱", "薄荷", "烘焙橡木"],
  },
];

export const studentSeeds: Student[] = [
  { id: "stu-lin", name: "林同学" },
  { id: "stu-zhao", name: "赵同学" },
];

export const initialState: AppState = {
  students: studentSeeds,
  wines: wineSeeds,
  attempts: [],
  diagnoses: [],
  roster: [],
};
