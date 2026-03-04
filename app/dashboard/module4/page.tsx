"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  CreditCard,
  Download,
} from "lucide-react";

interface GLEntry {
  account: string;
  debit: number;
  credit: number;
}

interface LedgerTransaction {
  type: 'INVOICE' | 'PAYMENT';
  id: number;
  date: string;
  number: string;
  description: string;
  clientName: string;
  amount: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentMethod?: string;
  reference?: string;
  status: string;
  glEntries: GLEntry[];
}

export default function GeneralLedger() {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INVOICE" | "PAYMENT">("ALL");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ledger/comprehensive");
      const data = await res.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "ALL" || tx.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDebits = filteredTransactions.reduce((sum, tx) => 
    sum + tx.glEntries.reduce((s, e) => s + e.debit, 0), 0
  );
  
  const totalCredits = filteredTransactions.reduce((sum, tx) => 
    sum + tx.glEntries.reduce((s, e) => s + e.credit, 0), 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0067b8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5c5c5c]">Loading general ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">General Ledger</h1>
          <p className="text-[#5c5c5c] mt-1">Complete ledger of all financial transactions with GL entries</p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-4 py-2 text-[#5c5c5c] border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-[#5c5c5c]">Total Invoiced</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{formatCurrency(summary.totalInvoiced)}</p>
            <p className="text-xs text-[#5c5c5c] mt-1">{summary.invoiceCount} invoices</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-[#5c5c5c]">Total Collected</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-[#5c5c5c] mt-1">{summary.paymentCount} payments</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-[#5c5c5c]">Outstanding</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{formatCurrency(summary.totalOutstanding)}</p>
            <p className="text-xs text-[#5c5c5c] mt-1">Accounts Receivable</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-[#5c5c5c]">Total Transactions</p>
            <p className="text-2xl font-semibold text-[#1a1a1a] mt-1">{transactions.length}</p>
            <p className="text-xs text-[#5c5c5c] mt-1">In ledger</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5c5c5c]" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8]"
              >
                <option value="ALL">All Types</option>
                <option value="INVOICE">Invoices Only</option>
                <option value="PAYMENT">Payments Only</option>
              </select>
            </div>
            <div className="text-sm text-[#5c5c5c]">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>

          {/* Ledger Totals */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-[#5c5c5c]">Total Debits</p>
                <p className="text-lg font-semibold text-blue-800">{formatCurrency(totalDebits)}</p>
              </div>
              <div className="text-blue-300">|</div>
              <div className="text-center">
                <p className="text-[#5c5c5c]">Total Credits</p>
                <p className="text-lg font-semibold text-blue-800">{formatCurrency(totalCredits)}</p>
              </div>
              <div className="text-blue-300">|</div>
              <div className="text-center">
                <p className="text-[#5c5c5c]">Balance</p>
                <p className={`text-lg font-semibold ${totalDebits === totalCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalDebits - totalCredits)}
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Client</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <>
                    <tr 
                      key={tx.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRowExpand(tx.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedRows.has(tx.id) ? (
                          <ChevronDown className="w-4 h-4 text-[#5c5c5c]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#5c5c5c]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'INVOICE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {tx.type === 'INVOICE' ? <FileText className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">{tx.number}</td>
                      <td className="px-4 py-3 text-sm text-[#5c5c5c]">{tx.description}</td>
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">{tx.clientName}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-[#1a1a1a]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                    {expandedRows.has(tx.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-[#1a1a1a]">
                              General Ledger Entries
                            </div>
                            <table className="w-full">
                              <thead className="bg-white text-xs">
                                <tr>
                                  <th className="px-4 py-2 text-left text-[#5c5c5c]">Account</th>
                                  <th className="px-4 py-2 text-right text-[#5c5c5c] w-32">Debit</th>
                                  <th className="px-4 py-2 text-right text-[#5c5c5c] w-32">Credit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {tx.glEntries.map((entry, idx) => (
                                  <tr key={idx} className="text-sm">
                                    <td className="px-4 py-2 text-[#1a1a1a]">{entry.account}</td>
                                    <td className="px-4 py-2 text-right">
                                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {tx.type === 'INVOICE' && (
                              <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-sm">
                                <span className="text-yellow-800">
                                  Balance Due: {formatCurrency(tx.balanceDue || 0)} | 
                                  Paid: {formatCurrency(tx.amountPaid || 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#5c5c5c]">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
