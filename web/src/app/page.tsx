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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7_0%,_#fff8e6_35%,_#f8fafc_100%)] p-4 text-slate-900 md:p-8">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-amber-100 bg-white/90 p-6 shadow-[0_12px_38px_rgba(148,122,44,0.15)]">
        <h1 className="text-3xl font-bold">有事您请问</h1>
        <p className="mt-2 text-sm text-slate-600">本次以“心念 + 秒级时刻”起课</p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">姓名</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
          </label>

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
            {birthDate && <span className="text-xs text-slate-500">已选择：{birthDate}（{shiChen}）</span>}
          </label>

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

        <button onClick={submit} className="mt-5 w-full rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600">
          免费起课
        </button>

        <p className="mt-3 text-xs text-slate-500">文化娱乐与心理建设用途，不作医疗、法律、投资建议。</p>
      </section>
    </main>
  );
}
