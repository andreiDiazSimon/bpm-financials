import { NextRequest, NextResponse } from "next/server";
import { prismaHr2 } from "@/lib/prisma-hr2";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const where: any = {};
    
    if (status && status !== "all") {
      where.status = status;
    }
    
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const expenses = await prismaHr2.expense_reports.findMany({
      where,
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        claim_validations: true,
        reimbursements: true,
        documents: true,
      },
      orderBy: {
        submissionDate: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle sync action to fetch data from HR2
    if (action === "sync") {
      // For now, just return success - the data is already fetched via GET
      // In a real scenario, this could trigger a sync job or refresh cached data
      const expenses = await prismaHr2.expense_reports.findMany({
        orderBy: { submissionDate: "desc" },
      });
      
      return NextResponse.json({ 
        success: true, 
        syncedCount: expenses.length,
        message: "Data fetched from HR2 database successfully"
      });
    }

    const {
      employeeId,
      expenseCategory,
      totalAmount,
      description,
      expenseDate,
    } = body;

    if (!employeeId || !expenseCategory || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const expense = await prismaHr2.expense_reports.create({
      data: {
        id,
        employeeId,
        expenseCategory,
        totalAmount: parseFloat(totalAmount),
        description: description || "",
        submissionDate: expenseDate ? new Date(expenseDate) : new Date(),
        status: "Submitted",
        updatedAt: new Date(),
      },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
