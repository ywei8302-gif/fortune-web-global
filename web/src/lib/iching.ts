export type Trigram = {
  name: string;
  bits: string;
};

export type GuaResult = {
  hexagram: string;
  upper: Trigram;
  lower: Trigram;
  movingLine: number;
  movingLines: number[];
  changed: {
    hexagram: string;
    upper: Trigram;
    lower: Trigram;
  };
  clickTimeLocal: string;
  methodUsed: string;
};

const SHI_CHEN_LIST = [
  { label: "子时（23:00-01:00）", name: "子时", hhmm: "00:30" },
  { label: "丑时（01:00-03:00）", name: "丑时", hhmm: "01:30" },
  { label: "寅时（03:00-05:00）", name: "寅时", hhmm: "03:30" },
  { label: "卯时（05:00-07:00）", name: "卯时", hhmm: "05:30" },
  { label: "辰时（07:00-09:00）", name: "辰时", hhmm: "07:30" },
  { label: "巳时（09:00-11:00）", name: "巳时", hhmm: "09:30" },
  { label: "午时（11:00-13:00）", name: "午时", hhmm: "11:30" },
  { label: "未时（13:00-15:00）", name: "未时", hhmm: "13:30" },
  { label: "申时（15:00-17:00）", name: "申时", hhmm: "15:30" },
  { label: "酉时（17:00-19:00）", name: "酉时", hhmm: "17:30" },
  { label: "戌时（19:00-21:00）", name: "戌时", hhmm: "19:30" },
  { label: "亥时（21:00-23:00）", name: "亥时", hhmm: "21:30" },
] as const;

const DIRECTION_LIST = ["东", "南", "西", "北", "东北", "东南", "西南", "西北"] as const;
const GENDER_LIST = ["男", "女"] as const;

export function getShiChenList() {
  return SHI_CHEN_LIST;
}

export function getDirectionList() {
  return DIRECTION_LIST;
}

export function getGenderList() {
  return GENDER_LIST;
}

