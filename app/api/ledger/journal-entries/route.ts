import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    let query = `
      SELECT 
        je.*,
        json_agg(
          json_build_object(
            'id', jel.id,
            'accountId', jel."accountId",
            'accountCode', a.code,
            'accountName', a.name,
            'description', jel.description,
            'debit', jel.debit,
            'credit', jel.credit
          ) ORDER BY jel.id
        ) as lines
      FROM "financials"."JournalEntry" je
      LEFT JOIN "financials"."JournalEntryLine" jel ON je.id = jel."journalEntryId"
      LEFT JOIN "financials"."Account" a ON jel."accountId" = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      query += ` AND je.date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND je.date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY je.id ORDER BY je.date DESC, je.id DESC`;

    const entries = params.length > 0
      ? await prisma.$queryRawUnsafe(query, ...params)
      : await prisma.$queryRawUnsafe(query);

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, description, referenceType, referenceId, lines } = body;

    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "Journal entry must have at least 2 lines (debit and credit)" },
        { status: 400 }
      );
    }

    // Validate double-entry (total debits = total credits)
    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `Debits (${totalDebit}) must equal Credits (${totalCredit})` },
        { status: 400 }
      );
    }

    if (totalDebit === 0) {
      return NextResponse.json(
        { error: "Journal entry must have a non-zero amount" },
        { status: 400 }
      );
    }

    // Generate entry number
    const entryNumber = `JE-${Date.now()}`;

    // Create journal entry
    const entry = await prisma.$queryRaw`
      INSERT INTO "financials"."JournalEntry" (
        "entryNumber", "date", "description", "referenceType", "referenceId",
        "totalDebit", "totalCredit", "createdBy"
      ) VALUES (
        ${entryNumber}, ${date ? new Date(date) : new Date()}, ${description}, 
        ${referenceType || null}, ${referenceId || null},
        ${totalDebit}, ${totalCredit}, 'System'
      )
      RETURNING *
    `;

    const journalEntryId = (entry as any[])[0].id;

    // Create journal entry lines
    for (const line of lines) {
      if ((line.debit > 0 || line.credit > 0) && line.accountId) {
        await prisma.$queryRaw`
          INSERT INTO "financials"."JournalEntryLine" (
            "journalEntryId", "accountId", "description", "debit", "credit"
          ) VALUES (
            ${journalEntryId}, ${parseInt(line.accountId)}, ${line.description || description}, 
            ${Number(line.debit) || 0}, ${Number(line.credit) || 0}
          )
        `;

        // Update account balance
        const balanceChange = (Number(line.debit) || 0) - (Number(line.credit) || 0);
        await prisma.$queryRaw`
          UPDATE "financials"."Account"
          SET "currentBalance" = "currentBalance" + ${balanceChange},
              "updatedAt" = ${new Date()}
          WHERE id = ${parseInt(line.accountId)}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      entry: (entry as any[])[0],
    });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
