import { NextResponse } from "next/server";

export async function POST() {
  try {
    const outTradeNo = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return NextResponse.json({
      ok: true,
      payment: {
        outTradeNo,
        body: "易学宗师-卦象详解",
        totalFee: 199,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errMsg: "下单失败，请重试",
      },
      { status: 500 },
    );
  }
}
