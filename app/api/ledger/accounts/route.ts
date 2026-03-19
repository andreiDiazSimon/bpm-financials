import { NextResponse } from "next/server";
import { prismaCore3 } from "@/lib/prisma-core3";

// GET - Fetch all ledger accounts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get("type");
    const isActive = searchParams.get("active");
    const parentId = searchParams.get("parentId");

    const where: any = {};
    
    if (accountType) {
      where.accountType = accountType;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    
    if (parentId) {
      where.parentId = parentId === "null" ? null : parseInt(parentId);
    }

    const accounts = await prismaCore3.ledgerAccount.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
        children: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
      },
      orderBy: [{ accountType: "asc" }, { accountCode: "asc" }],
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching ledger accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger accounts" },
      { status: 500 }
    );
  }
}

// POST - Create a new ledger account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountCode, accountName, accountType, parentId, description, normalBalance } = body;

    if (!accountCode || !accountName || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields: accountCode, accountName, accountType" },
        { status: 400 }
      );
    }

    // Check if account code already exists
    const existing = await prismaCore3.ledgerAccount.findUnique({
      where: { accountCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Account code already exists" },
        { status: 400 }
      );
    }

    const account = await prismaCore3.ledgerAccount.create({
      data: {
        accountCode,
        accountName,
        accountType,
        parentId: parentId ? parseInt(parentId) : null,
        description,
        normalBalance: normalBalance || (accountType === "REVENUE" || accountType === "LIABILITY" || accountType === "EQUITY" ? "CREDIT" : "DEBIT"),
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error creating ledger account:", error);
    return NextResponse.json(
      { error: "Failed to create ledger account" },
      { status: 500 }
    );
  }
}
