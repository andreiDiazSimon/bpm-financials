import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  try {
    const where: any = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Payment: true,
        _count: {
          select: { Payment: true },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    // Calculate aging for each invoice
    const now = new Date();
    const invoicesWithAging = invoices.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const totalPaid = invoice.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(invoice.totalAmount) - totalPaid;

      let agingCategory = "CURRENT";
      if (daysOverdue > 90) agingCategory = "DAYS_90_PLUS";
      else if (daysOverdue > 60) agingCategory = "DAYS_61_90";
      else if (daysOverdue > 30) agingCategory = "DAYS_31_60";
      else if (daysOverdue > 0) agingCategory = "DAYS_1_30";

      return {
        ...invoice,
        daysOverdue,
        totalPaid,
        balanceDue,
        agingCategory,
        paymentCount: invoice._count.Payment,
      };
    });

    return NextResponse.json(invoicesWithAging);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
