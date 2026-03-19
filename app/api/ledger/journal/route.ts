import { NextResponse } from "next/server";
import { 
  getLedgerAccounts, 
  getJournalEntries, 
  createJournalEntry, 
  postJournalEntry, 
  voidJournalEntry,
  getAccountBalances,
  seedDefaultAccounts 
} from "@/lib/ledger";

// GET - Fetch journal entries or accounts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "entries", "accounts", "balances"
    const status = searchParams.get("status");
    const accountType = searchParams.get("accountType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const accountId = searchParams.get("accountId");

    if (type === "accounts") {
      const accounts = await getLedgerAccounts({
        type: accountType || undefined,
        active: true,
      });
      return NextResponse.json(accounts);
    }

    if (type === "balances") {
      const balances = await getAccountBalances(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json(balances);
    }

    // Default: fetch journal entries
    const entries = await getJournalEntries({
      status: status || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      accountId: accountId ? parseInt(accountId) : undefined,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Create journal entry or seed accounts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "seed") {
      const result = await seedDefaultAccounts();
      return NextResponse.json(result);
    }

    if (action === "post") {
      const entry = await postJournalEntry(data.entryId);
      return NextResponse.json({ success: true, entry });
    }

    if (action === "void") {
      const entry = await voidJournalEntry(data.entryId);
      return NextResponse.json({ success: true, entry });
    }

    // Default: create journal entry
    if (!data.entryDate || !data.description || !data.lines || !data.lines.length) {
      return NextResponse.json(
        { error: "Missing required fields: entryDate, description, lines" },
        { status: 400 }
      );
    }

    const entry = await createJournalEntry({
      entryDate: new Date(data.entryDate),
      description: data.description,
      reference: data.reference,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      lines: data.lines,
      createdBy: data.createdBy,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
