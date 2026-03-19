import { prismaCore3 } from "./prisma-core3";

// Types for Ledger
export interface LedgerAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentId: number | null;
  isActive: boolean;
  description: string | null;
  normalBalance: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: Date;
  description: string;
  reference: string | null;
  sourceType: string | null;
  sourceId: string | null;
  status: string;
  totalDebit: any;
  totalCredit: any;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  postedAt: Date | null;
}

export interface JournalLineItem {
  id: number;
  journalEntryId: number;
  accountId: number;
  debit: any;
  credit: any;
  description: string | null;
  createdAt: Date;
  account?: LedgerAccount;
}

// Helper to convert Decimal to number
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

// Get all ledger accounts
export async function getLedgerAccounts(options?: {
  type?: string;
  active?: boolean;
  parentId?: number | null;
}): Promise<LedgerAccount[]> {
  const where: any = {};
  
  if (options?.type) {
    where.accountType = options.type;
  }
  
  if (options?.active !== undefined) {
    where.isActive = options.active;
  }
  
  if (options?.parentId !== undefined) {
    where.parentId = options.parentId;
  }

  const accounts = await prismaCore3.ledgerAccount.findMany({
    where,
    orderBy: [{ accountType: "asc" }, { accountCode: "asc" }],
  });

  return accounts.map((acc) => ({
    ...acc,
    parentId: acc.parentId as number | null,
  }));
}

// Get journal entries
export async function getJournalEntries(options?: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  accountId?: number;
}): Promise<JournalEntry[]> {
  const where: any = {};
  
  if (options?.startDate || options?.endDate) {
    where.entryDate = {};
    if (options.startDate) where.entryDate.gte = options.startDate;
    if (options.endDate) where.entryDate.lte = options.endDate;
  }
  
  if (options?.status) {
    where.status = options.status;
  }

  const entries = await prismaCore3.journalEntry.findMany({
    where,
    include: {
      JournalLineItem: {
        include: {
          LedgerAccount: true,
        },
      },
    },
    orderBy: { entryDate: "desc" },
  });

  return entries.map((entry) => ({
    ...entry,
    totalDebit: toNumber(entry.totalDebit),
    totalCredit: toNumber(entry.totalCredit),
  }));
}

// Get account balances
export async function getAccountBalances(startDate?: Date, endDate?: Date) {
  const where: any = {
    status: "POSTED",
  };
  
  if (startDate || endDate) {
    where.entryDate = {};
    if (startDate) where.entryDate.gte = startDate;
    if (endDate) where.entryDate.lte = endDate;
  }

  const entries = await prismaCore3.journalEntry.findMany({
    where,
    include: {
      JournalLineItem: true,
    },
  });

  // Calculate balances per account
  const balances: Record<number, { accountId: number; accountCode: string; accountName: string; totalDebit: number; totalCredit: number }> = {};
  
  for (const entry of entries) {
    for (const line of entry.JournalLineItem) {
      if (!balances[line.accountId]) {
        const account = await prismaCore3.ledgerAccount.findUnique({
          where: { id: line.accountId },
        });
        balances[line.accountId] = {
          accountId: line.accountId,
          accountCode: account?.accountCode || "",
          accountName: account?.accountName || "",
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      balances[line.accountId].totalDebit += toNumber(line.debit);
      balances[line.accountId].totalCredit += toNumber(line.credit);
    }
  }

  return Object.values(balances).map((b) => ({
    ...b,
    balance: b.totalDebit - b.totalCredit,
  }));
}

// Create journal entry
export async function createJournalEntry(data: {
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  lines: { accountId: number; debit: number; credit: number; description?: string }[];
  createdBy?: string;
}): Promise<JournalEntry> {
  // Generate entry number
  const count = await prismaCore3.journalEntry.count();
  const entryNumber = `JE-${String(count + 1).padStart(6, "0")}`;

  // Validate debits = credits
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error("Debits must equal credits");
  }

  const entry = await prismaCore3.journalEntry.create({
    data: {
      entryNumber,
      entryDate: data.entryDate,
      description: data.description,
      reference: data.reference,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      status: "DRAFT",
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      createdBy: data.createdBy,
      JournalLineItem: {
        create: data.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
      },
    },
    include: {
      JournalLineItem: true,
    },
  });

  return {
    ...entry,
    totalDebit: toNumber(entry.totalDebit),
    totalCredit: toNumber(entry.totalCredit),
  };
}

// Post journal entry
export async function postJournalEntry(entryId: number): Promise<JournalEntry> {
  const entry = await prismaCore3.journalEntry.findUnique({
    where: { id: entryId },
    include: { JournalLineItem: true },
  });

  if (!entry) {
    throw new Error("Journal entry not found");
  }

  if (entry.status === "POSTED") {
    throw new Error("Entry is already posted");
  }

  const updated = await prismaCore3.journalEntry.update({
    where: { id: entryId },
    data: {
      status: "POSTED",
      postedAt: new Date(),
    },
  });

  return {
    ...updated,
    totalDebit: toNumber(updated.totalDebit),
    totalCredit: toNumber(updated.totalCredit),
  };
}

// Void journal entry
export async function voidJournalEntry(entryId: number): Promise<JournalEntry> {
  const entry = await prismaCore3.journalEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new Error("Journal entry not found");
  }

  if (entry.status === "VOIDED") {
    throw new Error("Entry is already voided");
  }

  const updated = await prismaCore3.journalEntry.update({
    where: { id: entryId },
    data: {
      status: "VOIDED",
    },
  });

  return {
    ...updated,
    totalDebit: toNumber(updated.totalDebit),
    totalCredit: toNumber(updated.totalCredit),
  };
}

