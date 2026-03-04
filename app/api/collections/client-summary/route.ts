import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  try {
    if (clientId) {
      // Get specific client summary
      const invoices = await prisma.invoice.findMany({
        where: { clientId: parseInt(clientId) },
        include: {
          Payment: true,
          Client: {
            select: { name: true, email: true, phone: true, address: true },
          },
        },
        orderBy: { issueDate: "desc" },
      });

      const now = new Date();
      let totalInvoiced = 0;
      let totalPaid = 0;
      let overdue30 = 0;
      let overdue60 = 0;
      let overdue90 = 0;

      const invoiceDetails = invoices.map((inv) => {
        const invTotal = Number(inv.totalAmount);
        const invPaid = inv.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = invTotal - invPaid;

        totalInvoiced += invTotal;
        totalPaid += invPaid;

        let daysOverdue = 0;
        if (balance > 0) {
          const dueDate = new Date(inv.dueDate);
          daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysOverdue > 90) overdue90 += balance;
          else if (daysOverdue > 60) overdue60 += balance;
          else if (daysOverdue > 30) overdue30 += balance;
        }

        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          originalAmount: invTotal,
          amountPaid: invPaid,
          balanceDue: balance,
          status: inv.status,
          daysOverdue: Math.max(0, daysOverdue),
        };
      });

      const totalOutstanding = totalInvoiced - totalPaid;

      return NextResponse.json({
        clientId: parseInt(clientId),
        clientName: invoices[0]?.Client.name || "",
        clientInfo: invoices[0]?.Client,
        summary: {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          overdue30,
          overdue60,
          overdue90,
        },
        invoices: invoiceDetails,
      });
    } else {
      // Get all client summaries
      const clients = await prisma.client.findMany({
        include: {
          Invoice: {
            include: { Payment: true },
          },
        },
      });

      const now = new Date();
      const summaries = clients.map((client) => {
        let totalInvoiced = 0;
        let totalPaid = 0;
        let overdue30 = 0;
        let overdue60 = 0;
        let overdue90 = 0;

        client.Invoice.forEach((inv) => {
          const invTotal = Number(inv.totalAmount);
          const invPaid = inv.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
          const balance = invTotal - invPaid;

          totalInvoiced += invTotal;
          totalPaid += invPaid;

          if (balance > 0) {
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysOverdue > 90) overdue90 += balance;
            else if (daysOverdue > 60) overdue60 += balance;
            else if (daysOverdue > 30) overdue30 += balance;
          }
        });

        return {
          clientId: client.id,
          clientName: client.name,
          email: client.email,
          phone: client.phone,
          totalInvoiced,
          totalPaid,
          totalOutstanding: totalInvoiced - totalPaid,
          overdue30,
          overdue60,
          overdue90,
          invoiceCount: client.Invoice.length,
        };
      });

      // Sort by outstanding amount descending
      summaries.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

      return NextResponse.json(summaries);
    }
  } catch (error) {
    console.error("Error fetching client summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch client summary" },
      { status: 500 }
    );
  }
}
