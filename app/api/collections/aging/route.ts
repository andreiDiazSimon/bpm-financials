import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asOfDate = searchParams.get("asOfDate") 
    ? new Date(searchParams.get("asOfDate")!) 
    : new Date();

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ["SENT", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Payment: true,
      },
    });

    // Calculate aging buckets
    const agingReport = {
      totalOutstanding: 0,
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0,
      byClient: [] as any[],
      byInvoice: [] as any[],
    };

    const clientMap = new Map();

    invoices.forEach((invoice) => {
      const totalPaid = invoice.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(invoice.totalAmount) - totalPaid;

      if (balanceDue <= 0) return;

      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      let bucket = "current";
      let bucketAmount = 0;

      if (daysOverdue > 90) {
        bucket = "days90Plus";
        agingReport.days90Plus += balanceDue;
        bucketAmount = balanceDue;
      } else if (daysOverdue > 60) {
        bucket = "days61to90";
        agingReport.days61to90 += balanceDue;
        bucketAmount = balanceDue;
      } else if (daysOverdue > 30) {
        bucket = "days31to60";
        agingReport.days31to60 += balanceDue;
        bucketAmount = balanceDue;
      } else if (daysOverdue > 0) {
        bucket = "days1to30";
        agingReport.days1to30 += balanceDue;
        bucketAmount = balanceDue;
      } else {
        agingReport.current += balanceDue;
        bucketAmount = balanceDue;
      }

      agingReport.totalOutstanding += balanceDue;

      // Add to invoice list
      agingReport.byInvoice.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.Client.name,
        originalAmount: Number(invoice.totalAmount),
        amountPaid: totalPaid,
        balanceDue,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
        dueDate: invoice.dueDate,
        issueDate: invoice.issueDate,
      });

      // Aggregate by client
      if (!clientMap.has(invoice.clientId)) {
        clientMap.set(invoice.clientId, {
          clientId: invoice.clientId,
          clientName: invoice.Client.name,
          totalOutstanding: 0,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90Plus: 0,
          invoiceCount: 0,
        });
      }

      const clientData = clientMap.get(invoice.clientId);
      clientData.totalOutstanding += balanceDue;
      clientData[bucket] += balanceDue;
      clientData.invoiceCount++;
    });

    agingReport.byClient = Array.from(clientMap.values());

    // Sort by outstanding amount descending
    agingReport.byClient.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    agingReport.byInvoice.sort((a, b) => b.balanceDue - a.balanceDue);

    return NextResponse.json({
      asOfDate,
      summary: {
        totalOutstanding: agingReport.totalOutstanding,
        current: agingReport.current,
        days1to30: agingReport.days1to30,
        days31to60: agingReport.days31to60,
        days61to90: agingReport.days61to90,
        days90Plus: agingReport.days90Plus,
      },
      byClient: agingReport.byClient,
      byInvoice: agingReport.byInvoice,
    });
  } catch (error) {
    console.error("Error generating aging report:", error);
    return NextResponse.json(
      { error: "Failed to generate aging report" },
      { status: 500 }
    );
  }
}
