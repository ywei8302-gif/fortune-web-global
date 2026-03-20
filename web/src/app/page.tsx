"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtLocal, generateGua, getDirectionList, getGenderList, getShiChenList } from "@/lib/iching";
import { saveOrder } from "@/lib/orders";

export default function HomePage() {
  const router = useRouter();
  const shiChenList = useMemo(() => getShiChenList(), []);
  const directionList = useMemo(() => getDirectionList(), []);
  const genderList = useMemo(() => getGenderList(), []);

  const [name, setName] = useState("");
  const [birthDateYMD, setBirthDateYMD] = useState("");
  const [shiChenIndex, setShiChenIndex] = useState(0);
  const [genderIndex, setGenderIndex] = useState(0);
  const [birthPlace, setBirthPlace] = useState("");
  const [directionIndex, setDirectionIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const shiChen = shiChenList[shiChenIndex]?.name ?? "";
  const birthDate = birthDateYMD ? `${birthDateYMD} ${shiChenList[shiChenIndex]?.hhmm ?? ""}` : "";
  const gender = genderList[genderIndex] ?? "";
  const direction = directionList[directionIndex] ?? "";

  function submit() {
    const cleanedName = name.trim();
    const cleanedMessage = message.trim();
    const cleanedDirection = direction.trim();
    if (!cleanedName) return setError("请填写姓名");
    if (!birthDateYMD) return setError("请选择出生日期");
    if (!cleanedMessage) return setError("请填写“此刻最想问的事”");
    if (!cleanedDirection) return setError("请选择心中所指方位");

    setError("");
    const clickTs = Date.now();
    const clickLocal = fmtLocal(clickTs);
    const orderId = `order_${clickTs}`;
    const gua = generateGua({
      clickTs,
      clickLocal,
      name: cleanedName,
      message: cleanedMessage,
      birthDateYMD,
      shiChenIndex,
    });

    saveOrder({
      id: orderId,
      isPaid: false,
      reportText: "",
      params: {
        name: cleanedName,
        gender,
        birthPlace: birthPlace.trim(),
        birthDate,
        shiChen,
        message: cleanedMessage,
        direction: cleanedDirection,
        clickLocal,
        gua,
      },
    });

    router.push(`/result?orderId=${orderId}`);
  }

  return (
    <main className="hero-bg min-h-screen p-4 md:p-8">
      <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="glass soft-border rounded-3xl p-6">
          <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-amber-800">
            MASTER MODE
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">有事您请问</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">本次以“心念 + 秒级时刻”起课。先定心，再定势，最后定行动。</p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="soft-border rounded-2xl bg-white/80 p-3">
              <p className="font-semibold">1. 输入个人信息</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">姓名、出生信息、心中方位与问题。</p>
            </div>
            <div className="soft-border rounded-2xl bg-white/80 p-3">
              <p className="font-semibold">2. 生成本卦与变卦</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">系统按本地算法即时起课，不依赖外部接口。</p>
            </div>
            <div className="soft-border rounded-2xl bg-white/80 p-3">
              <p className="font-semibold">3. 解锁完整推演</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">查看结构化报告与今明后应事落点。</p>
            </div>
          </div>
        </aside>

        <section className="glass soft-border rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">起课表单</h2>
            <p className="text-xs text-[color:var(--ink-soft)]">预计用时 30 秒</p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">姓名</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">性别</span>
                <select className="input" value={genderIndex} onChange={(e) => setGenderIndex(Number(e.target.value))}>
                  {genderList.map((item, idx) => (
                    <option key={item} value={idx}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">出生地</span>
                <input className="input" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="例如：南京" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">出生日期（公历）</span>
                <input className="input" type="date" value={birthDateYMD} onChange={(e) => setBirthDateYMD(e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">出生时辰</span>
                <select className="input" value={shiChenIndex} onChange={(e) => setShiChenIndex(Number(e.target.value))}>
                  {shiChenList.map((item, idx) => (
                    <option key={item.label} value={idx}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {birthDate && (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                已选择：{birthDate}（{shiChen}）
              </p>
            )}

            <label className="grid gap-1">
              <span className="text-sm font-medium">心中所指方位（八方）</span>
              <select className="input" value={directionIndex} onChange={(e) => setDirectionIndex(Number(e.target.value))}>
                {directionList.map((item, idx) => (
                  <option key={item} value={idx}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">此刻最想问的事</span>
              <textarea
                className="input min-h-28"
                placeholder="例如：今日财运如何"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button onClick={submit} className="primary-btn mt-5 w-full">
            免费起课
          </button>

          <p className="mt-3 text-xs text-[color:var(--ink-soft)]">文化娱乐与心理建设用途，不作医疗、法律、投资建议。</p>
        </section>
      </section>
    </main>
  );
}
