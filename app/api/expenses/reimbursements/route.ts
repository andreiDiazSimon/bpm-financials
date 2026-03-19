import { NextRequest, NextResponse } from "next/server";
import { prismaHr2 } from "@/lib/prisma-hr2";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      expenseReportId,
      reimbursementAmount,
      paymentMethod,
      paymentDate,
      status,
    } = body;

    if (!expenseReportId || !reimbursementAmount || !paymentMethod || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if expense report exists
    const expenseReport = await prismaHr2.expense_reports.findUnique({
      where: { id: expenseReportId },
    });

    if (!expenseReport) {
      return NextResponse.json(
        { error: "Expense report not found" },
        { status: 404 }
      );
    }

    // Check if reimbursement already exists in hr2
    const existingReimbursement = await prismaHr2.reimbursements.findUnique({
      where: { expenseReportId },
    });

    let reimbursement;

    if (existingReimbursement) {
      // Update existing reimbursement in hr2
      reimbursement = await prismaHr2.reimbursements.update({
        where: { expenseReportId },
        data: {
          reimbursementAmount: parseFloat(reimbursementAmount),
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          status,
          updatedAt: new Date(),
        },
        include: {
          expense_reports: {
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
          },
        },
      });

      // Update expense report status based on reimbursement status
      let expenseStatus = expenseReport.status;
      if (status === "Processed") {
        expenseStatus = "Approved";
      } else if (status === "Paid") {
        expenseStatus = "Paid";
      }

      await prismaHr2.expense_reports.update({
        where: { id: expenseReportId },
        data: {
          status: expenseStatus,
          updatedAt: new Date(),
        },
      });

      // Also update in user's own database (financials schema)
      const existingFinancialReimbursement = await prisma.reimbursement.findUnique({
        where: { expenseReportId },
      });

      if (existingFinancialReimbursement) {
        await prisma.reimbursement.update({
          where: { expenseReportId },
          data: {
            reimbursementAmount: parseFloat(reimbursementAmount),
            paymentMethod,
            paymentDate: paymentDate ? new Date(paymentDate) : null,
            status,
            hr2ReimbursementId: reimbursement.id,
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // Create new reimbursement in hr2
      const id = `REIM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      reimbursement = await prismaHr2.reimbursements.create({
        data: {
          id,
          expenseReportId,
          reimbursementAmount: parseFloat(reimbursementAmount),
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          status,
          payrollSyncStatus: "Not_Sent",
          financialsSyncStatus: "Not_Sent",
          updatedAt: new Date(),
        },
        include: {
          expense_reports: {
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
          },
        },
      });

      // Update expense report status
      let expenseStatus = "Under_Review";
      if (status === "Processed") {
        expenseStatus = "Approved";
      } else if (status === "Paid") {
        expenseStatus = "Paid";
      }

      await prismaHr2.expense_reports.update({
        where: { id: expenseReportId },
        data: {
          status: expenseStatus,
          updatedAt: new Date(),
        },
      });

      // Also create in user's own database (financials schema)
      await prisma.reimbursement.create({
        data: {
          id: reimbursement.id,
          expenseReportId,
          reimbursementAmount: parseFloat(reimbursementAmount),
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          status,
          sourceSystem: "hr2",
          hr2ReimbursementId: reimbursement.id,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(reimbursement, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating reimbursement:", error);
    return NextResponse.json(
      { error: "Failed to create/update reimbursement" },
      { status: 500 }
    );
  }
}
