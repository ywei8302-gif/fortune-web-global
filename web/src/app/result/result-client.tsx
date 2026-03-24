"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildLineCompare } from "@/lib/iching";
import { readOrder, saveOrder, type LocalOrder } from "@/lib/orders";

type AiState = {
  guaXiangXiangPi: string;
  yingShiLuoDian: null;
  yingShiLuoDianText: string;
  threeDay: {
    today: { date: string; overall: string; solution: string };
    tomorrow: { date: string; overall: string; solution: string };
    dayAfter: { date: string; overall: string; solution: string };
  };
  disclaimer: string;
};

const emptyAi: AiState = {
  guaXiangXiangPi: "",
  yingShiLuoDian: null,
  yingShiLuoDianText: "",
  threeDay: {
    today: { date: "", overall: "", solution: "" },
    tomorrow: { date: "", overall: "", solution: "" },
    dayAfter: { date: "", overall: "", solution: "" },
  },
  disclaimer: "",
};

export function ResultClient({ orderId }: { orderId: string }) {
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [ai, setAi] = useState<AiState>(emptyAi);

  useEffect(() => {
    if (!orderId) {
      setError("订单丢失，请返回重试");
      setLoaded(true);
      return;
    }
    const hit = readOrder(orderId);
    if (!hit) {
      setError("数据过期，请重新推演");
      setLoaded(true);
      return;
    }
    setOrder(hit);
    setLoaded(true);
    if (hit.isPaid && hit.reportText) {
      setIsPaid(true);
      setAi((prev) => ({ ...prev, guaXiangXiangPi: hit.reportText }));
    } else if (hit.isPaid && !hit.reportText) {
      setIsPaid(true);
      void callAI(hit);
    }
  }, [orderId]);

  async function handlePay() {
    if (!order) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/make-order", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        alert(data.error || "下单失败，请重试");
        setIsLoading(false);
        return;
      }
      const next = { ...order, isPaid: true };
      saveOrder(next);
      setOrder(next);
      setIsPaid(true);
      await callAI(next);
    } catch {
      alert("网络错误，请稍后重试");
      setIsLoading(false);
    }
  }

  async function callAI(current: LocalOrder) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: current.params.name,
          birthDate: current.params.birthDate,
          message: current.params.message,
          direction: current.params.direction,
          clickLocal: current.params.clickLocal,
          gua: current.params.gua,
        }),
      });
      const data = (await res.json()) as { ok: boolean; reportText?: string; error?: string; ai?: AiState };
      if (!res.ok || !data.ok || !data.reportText) {
        alert(data.error || "推演异常，请联系客服");
        return;
      }
      const next = { ...current, reportText: data.reportText };
      saveOrder(next);
      setOrder(next);
      setAi(data.ai || { ...emptyAi, guaXiangXiangPi: data.reportText });
    } catch {
      alert("网络错误，连接失败，请检查网络");
    } finally {
      setIsLoading(false);
    }
  }

  if (!loaded) {
    return <main className="hero-bg min-h-screen p-6">数据加载中…</main>;
  }
  if (error) {
    return (
      <main className="hero-bg min-h-screen p-6">
        <div className="glass soft-border mx-auto max-w-3xl rounded-2xl p-6">
          <p>{error}</p>
          <button className="primary-btn mt-4" onClick={() => router.push("/")}>
            返回
          </button>
        </div>
      </main>
    );
  }
  if (!order) return null;

  const lines = buildLineCompare(order.params.gua);

  return (
    <main className="hero-bg min-h-screen p-4 md:p-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-700">MASTER REPORT</p>
            <h1 className="text-3xl font-bold">推演报告</h1>
          </div>
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm" onClick={() => router.push("/")}>
            返回首页
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="glass soft-border rounded-3xl p-5">
            <p className="text-sm text-slate-600">姓名：{order.params.name}</p>
            <p className="mt-1 text-sm text-slate-600">出生：{order.params.birthDate}（{order.params.shiChen}）</p>
            {order.params.message && <p className="mt-1 text-sm text-slate-600">心念：{order.params.message}</p>}
            {order.params.direction && <p className="mt-1 text-sm text-slate-600">方位：{order.params.direction}</p>}
            {order.params.clickLocal && <p className="mt-1 text-sm text-slate-600">起卦时间：{order.params.clickLocal}</p>}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold">卦象结构</p>
              <p className="mt-1 text-sm text-slate-600">本卦：{order.params.gua.hexagram || "未知"} ｜ 变卦：{order.params.gua.changed.hexagram || "未知"} ｜ 动爻：{order.params.gua.movingLines.length ? `第${order.params.gua.movingLines.join("、")}爻` : "无"}</p>
              <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-500">本卦</span>
                  <span className="text-xs font-semibold text-slate-400">爻位</span>
                  <span className="text-right text-xs font-semibold text-slate-500">变卦</span>
                </div>
                {lines.map((line) => (
                  <div key={line.idx} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-slate-100 px-3 py-2 ${line.isMove ? "bg-red-50" : "bg-white"}`}>
                    <div className="flex justify-center">
                      <span className={line.leftType === "yang" ? `yao-line yao-yang ${line.isMove ? "yao-move" : ""}` : `yao-line yao-yin ${line.isMove ? "yao-move" : ""}`} />
                    </div>
                    <span className={`text-xs font-semibold ${line.isMove ? "text-red-700" : "text-slate-500"}`}>{line.idx}爻</span>
                    <div className="flex justify-center">
                      <span className={line.rightType === "yang" ? `yao-line yao-yang ${line.isMove ? "yao-move" : ""}` : `yao-line yao-yin ${line.isMove ? "yao-move" : ""}`} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  <span className="text-xs text-slate-500">红色标示为动爻，即变化关键位</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="glass soft-border rounded-3xl p-5">
            {isPaid ? (
              <div>
                {isLoading && <p className="text-sm text-slate-500">宗师正在凝神推演...</p>}
                {!isLoading && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-sm tracking-[0.15em] text-amber-700">FULL TEXT</p>
                      <pre className="whitespace-pre-wrap text-sm leading-7">{ai.guaXiangXiangPi || "暂无内容"}</pre>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2"
                        onClick={() => navigator.clipboard.writeText(ai.guaXiangXiangPi || "")}
                      >
                        复制全文
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-lg font-semibold">解锁宗师级精论</p>
                <p className="mt-1 text-sm text-slate-600">包含：事情起因 · 事情走向 · 未来三日锦囊</p>
                <button onClick={handlePay} disabled={isLoading} className="primary-btn mt-4">
                  {isLoading ? "创建订单中..." : "随喜 ¥1.99 立即解锁"}
                </button>
                <button onClick={() => router.push("/")} className="ml-3 rounded-xl border border-slate-300 bg-white px-4 py-2">
                  返回修改
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
