import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Auto-post transactions from other modules to General Ledger
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionType, referenceId, amount, description, date } = body;

    if (!transactionType || !amount || !referenceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let journalEntry;

    switch (transactionType) {
      case "INVOICE_CREATED":
        journalEntry = await postInvoiceTransaction(referenceId, amount, description, date);
        break;
      case "PAYMENT_RECEIVED":
        journalEntry = await postPaymentTransaction(referenceId, amount, description, date);
        break;
      case "EXPENSE_RECORDED":
        journalEntry = await postExpenseTransaction(referenceId, amount, description, date);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown transaction type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      journalEntry,
    });
  } catch (error) {
    console.error("Error auto-posting transaction:", error);
    return NextResponse.json(
      { error: "Failed to post transaction" },
      { status: 500 }
    );
  }
}

async function postInvoiceTransaction(invoiceId: number, amount: number, description: string, date: string) {
  // Get the accounts
  const accounts = await prisma.$queryRaw`
    SELECT * FROM "financials"."Account" WHERE code IN ('1200', '4000')
  `;
  
  const arAccount = (accounts as any[]).find(a => a.code === '1200');
  const revenueAccount = (accounts as any[]).find(a => a.code === '4000');

  if (!arAccount || !revenueAccount) {
    throw new Error("Required GL accounts not found. Please run chart of accounts setup.");
  }

  const entryNumber = `JE-INV-${Date.now()}`;

  // Create journal entry: Debit AR, Credit Revenue
  const entry = await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntry" (
      "entryNumber", "date", "description", "referenceType", "referenceId",
      "totalDebit", "totalCredit", "isPosted", "postedAt", "createdBy"
    ) VALUES (
      ${entryNumber}, ${date ? new Date(date) : new Date()}, ${description || 'Invoice posted'}, 
      'INVOICE', ${invoiceId}, ${amount}, ${amount}, true, ${new Date()}, 'System'
    )
    RETURNING *
  `;

  const journalEntryId = (entry as any[])[0].id;

  // Debit Accounts Receivable
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${arAccount.id}, ${description || 'Invoice posted'}, ${amount}, 0
    )
  `;

  // Credit Revenue
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${revenueAccount.id}, ${description || 'Invoice posted'}, 0, ${amount}
    )
  `;

  // Update account balances
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" + ${amount}, "updatedAt" = ${new Date()} WHERE id = ${arAccount.id}
  `;
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" - ${amount}, "updatedAt" = ${new Date()} WHERE id = ${revenueAccount.id}
  `;

  return (entry as any[])[0];
}

async function postPaymentTransaction(paymentId: number, amount: number, description: string, date: string) {
  // Get the accounts
  const accounts = await prisma.$queryRaw`
    SELECT * FROM "financials"."Account" WHERE code IN ('1000', '1200')
  `;
  
  const cashAccount = (accounts as any[]).find(a => a.code === '1000');
  const arAccount = (accounts as any[]).find(a => a.code === '1200');

  if (!cashAccount || !arAccount) {
    throw new Error("Required GL accounts not found. Please run chart of accounts setup.");
  }

  const entryNumber = `JE-PAY-${Date.now()}`;

  // Create journal entry: Debit Cash, Credit AR
  const entry = await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntry" (
      "entryNumber", "date", "description", "referenceType", "referenceId",
      "totalDebit", "totalCredit", "isPosted", "postedAt", "createdBy"
    ) VALUES (
      ${entryNumber}, ${date ? new Date(date) : new Date()}, ${description || 'Payment received'}, 
      'PAYMENT', ${paymentId}, ${amount}, ${amount}, true, ${new Date()}, 'System'
    )
    RETURNING *
  `;

  const journalEntryId = (entry as any[])[0].id;

  // Debit Cash
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${cashAccount.id}, ${description || 'Payment received'}, ${amount}, 0
    )
  `;

  // Credit Accounts Receivable
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${arAccount.id}, ${description || 'Payment received'}, 0, ${amount}
    )
  `;

  // Update account balances
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" + ${amount}, "updatedAt" = ${new Date()} WHERE id = ${cashAccount.id}
  `;
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" - ${amount}, "updatedAt" = ${new Date()} WHERE id = ${arAccount.id}
  `;

  return (entry as any[])[0];
}

async function postExpenseTransaction(expenseId: number, amount: number, description: string, date: string) {
  // Get the accounts
  const accounts = await prisma.$queryRaw`
    SELECT * FROM "financials"."Account" WHERE code IN ('5000', '1000')
  `;
  
  const expenseAccount = (accounts as any[]).find(a => a.code === '5000');
  const cashAccount = (accounts as any[]).find(a => a.code === '1000');

  if (!expenseAccount || !cashAccount) {
    throw new Error("Required GL accounts not found. Please run chart of accounts setup.");
  }

  const entryNumber = `JE-EXP-${Date.now()}`;

  // Create journal entry: Debit Expense, Credit Cash
  const entry = await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntry" (
      "entryNumber", "date", "description", "referenceType", "referenceId",
      "totalDebit", "totalCredit", "isPosted", "postedAt", "createdBy"
    ) VALUES (
      ${entryNumber}, ${date ? new Date(date) : new Date()}, ${description || 'Expense recorded'}, 
      'EXPENSE', ${expenseId}, ${amount}, ${amount}, true, ${new Date()}, 'System'
    )
    RETURNING *
  `;

  const journalEntryId = (entry as any[])[0].id;

  // Debit Expense
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${expenseAccount.id}, ${description || 'Expense recorded'}, ${amount}, 0
    )
  `;

  // Credit Cash
  await prisma.$queryRaw`
    INSERT INTO "financials"."JournalEntryLine" (
      "journalEntryId", "accountId", "description", "debit", "credit"
    ) VALUES (
      ${journalEntryId}, ${cashAccount.id}, ${description || 'Expense recorded'}, 0, ${amount}
    )
  `;

  // Update account balances
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" + ${amount}, "updatedAt" = ${new Date()} WHERE id = ${expenseAccount.id}
  `;
  await prisma.$queryRaw`
    UPDATE "financials"."Account" SET "currentBalance" = "currentBalance" - ${amount}, "updatedAt" = ${new Date()} WHERE id = ${cashAccount.id}
  `;

  return (entry as any[])[0];
}
