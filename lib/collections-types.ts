// Types for Collections - no Prisma dependencies
export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId: string;
  projectName: string;
  description: string | null;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: any;
  taxRate: any;
  taxAmount: any;
  totalAmount: any;
  notes: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: any;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface CollectionStats {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface CollectionsData {
  invoices: Invoice[];
  payments: Payment[];
  stats: CollectionStats;
}

// Utility functions for client-side use
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PARTIALLY_PAID":
      return "bg-yellow-100 text-yellow-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    case "SENT":
      return "bg-blue-100 text-blue-800";
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "FINALIZED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getInvoicePayments(payments: Payment[], invoiceId: number): Payment[] {
  return payments.filter((p) => p.invoiceId === invoiceId);
}

export function filterInvoices(invoices: Invoice[], filter: string): Invoice[] {
  const now = new Date();
  return invoices.filter((inv) => {
    if (filter === "all") return true;
    if (filter === "paid") return inv.status === "PAID";
    if (filter === "pending")
      return (
        inv.status === "SENT" || inv.status === "FINALIZED" || inv.status === "DRAFT"
      );
    if (filter === "overdue")
      return (
        inv.status === "OVERDUE" ||
        (new Date(inv.dueDate) < now && inv.status !== "PAID")
      );
    if (filter === "partial") return inv.status === "PARTIALLY_PAID";
    return true;
  });
}