export function fmtLocal(ts: number) {
  const d = new Date(ts);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function trigramFromBits(bits: string): Trigram {
  const map: Record<string, Trigram> = {
    "111": { name: "乾", bits: "111" },
    "110": { name: "兑", bits: "110" },
    "101": { name: "离", bits: "101" },
    "100": { name: "震", bits: "100" },
    "011": { name: "巽", bits: "011" },
    "010": { name: "坎", bits: "010" },
    "001": { name: "艮", bits: "001" },
    "000": { name: "坤", bits: "000" },
  };
  return map[bits] || { name: "", bits };
}

function baguaByIndex1to8(n: number): Trigram {
  const seq = [
    { name: "乾", bits: "111" },
    { name: "兑", bits: "110" },
    { name: "离", bits: "101" },
    { name: "震", bits: "100" },
    { name: "巽", bits: "011" },
    { name: "坎", bits: "010" },
    { name: "艮", bits: "001" },
    { name: "坤", bits: "000" },
  ];
  const x = ((n % 8) + 8) % 8;
  const idx = x === 0 ? 7 : x - 1;
  return seq[idx] || seq[7];
}

function hexName(upperName: string, lowerName: string) {
  const table: Record<string, Record<string, string>> = {
    乾: { 乾: "乾为天", 兑: "天泽履", 离: "天火同人", 震: "天雷无妄", 巽: "天风姤", 坎: "天水讼", 艮: "天山遁", 坤: "天地否" },
    兑: { 乾: "泽天夬", 兑: "兑为泽", 离: "泽火革", 震: "泽雷随", 巽: "泽风大过", 坎: "泽水困", 艮: "泽山咸", 坤: "泽地萃" },
    离: { 乾: "火天大有", 兑: "火泽睽", 离: "离为火", 震: "火雷噬嗑", 巽: "火风鼎", 坎: "火水未济", 艮: "火山旅", 坤: "火地晋" },
    震: { 乾: "雷天大壮", 兑: "雷泽归妹", 离: "雷火丰", 震: "震为雷", 巽: "雷风恒", 坎: "雷水解", 艮: "雷山小过", 坤: "雷地豫" },
    巽: { 乾: "风天小畜", 兑: "风泽中孚", 离: "风火家人", 震: "风雷益", 巽: "巽为风", 坎: "风水涣", 艮: "风山渐", 坤: "风地观" },
    坎: { 乾: "水天需", 兑: "水泽节", 离: "水火既济", 震: "水雷屯", 巽: "水风井", 坎: "坎为水", 艮: "水山蹇", 坤: "水地比" },
    艮: { 乾: "山天大畜", 兑: "山泽损", 离: "山火贲", 震: "山雷颐", 巽: "山风蛊", 坎: "山水蒙", 艮: "艮为山", 坤: "山地剥" },
    坤: { 乾: "地天泰", 兑: "地泽临", 离: "地火明夷", 震: "地雷复", 巽: "地风升", 坎: "地水师", 艮: "地山谦", 坤: "坤为地" },
  };
  return table[upperName]?.[lowerName] || "";
}

function hashTextToInt(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sumCharCode(str: string) {
  let sum = 0;
  for (let i = 0; i < str.length; i += 1) sum += str.charCodeAt(i);
  return sum >>> 0;
}

function ymdToNumber(ymd: string) {
  const t = ymd.replace(/-/g, "");
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : 0;
}

function makePrng(seed: number) {
  let x = seed >>> 0 || 123456789;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function applyMovingToSixBits(sixFromBottom: string[], movingLines: number[]) {
  const out = [...sixFromBottom];
  movingLines.forEach((lineNum) => {
    const idx = lineNum - 1;
    if (out[idx] !== undefined) out[idx] = out[idx] === "1" ? "0" : "1";
  });
  return out;
}

type Ctx = {
  Y: number;
  M: number;
  D: number;
  H: number;
  mm: number;
  ss: number;
  birthNum: number;
  shichenNum: number;
  nameSum: number;
  msgSum: number;
  seedA: number;
  seedB: number;
  prng: () => number;
};

function pickLinesByMod(ctx: Ctx, moveCount: number) {
  if (!moveCount) return [];
  const { seedA, seedB, ss } = ctx;
  const pickOne = (x: number) => (((x % 6) + 6) % 6) + 1;
  const lines: number[] = [pickOne(seedA + seedB + ss)];
  if (moveCount >= 2) {
    const v2 = pickOne(seedA * 3 + seedB * 5 + 7);
    lines.push(lines.includes(v2) ? pickOne(seedA + 11) : v2);
  }
  if (moveCount >= 3) {
    const v3 = pickOne(seedA * 7 + seedB * 11 + 13);
    lines.push(lines.includes(v3) ? pickOne(seedB + 17) : v3);
  }
  return lines.slice(0, 3).sort((a, b) => a - b);
}

function methodMeihuaYmdh(ctx: Ctx) {
  const { Y, M, D, H, birthNum, shichenNum, nameSum, msgSum } = ctx;
  const upperN = (Y + M + D + (nameSum % 8) + (birthNum % 8)) % 8;
  const lowerN = (Y + M + D + H + (msgSum % 8) + shichenNum) % 8;
  const upper = baguaByIndex1to8(upperN === 0 ? 8 : upperN);
  const lower = baguaByIndex1to8(lowerN === 0 ? 8 : lowerN);
  const moveCount = (H + shichenNum + (nameSum % 7) + (msgSum % 7)) % 4;
  const movingLines = pickLinesByMod(ctx, moveCount);
  return { upper, lower, movingLines, method: "梅花-年月日时" };
}

function methodMeihuaYmdhms(ctx: Ctx) {
  const { Y, M, D, H, mm, ss, birthNum, shichenNum, nameSum, msgSum } = ctx;
  const upperN = (Y + M * 3 + D * 5 + H * 7 + mm + (nameSum % 8) + (birthNum % 8)) % 8;
  const lowerN = (Y + M * 5 + D * 7 + H * 11 + ss + (msgSum % 8) + shichenNum) % 8;
  const upper = baguaByIndex1to8(upperN === 0 ? 8 : upperN);
  const lower = baguaByIndex1to8(lowerN === 0 ? 8 : lowerN);
  const movingLines = pickLinesByMod(ctx, ss % 4);
  return { upper, lower, movingLines, method: "梅花-年月日时分秒" };
}

function methodNumberTake(ctx: Ctx) {
  const { birthNum, shichenNum, nameSum, msgSum, ss, mm } = ctx;
  const upperN = (nameSum + birthNum + ss) % 8;
  const lowerN = (msgSum + birthNum + shichenNum + mm) % 8;
  const upper = baguaByIndex1to8(upperN === 0 ? 8 : upperN);
  const lower = baguaByIndex1to8(lowerN === 0 ? 8 : lowerN);
  const movingLines = pickLinesByMod(ctx, (nameSum + msgSum + ss) % 4);
  return { upper, lower, movingLines, method: "取数起卦" };
}

function methodCoinToss(ctx: Ctx) {
  const sixFromBottom: string[] = [];
  const movingLines: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    let sum = 0;
    for (let k = 0; k < 3; k += 1) sum += ctx.prng() < 0.5 ? 3 : 2;
    if (sum === 6) sixFromBottom.push("0");
    else if (sum === 7) sixFromBottom.push("1");
    else if (sum === 8) {
      sixFromBottom.push("0");
      movingLines.push(i + 1);
    } else {
      sixFromBottom.push("1");
      movingLines.push(i + 1);
    }
  }
  const lowerFromBottom = sixFromBottom.slice(0, 3);
  const upperFromBottom = sixFromBottom.slice(3, 6);
  const lowerBits = [lowerFromBottom[2], lowerFromBottom[1], lowerFromBottom[0]].join("");
  const upperBits = [upperFromBottom[2], upperFromBottom[1], upperFromBottom[0]].join("");
  const upper = trigramFromBits(upperBits);
  const lower = trigramFromBits(lowerBits);
  const mv = movingLines.slice(0, 3).sort((a, b) => a - b);
  return { upper, lower, movingLines: mv, method: "铜钱六爻" };
}

export function generateGua(input: {
  clickTs: number;
  clickLocal: string;
  name: string;
  message: string;
  birthDateYMD: string;
  shiChenIndex: number;
}): GuaResult {
  const d = new Date(input.clickTs);
  const Y = d.getFullYear();
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const H = d.getHours();
  const mm = d.getMinutes();
  const ss = d.getSeconds();
  const birthNum = ymdToNumber(input.birthDateYMD);
  const shichenNum = Number.isFinite(input.shiChenIndex) && input.shiChenIndex >= 0 ? input.shiChenIndex + 1 : 0;
  const nm = input.name.trim();
  const msg = input.message.trim();
  const nameSum = sumCharCode(nm);
  const msgSum = sumCharCode(msg);
  const seedBase = ((input.clickTs >>> 0) ^ (hashTextToInt(nm) << 1) ^ (hashTextToInt(msg) << 2) ^ ((birthNum >>> 0) << 1) ^ (shichenNum * 97)) >>> 0;
  const prng = makePrng(seedBase);
  const seedA = (seedBase + Y + M * 13 + D * 17 + H * 19 + mm * 23 + ss * 29) >>> 0;
  const seedB = (seedA ^ (birthNum >>> 0) ^ (nameSum << 1) ^ (msgSum << 2)) >>> 0;
  const ctx: Ctx = { Y, M, D, H, mm, ss, birthNum, shichenNum, nameSum, msgSum, seedA, seedB, prng };
  const methods = [() => methodMeihuaYmdh(ctx), () => methodMeihuaYmdhms(ctx), () => methodNumberTake(ctx), () => methodCoinToss(ctx)];
  const picked = methods[Math.floor(prng() * methods.length)]();
  const { upper, lower, movingLines } = picked;
  const lowerFromBottom = [lower.bits[2], lower.bits[1], lower.bits[0]];
  const upperFromBottom = [upper.bits[2], upper.bits[1], upper.bits[0]];
  const sixFromBottom = lowerFromBottom.concat(upperFromBottom);
  const changedFromBottom = applyMovingToSixBits(sixFromBottom, movingLines);
  const cLowerFromBottom = changedFromBottom.slice(0, 3);
  const cUpperFromBottom = changedFromBottom.slice(3, 6);
  const cLowerBits = [cLowerFromBottom[2], cLowerFromBottom[1], cLowerFromBottom[0]].join("");
  const cUpperBits = [cUpperFromBottom[2], cUpperFromBottom[1], cUpperFromBottom[0]].join("");
  const cUpper = trigramFromBits(cUpperBits);
  const cLower = trigramFromBits(cLowerBits);
  return {
    hexagram: hexName(upper.name, lower.name) || "",
    upper: { name: upper.name, bits: upper.bits },
    lower: { name: lower.name, bits: lower.bits },
    movingLine: movingLines.length ? movingLines[0] : 0,
    movingLines,
    changed: { hexagram: hexName(cUpper.name, cLower.name) || "", upper: cUpper, lower: cLower },
    clickTimeLocal: input.clickLocal,
    methodUsed: picked.method || "",
  };
}

export type DisplayLine = {
  idx: number;
  leftType: "yang" | "yin";
  rightType: "yang" | "yin";
  isMove: boolean;
};

function trigramToLinesFromBottom(bits: string) {
  return [bits[2], bits[1], bits[0]];
}

export function buildLineCompare(gua: GuaResult): DisplayLine[] {
  if (!gua || !gua.upper || !gua.lower) return [];
  const upperBits = gua.upper.bits;
  const lowerBits = gua.lower.bits;
  const lowerFromBottom = trigramToLinesFromBottom(lowerBits);
  const upperFromBottom = trigramToLinesFromBottom(upperBits);
  const sixLeftFromBottom = lowerFromBottom.concat(upperFromBottom);
  let sixRightFromBottom = [...sixLeftFromBottom];
  const movingLines = Array.isArray(gua.movingLines) ? gua.movingLines : [];
  if (gua.changed?.upper && gua.changed?.lower) {
    const cLower = trigramToLinesFromBottom(gua.changed.lower.bits);
    const cUpper = trigramToLinesFromBottom(gua.changed.upper.bits);
    sixRightFromBottom = cLower.concat(cUpper);
  } else {
    movingLines.forEach((ln) => {
      const idx = ln - 1;
      if (sixRightFromBottom[idx] !== undefined) {
        sixRightFromBottom[idx] = sixRightFromBottom[idx] === "1" ? "0" : "1";
      }
    });
  }
  const out: DisplayLine[] = [];
  for (let showIdx = 6; showIdx >= 1; showIdx -= 1) {
    const arrIdx = showIdx - 1;
    out.push({
      idx: showIdx,
      leftType: sixLeftFromBottom[arrIdx] === "1" ? "yang" : "yin",
      rightType: sixRightFromBottom[arrIdx] === "1" ? "yang" : "yin",
      isMove: movingLines.includes(showIdx),
    });
  }
  return out;
}
