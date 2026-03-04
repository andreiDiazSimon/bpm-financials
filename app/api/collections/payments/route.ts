import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId, amount, paymentMethod, reference, notes } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { Payment: true, Client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate current balance
    const totalPaid = invoice.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
    const currentBalance = Number(invoice.totalAmount) - totalPaid;

    if (Number(amount) > currentBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds balance due" },
        { status: 400 }
      );
    }

    // Create payment in core3 schema - THIS IS THE CRITICAL PART
    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(invoiceId),
        amount: Number(amount),
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
      },
    });

    // Update invoice status
    const newTotalPaid = totalPaid + Number(amount);
    let newStatus = invoice.status;
    
    if (newTotalPaid >= Number(invoice.totalAmount)) {
      newStatus = "PAID";
    } else if (newTotalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { 
        status: newStatus,
        paidAt: newTotalPaid >= Number(invoice.totalAmount) ? new Date() : null,
      },
    });

    // Try to create financials records, but don't fail if tables don't exist
    let receipt = null;
    let financialsError = null;
    
    try {
      // Generate receipt number
      const receiptNumber = `R-${Date.now()}`;

      // Create receipt in financials schema
      receipt = await prisma.$queryRaw`
        INSERT INTO "financials"."Receipt" (
          "receiptNumber", "paymentId", "clientId", "invoiceId", 
          "amount", "paymentMethod", "reference", "notes", "createdBy"
        ) VALUES (
          ${receiptNumber}, ${payment.id}, ${invoice.clientId}, ${parseInt(invoiceId)},
          ${Number(amount)}, ${paymentMethod}, ${reference || null}, ${notes || null}, 'System'
        ) RETURNING *
      `;

      // Update or create Accounts Receivable record
      const remainingBalance = Number(invoice.totalAmount) - newTotalPaid;
      
      await prisma.$queryRaw`
        INSERT INTO "financials"."AccountsReceivable" (
          "invoiceId", "clientId", "invoiceNumber", "originalAmount",
          "amountPaid", "balanceDue", "issueDate", "dueDate", "status", "lastPaymentAt"
        ) VALUES (
          ${parseInt(invoiceId)}, ${invoice.clientId}, ${invoice.invoiceNumber},
          ${Number(invoice.totalAmount)}, ${newTotalPaid}, ${remainingBalance},
          ${invoice.issueDate}, ${invoice.dueDate}, 
          ${remainingBalance <= 0 ? 'PAID' : remainingBalance < Number(invoice.totalAmount) ? 'PARTIALLY_PAID' : 'OUTSTANDING'},
          ${new Date()}
        )
        ON CONFLICT ("invoiceId") 
        DO UPDATE SET 
          "amountPaid" = ${newTotalPaid},
          "balanceDue" = ${remainingBalance},
          "status" = ${remainingBalance <= 0 ? 'PAID' : remainingBalance < Number(invoice.totalAmount) ? 'PARTIALLY_PAID' : 'OUTSTANDING'},
          "lastPaymentAt" = ${new Date()},
          "updatedAt" = ${new Date()}
      `;

      // Update client balance summary
      await updateClientBalanceSummary(invoice.clientId, invoice.Client.name);
    } catch (finError) {
      // Financials tables don't exist yet - log but don't fail
      financialsError = "Financials tables not ready. Run: npx prisma migrate dev";
      console.warn("Financials operation skipped:", finError);
    }

    // Auto-post to General Ledger (try-catch so GL errors don't break payment)
    let glEntry = null;
    let glError = null;
    try {
      const glResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ledger/auto-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'PAYMENT_RECEIVED',
          referenceId: payment.id,
          amount: Number(amount),
          description: `Payment received for Invoice ${invoice.invoiceNumber} - ${invoice.Client.name}`,
          date: new Date().toISOString(),
        }),
      });
      
      if (glResponse.ok) {
        const glData = await glResponse.json();
        glEntry = glData.journalEntry;
      }
    } catch (error) {
      glError = 'Failed to post to General Ledger';
      console.warn('GL auto-post skipped:', error);
    }

    return NextResponse.json({
      success: true,
      payment,
      receipt,
      glEntry,
      newBalance: Number(invoice.totalAmount) - newTotalPaid,
      invoiceStatus: newStatus,
      warning: financialsError || glError,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

async function updateClientBalanceSummary(clientId: number, clientName: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { clientId },
      include: { Payment: true },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let overdue30 = 0;
    let overdue60 = 0;
    let overdue90 = 0;
    const now = new Date();

    invoices.forEach((invoice) => {
      const invoiceTotal = Number(invoice.totalAmount);
      const invoicePaid = invoice.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = invoiceTotal - invoicePaid;

      totalInvoiced += invoiceTotal;
      totalPaid += invoicePaid;

      if (balance > 0) {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue > 90) overdue90 += balance;
        else if (daysOverdue > 60) overdue60 += balance;
        else if (daysOverdue > 30) overdue30 += balance;
      }
    });

    const totalOutstanding = totalInvoiced - totalPaid;

    await prisma.$queryRaw`
      INSERT INTO "financials"."ClientBalanceSummary" (
        "clientId", "clientName", "totalInvoiced", "totalPaid",
        "totalOutstanding", "currentBalance", "overdue30", "overdue60", "overdue90"
      ) VALUES (
        ${clientId}, ${clientName}, ${totalInvoiced}, ${totalPaid},
        ${totalOutstanding}, ${totalOutstanding}, ${overdue30}, ${overdue60}, ${overdue90}
      )
      ON CONFLICT ("clientId")
      DO UPDATE SET
        "totalInvoiced" = ${totalInvoiced},
        "totalPaid" = ${totalPaid},
        "totalOutstanding" = ${totalOutstanding},
        "currentBalance" = ${totalOutstanding},
        "overdue30" = ${overdue30},
        "overdue60" = ${overdue60},
        "overdue90" = ${overdue90},
        "lastUpdated" = ${new Date()}
    `;
  } catch (error) {
    console.error("Error updating client balance summary:", error);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");

  try {
    const where: any = {};
    if (invoiceId) where.invoiceId = parseInt(invoiceId);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        Invoice: {
          select: {
            invoiceNumber: true,
            Client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
