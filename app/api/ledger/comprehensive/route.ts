import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Fetch all invoices with client info and payments
    const invoices = await prisma.invoice.findMany({
      include: {
        Client: {
          select: { id: true, name: true, email: true }
        },
        Payment: true,
        InvoiceLineItem: true,
      },
      orderBy: { issueDate: "desc" },
    });

    // Fetch all payments with invoice info
    const payments = await prisma.payment.findMany({
      include: {
        Invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            Client: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { paymentDate: "desc" },
    });

    // Fetch all journal entries
    let journalEntries: any[] = [];
    try {
      const jeResult = await prisma.$queryRaw`
        SELECT 
          je.*,
          json_agg(
            json_build_object(
              'id', jel.id,
              'accountId', jel."accountId",
              'accountCode', a.code,
              'accountName', a.name,
              'debit', jel.debit,
              'credit', jel.credit
            ) ORDER BY jel.id
          ) as lines
        FROM "financials"."JournalEntry" je
        LEFT JOIN "financials"."JournalEntryLine" jel ON je.id = jel."journalEntryId"
        LEFT JOIN "financials"."Account" a ON jel."accountId" = a.id
        GROUP BY je.id
        ORDER BY je.date DESC, je.id DESC
        LIMIT 100
      `;
      journalEntries = jeResult as any[];
    } catch (e) {
      // Journal entries table might not exist yet
    }

    // Fetch accounts
    let accounts: any[] = [];
    try {
      const accResult = await prisma.$queryRaw`
        SELECT * FROM "financials"."Account" ORDER BY code ASC
      `;
      accounts = accResult as any[];
    } catch (e) {
      // Accounts table might not exist yet
    }

    // Process invoices into ledger format
    const invoiceLedger = invoices.map(inv => {
      const totalPaid = inv.Payment.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(inv.totalAmount) - totalPaid;
      
      return {
        type: 'INVOICE',
        id: inv.id,
        date: inv.issueDate,
        number: inv.invoiceNumber,
        description: `Invoice to ${inv.Client.name} - ${inv.projectName}`,
        clientName: inv.Client.name,
        amount: Number(inv.totalAmount),
        amountPaid: totalPaid,
        balanceDue: balanceDue,
        status: inv.status,
        reference: inv.invoiceNumber,
        glEntries: [
          { account: '1200 - Accounts Receivable', debit: Number(inv.totalAmount), credit: 0 },
          { account: '4000 - Service Revenue', debit: 0, credit: Number(inv.totalAmount) },
        ]
      };
    });

    // Process payments into ledger format
    const paymentLedger = payments.map(pay => {
      return {
        type: 'PAYMENT',
        id: pay.id,
        date: pay.paymentDate,
        number: `PAY-${pay.id}`,
        description: `Payment received - ${pay.Invoice?.Client?.name || 'Unknown'}`,
        clientName: pay.Invoice?.Client?.name || 'Unknown',
        amount: Number(pay.amount),
        paymentMethod: pay.paymentMethod,
        reference: pay.reference || pay.Invoice?.invoiceNumber,
        status: 'COMPLETED',
        glEntries: [
          { account: '1000 - Cash', debit: Number(pay.amount), credit: 0 },
          { account: '1200 - Accounts Receivable', debit: 0, credit: Number(pay.amount) },
        ]
      };
    });

    // Combine all transactions
    const allTransactions = [
      ...invoiceLedger,
      ...paymentLedger,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalOutstanding = totalInvoiced - totalPaid;

    return NextResponse.json({
      transactions: allTransactions,
      invoices: invoiceLedger,
      payments: paymentLedger,
      journalEntries,
      accounts,
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
      }
    });

  } catch (error) {
    console.error("Error fetching comprehensive ledger:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger data" },
      { status: 500 }
    );
  }
}
