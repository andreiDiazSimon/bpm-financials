import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Default Chart of Accounts for Crane and Trucking Business
const defaultAccounts = [
  // ASSETS (1000-1999)
  { code: "1000", name: "Cash", type: "ASSET", category: "CURRENT_ASSET" },
  { code: "1010", name: "Bank Account", type: "ASSET", category: "CURRENT_ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET", category: "CURRENT_ASSET" },
  { code: "1200", name: "Trade Receivables", type: "ASSET", category: "CURRENT_ASSET" },
  { code: "1500", name: "Equipment", type: "ASSET", category: "FIXED_ASSET" },
  { code: "1510", name: "Accumulated Depreciation - Equipment", type: "ASSET", category: "FIXED_ASSET" },
  
  // LIABILITIES (2000-2999)
  { code: "2000", name: "Accounts Payable", type: "LIABILITY", category: "CURRENT_LIABILITY" },
  { code: "2100", name: "VAT Payable", type: "LIABILITY", category: "CURRENT_LIABILITY" },
  { code: "2200", name: "Withholding Tax Payable", type: "LIABILITY", category: "CURRENT_LIABILITY" },
  { code: "2300", name: "Salaries Payable", type: "LIABILITY", category: "CURRENT_LIABILITY" },
  { code: "2500", name: "Loans Payable", type: "LIABILITY", category: "LONG_TERM_LIABILITY" },
  
  // EQUITY (3000-3999)
  { code: "3000", name: "Owner's Capital", type: "EQUITY", category: "EQUITY" },
  { code: "3100", name: "Retained Earnings", type: "EQUITY", category: "EQUITY" },
  { code: "3200", name: "Owner's Drawings", type: "EQUITY", category: "EQUITY" },
  
  // REVENUE (4000-4999)
  { code: "4000", name: "Service Revenue", type: "REVENUE", category: "REVENUE" },
  { code: "4100", name: "Equipment Rental Revenue", type: "REVENUE", category: "REVENUE" },
  { code: "4200", name: "Transportation Revenue", type: "REVENUE", category: "REVENUE" },
  
  // EXPENSES (5000-5999)
  { code: "5000", name: "Fuel Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5100", name: "Maintenance Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5200", name: "Salaries and Wages", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5300", name: "Rent Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5400", name: "Utilities Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5500", name: "Insurance Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5600", name: "Depreciation Expense", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5700", name: "Office Supplies", type: "EXPENSE", category: "OPERATING_EXPENSE" },
  { code: "5800", name: "Permits and Licenses", type: "EXPENSE", category: "OPERATING_EXPENSE" },
];

async function ensureDefaultAccounts() {
  try {
    // Check if accounts exist
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "financials"."Account"
    `;
    
    if ((countResult as any[])[0].count > 0) {
      return; // Already initialized
    }

    // Create default accounts
    for (const account of defaultAccounts) {
      await prisma.$queryRaw`
        INSERT INTO "financials"."Account" (
          "code", "name", "type", "category", "openingBalance", "currentBalance", "isActive"
        ) VALUES (
          ${account.code}, ${account.name}, ${account.type}, ${account.category}, 0, 0, true
        )
      `;
    }
  } catch (error) {
    console.error("Error creating default accounts:", error);
  }
}

// Chart of Accounts
export async function GET(req: Request) {
  try {
    // Auto-create default accounts if needed
    await ensureDefaultAccounts();

    const accounts = await prisma.$queryRaw`
      SELECT * FROM "financials"."Account"
      ORDER BY code ASC
    `;

    // Build hierarchical structure
    const accountMap = new Map();
    (accounts as any[]).forEach((acc) => {
      accountMap.set(acc.id, { ...acc, children: [] });
    });

    const rootAccounts: any[] = [];
    accountMap.forEach((acc) => {
      if (acc.parentId) {
        const parent = accountMap.get(acc.parentId);
        if (parent) {
          parent.children.push(acc);
        }
      } else {
        rootAccounts.push(acc);
      }
    });

    return NextResponse.json(rootAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, type, category, parentId, description, openingBalance } = body;

    if (!code || !name || !type || !category) {
      return NextResponse.json(
        { error: "Missing required fields: code, name, type, category" },
        { status: 400 }
      );
    }

    const account = await prisma.$queryRaw`
      INSERT INTO "financials"."Account" (
        "code", "name", "type", "category", "parentId", "description", "openingBalance", "currentBalance"
      ) VALUES (
        ${code}, ${name}, ${type}, ${category}, ${parentId || null}, ${description || null}, 
        ${openingBalance || 0}, ${openingBalance || 0}
      )
      RETURNING *
    `;

    return NextResponse.json((account as any[])[0]);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
