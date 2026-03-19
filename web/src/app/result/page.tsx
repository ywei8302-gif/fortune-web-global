import { Suspense } from "react";
import { ResultClient } from "@/app/result/result-client";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderValue = params.orderId;
  const orderId = Array.isArray(orderValue) ? orderValue[0] ?? "" : orderValue ?? "";

  return (
    <Suspense fallback={<main className="min-h-screen p-6">加载中…</main>}>
      <ResultClient orderId={orderId} />
    </Suspense>
  );
}
