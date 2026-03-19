import type { GuaResult } from "@/lib/iching";

export type OrderParams = {
  name: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  shiChen: string;
  message: string;
  direction: string;
  clickLocal: string;
  gua: GuaResult;
};

export type LocalOrder = {
  id: string;
  isPaid: boolean;
  reportText: string;
  params: OrderParams;
};

export function saveOrder(order: LocalOrder) {
  localStorage.setItem(order.id, JSON.stringify(order));
}

export function readOrder(orderId: string): LocalOrder | null {
  const raw = localStorage.getItem(orderId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalOrder;
  } catch {
    return null;
  }
}
