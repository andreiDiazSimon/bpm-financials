import { prismaCore3 } from "./prisma-core3";
import type { Invoice, Payment, CollectionStats, CollectionsData } from "./collections-types";

// Helper to convert any value to number
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

// Helper to convert any value to string
function toString(value: any): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  return value.toString();
}

export async function getCollectionsData(): Promise<CollectionsData> {
  // Fetch invoices
  const invoicesRaw = await prismaCore3.invoice.findMany({
    orderBy: { issueDate: "desc" },
  });

  // Fetch payments
  const paymentsRaw = await prismaCore3.payment.findMany({
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  // Convert Decimal fields to strings for client use
  const invoices: Invoice[] = invoicesRaw.map((inv) => ({
    ...inv,
    subtotal: toString(inv.subtotal),
    taxRate: toString(inv.taxRate),
    taxAmount: toString(inv.taxAmount),
    totalAmount: toString(inv.totalAmount),
  }));

  const payments: Payment[] = paymentsRaw.map((p) => ({
    ...p,
    amount: toString(p.amount),
  }));

  // Calculate stats
  const now = new Date();
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let paidCount = 0;
  let overdueCount = 0;

  invoices.forEach((inv) => {
    const total = toNumber(inv.totalAmount);
    if (inv.status === "PAID") {
      totalCollected += total;
      paidCount++;
    } else if (
      inv.status === "OVERDUE" ||
      (new Date(inv.dueDate) < now && inv.status !== "PAID")
    ) {
      totalPending += total;
      totalOverdue += total;
      overdueCount++;
    } else {
      totalPending += total;
    }
  });

  const stats: CollectionStats = {
    totalCollected,
    totalPending,
    totalOverdue,
    invoiceCount: invoices.length,
    paidCount,
    overdueCount,
  };

  return { invoices, payments, stats };
}

// Re-export types and utilities from collections-types
export type { Invoice, Payment, CollectionStats, CollectionsData } from "./collections-types";
