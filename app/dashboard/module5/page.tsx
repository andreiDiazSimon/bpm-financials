"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/collections-types";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface AccountBalance {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

interface ReportData {
  revenue: AccountBalance[];
  expenses: AccountBalance[];
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
}

export default function FinancialReporting() {
  const [activeReport, setActiveReport] = useState<"income" | "balance" | "trial" | "cashflow">("income");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Static demo data
  const staticReportData: ReportData = {
    revenue: [
      { accountId: 16, accountCode: "4100", accountName: "Service Revenue", accountType: "REVENUE", totalDebit: 0, totalCredit: 75000, balance: 75000 },
      { accountId: 17, accountCode: "4200", accountName: "Rental Revenue", accountType: "REVENUE", totalDebit: 0, totalCredit: 120000, balance: 120000 },
    ],
    expenses: [
      { accountId: 21, accountCode: "5300", accountName: "Payroll Expenses", accountType: "EXPENSE", totalDebit: 45000, totalCredit: 0, balance: 45000 },
      { accountId: 22, accountCode: "5400", accountName: "Maintenance Expenses", accountType: "EXPENSE", totalDebit: 8500, totalCredit: 0, balance: 8500 },
      { accountId: 23, accountCode: "5500", accountName: "Fuel Expenses", accountType: "EXPENSE", totalDebit: 15000, totalCredit: 0, balance: 15000 },
    ],
    assets: [
      { accountId: 3, accountCode: "1101", accountName: "Cash on Hand", accountType: "ASSET", totalDebit: 25000, totalCredit: 0, balance: 25000 },
      { accountId: 4, accountCode: "1102", accountName: "Cash in Bank", accountType: "ASSET", totalDebit: 194500, totalCredit: 0, balance: 194500 },
      { accountId: 5, accountCode: "1200", accountName: "Accounts Receivable", accountType: "ASSET", totalDebit: 25000, totalCredit: 0, balance: 25000 },
      { accountId: 6, accountCode: "1300", accountName: "Equipment", accountType: "ASSET", totalDebit: 500000, totalCredit: 0, balance: 500000 },
    ],
    liabilities: [
      { accountId: 9, accountCode: "2100", accountName: "Accounts Payable", accountType: "LIABILITY", totalDebit: 0, totalCredit: 8500, balance: -8500 },
    ],
    equity: [
      { accountId: 13, accountCode: "3100", accountName: "Owner's Equity", accountType: "EQUITY", totalDebit: 0, totalCredit: 500000, balance: -500000 },
      { accountId: 14, accountCode: "3200", accountName: "Retained Earnings", accountType: "EQUITY", totalDebit: 0, totalCredit: 200000, balance: -200000 },
    ],
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ledger/journal?type=balances&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const balances: AccountBalance[] = await res.json();

      // Also fetch account details for categorization
      const accountsRes = await fetch("/api/ledger/journal?type=accounts");
      const accounts = await accountsRes.json();

      // Create a map of account IDs to their types
      const accountTypeMap: Record<number, string> = {};
      accounts.forEach((acc: any) => {
        accountTypeMap[acc.id] = acc.accountType;
      });

      // Categorize balances
      const categorized: ReportData = {
        revenue: [],
        expenses: [],
        assets: [],
        liabilities: [],
        equity: [],
      };

      balances.forEach((bal) => {
        const type = accountTypeMap[bal.accountId] || getAccountTypeFromCode(bal.accountCode);
        const categorizedBal = { ...bal, accountType: type };
        
        switch (type) {
          case "REVENUE":
            categorized.revenue.push(categorizedBal);
            break;
          case "EXPENSE":
            categorized.expenses.push(categorizedBal);
            break;
          case "ASSET":
            categorized.assets.push(categorizedBal);
            break;
          case "LIABILITY":
            categorized.liabilities.push(categorizedBal);
            break;
          case "EQUITY":
            categorized.equity.push(categorizedBal);
            break;
        }
      });

      setReportData(balances.length > 0 ? categorized : staticReportData);
    } catch (error) {
      console.error("Error fetching report data, using static data:", error);
      // Use static demo data on error
      setReportData(staticReportData);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeFromCode = (code: string): string => {
    const num = parseInt(code);
    if (num >= 1000 && num < 2000) return "ASSET";
    if (num >= 2000 && num < 3000) return "LIABILITY";
    if (num >= 3000 && num < 4000) return "EQUITY";
    if (num >= 4000 && num < 5000) return "REVENUE";
    if (num >= 5000) return "EXPENSE";
    return "OTHER";
  };

  const totalRevenue = reportData?.revenue.reduce((sum, r) => sum + r.balance, 0) || 0;
  const totalExpenses = reportData?.expenses.reduce((sum, e) => sum + e.balance, 0) || 0;
  const netIncome = totalRevenue - totalExpenses;

  const totalAssets = reportData?.assets.reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalLiabilities = reportData?.liabilities.reduce((sum, l) => sum + l.balance, 0) || 0;
  const totalEquity = reportData?.equity.reduce((sum, e) => sum + e.balance, 0) || 0;

  const formatAmount = (amount: number) => {
    return formatCurrency(Math.abs(amount));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reporting</h1>
            <p className="text-gray-600 mt-1">Generate financial statements and reports</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveReport("income")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeReport === "income"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Income Statement
        </button>
        <button
          onClick={() => setActiveReport("balance")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeReport === "balance"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <PieChart className="w-4 h-4 inline mr-2" />
          Balance Sheet
        </button>
        <button
          onClick={() => setActiveReport("trial")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeReport === "trial"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Trial Balance
        </button>
        <button
          onClick={() => setActiveReport("cashflow")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeReport === "cashflow"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Cash Flow
        </button>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading report data...</div>
        </div>
      ) : (
        <>
          {/* Income Statement */}
          {activeReport === "income" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Income Statement</h2>
                <p className="text-gray-500 text-sm">
                  For the period {dateRange.startDate} to {dateRange.endDate}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Revenue</h3>
                  {reportData?.revenue.length === 0 ? (
                    <p className="text-gray-400 italic">No revenue recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData?.revenue.map((item) => (
                        <div key={item.accountId} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">{item.accountName}</span>
                          <span className="font-medium text-green-600">{formatAmount(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Revenue</span>
                        <span className="text-green-600">{formatAmount(totalRevenue)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Expenses</h3>
                  {reportData?.expenses.length === 0 ? (
                    <p className="text-gray-400 italic">No expenses recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData?.expenses.map((item) => (
                        <div key={item.accountId} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">{item.accountName}</span>
                          <span className="font-medium text-red-600">{formatAmount(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Expenses</span>
                        <span className="text-red-600">{formatAmount(totalExpenses)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Income */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      {netIncome >= 0 ? "Net Income" : "Net Loss"}
                    </span>
                    <span className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {activeReport === "balance" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Balance Sheet</h2>
                <p className="text-gray-500 text-sm">
                  As of {dateRange.endDate}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Assets */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Assets</h3>
                  {reportData?.assets.length === 0 ? (
                    <p className="text-gray-400 italic">No assets recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData?.assets.map((item) => (
                        <div key={item.accountId} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">{item.accountName}</span>
                          <span className="font-medium">{formatAmount(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Assets</span>
                        <span className="text-blue-600">{formatAmount(totalAssets)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Liabilities */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Liabilities</h3>
                  {reportData?.liabilities.length === 0 ? (
                    <p className="text-gray-400 italic">No liabilities recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData?.liabilities.map((item) => (
                        <div key={item.accountId} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">{item.accountName}</span>
                          <span className="font-medium">{formatAmount(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Liabilities</span>
                        <span className="text-red-600">{formatAmount(totalLiabilities)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Equity */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Equity</h3>
                  {reportData?.equity.length === 0 ? (
                    <p className="text-gray-400 italic">No equity recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData?.equity.map((item) => (
                        <div key={item.accountId} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">{item.accountName}</span>
                          <span className="font-medium">{formatAmount(item.balance)}</span>
                        </div>
                      ))}
                      {/* Add Net Income to Equity */}
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">{netIncome >= 0 ? "Net Income" : "Net Loss"}</span>
                        <span className={`font-medium ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatAmount(netIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Equity</span>
                        <span className="text-purple-600">{formatAmount(totalEquity + netIncome)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balance Check */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Liabilities + Equity</span>
                    <span className={`text-2xl font-bold ${totalLiabilities + totalEquity + netIncome === totalAssets ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(totalLiabilities + totalEquity + netIncome)}
                    </span>
                  </div>
                  {totalLiabilities + totalEquity + netIncome === totalAssets ? (
                    <p className="text-green-600 text-sm mt-2">✓ Balance Sheet is balanced</p>
                  ) : (
                    <p className="text-red-600 text-sm mt-2">✗ Balance Sheet is NOT balanced (Difference: {formatAmount(totalAssets - (totalLiabilities + totalEquity + netIncome))})</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trial Balance */}
          {activeReport === "trial" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Trial Balance</h2>
                <p className="text-gray-500 text-sm">
                  As of {dateRange.endDate}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData && [...reportData.assets, ...reportData.liabilities, ...reportData.equity, ...reportData.revenue, ...reportData.expenses]
                      .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
                      .map((item) => (
                        <tr key={item.accountId}>
                          <td className="px-6 py-3 text-sm font-mono text-gray-900">
                            {item.accountCode}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900">
                            {item.accountName}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-900">
                            {item.balance > 0 ? formatAmount(item.balance) : "-"}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-900">
                            {item.balance < 0 ? formatAmount(item.balance) : "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                        {formatAmount([...reportData?.revenue || [], ...reportData?.expenses || [], ...reportData?.assets || []]
                          .reduce((sum, item) => sum + (item.balance > 0 ? item.balance : 0), 0))}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                        {formatAmount([...reportData?.revenue || [], ...reportData?.expenses || [], ...reportData?.liabilities || []]
                          .reduce((sum, item) => sum + (item.balance < 0 ? Math.abs(item.balance) : 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Cash Flow Statement */}
          {activeReport === "cashflow" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Cash Flow Statement</h2>
                <p className="text-gray-500 text-sm">
                  For the period {dateRange.startDate} to {dateRange.endDate}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cash Flow from Operations</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">Net Income</span>
                      <span className={`font-medium ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatAmount(netIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Net Cash from Operations</span>
                      <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatAmount(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cash Flow from Investing</h3>
                  <p className="text-gray-400 italic">No investing activities recorded</p>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Net Cash from Investing</span>
                    <span>{formatAmount(0)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cash Flow from Financing</h3>
                  <p className="text-gray-400 italic">No financing activities recorded</p>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Net Cash from Financing</span>
                    <span>{formatAmount(0)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Net Change in Cash</span>
                    <span className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
