"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function FinancialReporting() {
  const [activeReport, setActiveReport] = useState<"income" | "balance" | "cashflow" | "expenses" | "tax">("income");
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0067b8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5c5c5c]">Generating financial reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Financial Reporting</h1>
          <p className="text-[#5c5c5c] mt-1">Generate official financial statements for management and compliance</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5c5c5c]" />
            <span className="text-sm font-medium text-[#1a1a1a]">Report Period:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8]"
            />
            <span className="text-[#5c5c5c]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8]"
            />
          </div>
          {reports?.period && (
            <span className="text-sm text-[#5c5c5c]">
              {formatDate(reports.period.start)} - {formatDate(reports.period.end)}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {reports?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5c5c5c]">Total Revenue</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">
                  {formatCurrency(reports.summary.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-[#5c5c5c] mt-2">{reports.summary.invoiceCount} invoices</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5c5c5c]">Total Expenses</p>
                <p className="text-2xl font-semibold text-red-600 mt-1">
                  {formatCurrency(reports.summary.totalExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5c5c5c]">Net Income</p>
                <p className={`text-2xl font-semibold mt-1 ${reports.summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(reports.summary.netIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5c5c5c]">Cash Position</p>
                <p className="text-2xl font-semibold text-purple-600 mt-1">
                  {formatCurrency(reports.summary.totalCash)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-[#5c5c5c] mt-2">{reports.summary.paymentCount} payments</p>
          </div>
        </div>
      )}

      {/* Report Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap">
            {[
              { id: "income", label: "Income Statement", icon: BarChart3 },
              { id: "balance", label: "Balance Sheet", icon: FileText },
              { id: "cashflow", label: "Cash Flow", icon: TrendingUp },
              { id: "expenses", label: "Expense Summary", icon: PieChart },
              { id: "tax", label: "Tax Summary", icon: FileText },
            ].map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeReport === report.id
                    ? "border-[#0067b8] text-[#0067b8]"
                    : "border-transparent text-[#5c5c5c] hover:text-[#1a1a1a]"
                }`}
              >
                <report.icon className="w-4 h-4" />
                {report.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Income Statement */}
          {activeReport === "income" && reports?.incomeStatement && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a] text-center">
                Income Statement (Profit & Loss)
              </h2>
              <p className="text-center text-[#5c5c5c] text-sm">
                For the period {formatDate(startDate)} to {formatDate(endDate)}
              </p>

              <div className="max-w-2xl mx-auto space-y-4">
                {/* Revenue Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Revenue</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Service Revenue</span>
                    <span className="text-[#1a1a1a]">{formatCurrency(reports.incomeStatement.revenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Total Revenue</span>
                    <span className="text-green-600">{formatCurrency(reports.incomeStatement.revenue)}</span>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Operating Expenses</h3>
                  {reports.incomeStatement.expenses && Object.entries(reports.incomeStatement.expenses).map(([name, amount]: [string, any]) => (
                    <div key={name} className="flex justify-between py-1">
                      <span className="text-[#5c5c5c] capitalize">{name}</span>
                      <span className="text-[#1a1a1a]">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Total Expenses</span>
                    <span className="text-red-600">{formatCurrency(reports.incomeStatement.totalExpenses)}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#1a1a1a]">Net Income</span>
                    <span className={`text-2xl font-bold ${reports.incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reports.incomeStatement.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {activeReport === "balance" && reports?.balanceSheet && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a] text-center">Balance Sheet</h2>
              <p className="text-center text-[#5c5c5c] text-sm">As of {formatDate(endDate)}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Assets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 border-b border-green-200 pb-2">ASSETS</h3>
                  
                  <div>
                    <h4 className="font-medium text-[#1a1a1a] mb-2">Current Assets</h4>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">Cash</span>
                        <span>{formatCurrency(reports.balanceSheet.assets.current.cash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">Accounts Receivable</span>
                        <span>{formatCurrency(reports.balanceSheet.assets.current.accountsReceivable)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-100 mt-2 pt-2">
                      <span>Total Current Assets</span>
                      <span>{formatCurrency(reports.balanceSheet.assets.current.totalCurrent)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1a1a1a] mb-2">Fixed Assets</h4>
                    <div className="pl-4">
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">Equipment</span>
                        <span>{formatCurrency(reports.balanceSheet.assets.fixed.equipment)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-100 mt-2 pt-2">
                      <span>Total Fixed Assets</span>
                      <span>{formatCurrency(reports.balanceSheet.assets.fixed.totalFixed)}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between font-semibold text-green-800">
                      <span>TOTAL ASSETS</span>
                      <span>{formatCurrency(reports.balanceSheet.assets.totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600 border-b border-red-200 pb-2">LIABILITIES & EQUITY</h3>
                  
                  <div>
                    <h4 className="font-medium text-[#1a1a1a] mb-2">Current Liabilities</h4>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">Accounts Payable</span>
                        <span>{formatCurrency(reports.balanceSheet.liabilities.current.accountsPayable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">VAT Payable</span>
                        <span>{formatCurrency(reports.balanceSheet.liabilities.current.vatPayable)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-100 mt-2 pt-2">
                      <span>Total Current Liabilities</span>
                      <span>{formatCurrency(reports.balanceSheet.liabilities.current.totalCurrent)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1a1a1a] mb-2">Equity</h4>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span className="text-[#5c5c5c]">Retained Earnings</span>
                        <span>{formatCurrency(reports.balanceSheet.equity.retainedEarnings)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-100 mt-2 pt-2">
                      <span>Total Equity</span>
                      <span>{formatCurrency(reports.balanceSheet.equity.totalEquity)}</span>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between font-semibold text-red-800">
                      <span>TOTAL LIABILITIES & EQUITY</span>
                      <span>{formatCurrency(reports.balanceSheet.liabilities.totalLiabilities + reports.balanceSheet.equity.totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow */}
          {activeReport === "cashflow" && reports?.cashFlow && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a] text-center">Cash Flow Statement</h2>
              <p className="text-center text-[#5c5c5c] text-sm">
                For the period {formatDate(startDate)} to {formatDate(endDate)}
              </p>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Operating Activities */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Operating Activities</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Cash Received from Customers</span>
                    <span className="text-green-600">+{formatCurrency(reports.cashFlow.operating.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Cash Paid for Expenses</span>
                    <span className="text-red-600">-{formatCurrency(reports.cashFlow.operating.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Net Cash from Operations</span>
                    <span className={reports.cashFlow.operating.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(reports.cashFlow.operating.netOperating)}
                    </span>
                  </div>
                </div>

                {/* Investing Activities */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Investing Activities</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Equipment Purchases</span>
                    <span className="text-red-600">-{formatCurrency(reports.cashFlow.investing.equipmentPurchases)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Net Cash from Investing</span>
                    <span>{formatCurrency(reports.cashFlow.investing.netInvesting)}</span>
                  </div>
                </div>

                {/* Financing Activities */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Financing Activities</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Owner Contributions</span>
                    <span className="text-green-600">+{formatCurrency(reports.cashFlow.financing.ownerContributions)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Net Cash from Financing</span>
                    <span>{formatCurrency(reports.cashFlow.financing.netFinancing)}</span>
                  </div>
                </div>

                {/* Net Change */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#1a1a1a]">Net Change in Cash</span>
                    <span className={`text-2xl font-bold ${reports.cashFlow.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reports.cashFlow.netChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expense Summary */}
          {activeReport === "expenses" && reports?.expenseSummary && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a] text-center">Expense Summary Report</h2>
              <p className="text-center text-[#5c5c5c] text-sm">
                For the period {formatDate(startDate)} to {formatDate(endDate)}
              </p>

              <div className="max-w-2xl mx-auto">
                <div className="space-y-2">
                  {reports.expenseSummary.categories.map((cat: any) => (
                    <div key={cat.name} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-[#1a1a1a]">{cat.name}</span>
                      <span className="font-medium">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#1a1a1a]">Total Expenses</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(reports.expenseSummary.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tax Summary */}
          {activeReport === "tax" && reports?.taxSummary && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a] text-center">Tax Summary Report</h2>
              <p className="text-center text-[#5c5c5c] text-sm">
                For the period {formatDate(startDate)} to {formatDate(endDate)}
              </p>

              <div className="max-w-2xl mx-auto space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Value Added Tax (VAT)</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">VAT on Sales (Output)</span>
                    <span>{formatCurrency(reports.taxSummary.vatOnSales)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">VAT on Purchases (Input)</span>
                    <span className="text-green-600">-{formatCurrency(reports.taxSummary.vatOnPurchases)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold border-t border-gray-100">
                    <span className="text-[#1a1a1a]">Net VAT Payable</span>
                    <span className={reports.taxSummary.netVatPayable >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(reports.taxSummary.netVatPayable)}
                    </span>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Other Taxes</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Withholding Tax</span>
                    <span>{formatCurrency(reports.taxSummary.withholdingTax)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5c5c5c]">Income Tax</span>
                    <span>{formatCurrency(reports.taxSummary.incomeTax)}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#1a1a1a]">Total Tax Liability</span>
                    <span className="text-2xl font-bold text-yellow-700">
                      {formatCurrency(reports.taxSummary.netVatPayable + reports.taxSummary.withholdingTax + reports.taxSummary.incomeTax)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
