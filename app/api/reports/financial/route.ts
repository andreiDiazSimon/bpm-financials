import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const reportType = searchParams.get("type") || "all";

  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch all invoices in date range
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        Payment: true,
        Client: true,
      },
    });

    // Fetch all payments in date range
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        Invoice: {
          include: {
            Client: true,
          },
        },
      },
    });

    // Calculate Income Statement
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    
    // For expenses, we'll use maintenance logs and other expenses
    const maintenanceLogs = await prisma.maintenanceLog.findMany({
      where: {
        completedAt: {
          gte: start,
          lte: end,
        },
        cost: {
          not: null,
        },
      },
    });

    const maintenanceExpenses = maintenanceLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0);
    
    // Group expenses by type (simplified)
    const expenses = {
      maintenance: maintenanceExpenses,
      fuel: 0, // Would come from fuel expense records
      salaries: 0, // Would come from payroll
      rent: 0,
      utilities: 0,
      insurance: 0,
      other: 0,
    };

    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const netIncome = totalRevenue - totalExpenses;

    // Calculate Balance Sheet
    const allInvoices = await prisma.invoice.findMany({
      include: { Payment: true },
    });

    const totalAR = allInvoices.reduce((sum, inv) => {
      const paid = inv.Payment.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.totalAmount) - paid);
    }, 0);

    const totalCash = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Fetch equipment value
    const equipment = await prisma.equipment.findMany();
    const equipmentValue = equipment.reduce((sum, eq) => sum + 100000, 0); // Placeholder value

    const balanceSheet = {
      assets: {
        current: {
          cash: totalCash,
          accountsReceivable: totalAR,
          totalCurrent: totalCash + totalAR,
        },
        fixed: {
          equipment: equipmentValue,
          totalFixed: equipmentValue,
        },
        totalAssets: totalCash + totalAR + equipmentValue,
      },
      liabilities: {
        current: {
          accountsPayable: 0, // Would come from bills
          vatPayable: totalRevenue * 0.12,
          totalCurrent: totalRevenue * 0.12,
        },
        longTerm: {
          loans: 0,
          totalLongTerm: 0,
        },
        totalLiabilities: totalRevenue * 0.12,
      },
      equity: {
        ownerCapital: 0,
        retainedEarnings: netIncome,
        totalEquity: netIncome,
      },
    };

    // Calculate Cash Flow
    const cashFlow = {
      operating: {
        cashReceived: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        cashPaid: 0,
        netOperating: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      },
      investing: {
        equipmentPurchases: 0,
        netInvesting: 0,
      },
      financing: {
        ownerContributions: 0,
        loanProceeds: 0,
        netFinancing: 0,
      },
      netChange: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    };

    // Expense Summary
    const expenseSummary = {
      categories: [
        { name: "Maintenance", amount: expenses.maintenance },
        { name: "Fuel", amount: expenses.fuel },
        { name: "Salaries", amount: expenses.salaries },
        { name: "Rent", amount: expenses.rent },
        { name: "Utilities", amount: expenses.utilities },
        { name: "Insurance", amount: expenses.insurance },
        { name: "Other", amount: expenses.other },
      ],
      total: totalExpenses,
    };

    // Tax Summary
    const taxSummary = {
      vatOnSales: totalRevenue * 0.12,
      vatOnPurchases: totalExpenses * 0.12,
      netVatPayable: (totalRevenue - totalExpenses) * 0.12,
      withholdingTax: totalRevenue * 0.02, // Simplified
      incomeTax: netIncome > 0 ? netIncome * 0.30 : 0,
    };

    const reports = {
      period: { start, end },
      incomeStatement: {
        revenue: totalRevenue,
        expenses,
        totalExpenses,
        netIncome,
        grossProfit: totalRevenue,
        operatingIncome: netIncome,
      },
      balanceSheet,
      cashFlow,
      expenseSummary,
      taxSummary,
      summary: {
        totalRevenue,
        totalExpenses,
        netIncome,
        totalAR,
        totalCash,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
      },
    };

    return NextResponse.json(reports);

  } catch (error) {
    console.error("Error generating financial reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
