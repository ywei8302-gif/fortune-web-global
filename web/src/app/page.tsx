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
    <main className="hero-bg mystic-page min-h-screen p-4 md:p-8">
      <div className="mystic-ornaments" aria-hidden>
        <span className="orn o-taiji">☯</span>
        <span className="orn o-bagua">☰</span>
        <span className="orn o-bagua2">☷</span>
        <span className="orn o-coin">◎</span>
        <span className="orn o-ding">鼎</span>
      </div>
      <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="mystic-panel animate-rise">
          <p className="mystic-pill">FORTUNE REFLECTION</p>
          <h1 className="mystic-title mt-4">有事您请问</h1>
          <p className="mystic-sub mt-3">心念入局，时刻起课。以此刻为锚点，拆解今明后关键应事。</p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="mystic-step step-1">
              <p className="font-semibold">01 录入信息</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">姓名、出生信息、方位与当下问题。</p>
            </div>
            <div className="mystic-step step-2">
              <p className="font-semibold">02 本地起课</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">系统按本地规则即时生成本卦与变卦。</p>
            </div>
            <div className="mystic-step step-3">
              <p className="font-semibold">03 解读落点</p>
              <p className="mt-1 text-[color:var(--ink-soft)]">得到结构化推演与今明后行动指南。</p>
            </div>
          </div>
        </aside>

        <section className="mystic-panel animate-rise delay-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="mystic-section-title">起课表单</h2>
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

            {birthDate && <p className="mystic-chip">已选择：{birthDate}（{shiChen}）</p>}

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
              <textarea className="input min-h-28" placeholder="例如：今日财运如何" value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
          </div>

          {error && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button onClick={submit} className="primary-btn mt-5 w-full">
            免费起课
          </button>

          <p className="mt-3 text-xs text-[color:var(--ink-soft)]">文化娱乐与心理建设用途，不作医疗、法律、投资建议。</p>
        </section>
      </section>
    </main>
  );
}