// Seed default chart of accounts
export async function seedDefaultAccounts() {
  const existingCount = await prismaCore3.ledgerAccount.count();
  if (existingCount > 0) {
    return { message: "Accounts already seeded" };
  }

  const defaultAccounts = [
    // Assets (1000s)
    { accountCode: "1000", accountName: "Assets", accountType: "ASSET", normalBalance: "DEBIT" },
    { accountCode: "1100", accountName: "Cash", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1000" },
    { accountCode: "1101", accountName: "Cash on Hand", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1100" },
    { accountCode: "1102", accountName: "Cash in Bank", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1100" },
    { accountCode: "1200", accountName: "Accounts Receivable", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1000" },
    { accountCode: "1300", accountName: "Equipment", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1000" },
    { accountCode: "1400", accountName: "Prepaid Expenses", accountType: "ASSET", normalBalance: "DEBIT", parentCode: "1000" },
    
    // Liabilities (2000s)
    { accountCode: "2000", accountName: "Liabilities", accountType: "LIABILITY", normalBalance: "CREDIT" },
    { accountCode: "2100", accountName: "Accounts Payable", accountType: "LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
    { accountCode: "2200", accountName: "Notes Payable", accountType: "LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
    { accountCode: "2300", accountName: "Accrued Expenses", accountType: "LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
    
    // Equity (3000s)
    { accountCode: "3000", accountName: "Equity", accountType: "EQUITY", normalBalance: "CREDIT" },
    { accountCode: "3100", accountName: "Owner's Equity", accountType: "EQUITY", normalBalance: "CREDIT", parentCode: "3000" },
    { accountCode: "3200", accountName: "Retained Earnings", accountType: "EQUITY", normalBalance: "CREDIT", parentCode: "3000" },
    
    // Revenue (4000s)
    { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalBalance: "CREDIT" },
    { accountCode: "4100", accountName: "Service Revenue", accountType: "REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
    { accountCode: "4200", accountName: "Rental Revenue", accountType: "REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
    
    // Expenses (5000s)
    { accountCode: "5000", accountName: "Expenses", accountType: "EXPENSE", normalBalance: "DEBIT" },
    { accountCode: "5100", accountName: "Direct Costs", accountType: "EXPENSE", normalBalance: "DEBIT", parentCode: "5000" },
    { accountCode: "5200", accountName: "Operating Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", parentCode: "5000" },
    { accountCode: "5300", accountName: "Payroll Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", parentCode: "5200" },
    { accountCode: "5400", accountName: "Maintenance Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", parentCode: "5200" },
    { accountCode: "5500", accountName: "Fuel Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", parentCode: "5200" },
  ];

  // First create parent accounts
  const accountMap: Record<string, number> = {};
  
  for (const acc of defaultAccounts) {
    if (!acc.parentCode) {
      const created = await prismaCore3.ledgerAccount.create({
        data: {
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType as any,
          normalBalance: acc.normalBalance as any,
        },
      });
      accountMap[acc.accountCode] = created.id;
    }
  }
  
  // Then create child accounts
  for (const acc of defaultAccounts) {
    if (acc.parentCode) {
      await prismaCore3.ledgerAccount.create({
        data: {
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType as any,
          normalBalance: acc.normalBalance as any,
          parentId: accountMap[acc.parentCode],
        },
      });
    }
  }

  return { message: "Default accounts seeded successfully" };
}
