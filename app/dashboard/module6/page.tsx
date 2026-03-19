"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/collections-types";

// Types
interface LedgerAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentId: number | null;
  isActive: boolean;
  description: string | null;
  normalBalance: string;
}

interface JournalLineItem {
  id: number;
  journalEntryId: number;
  accountId: number;
  debit: number;
  credit: number;
  description: string | null;
  account?: LedgerAccount;
}

interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference: string | null;
  sourceType: string | null;
  sourceId: string | null;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  JournalLineItem?: JournalLineItem[];
}

interface AccountBalance {
  accountId: number;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export default function GeneralLedger() {
  const [activeTab, setActiveTab] = useState<"accounts" | "entries" | "balances">("accounts");
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form state for new journal entry
  const [entryForm, setEntryForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
    lines: [
      { accountId: 0, debit: 0, credit: 0, description: "" },
      { accountId: 0, debit: 0, credit: 0, description: "" },
    ],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "accounts") {
        const res = await fetch("/api/ledger/journal?type=accounts");
        const data = await res.json();
        setAccounts(data);
      } else if (activeTab === "entries") {
        const res = await fetch("/api/ledger/journal?type=entries");
        const data = await res.json();
        setEntries(data);
      } else if (activeTab === "balances") {
        const res = await fetch("/api/ledger/journal?type=balances");
        const data = await res.json();
        setBalances(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedAccounts = async () => {
    try {
      const res = await fetch("/api/ledger/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      alert(data.message);
      fetchData();
    } catch (error) {
      console.error("Error seeding accounts:", error);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate debits = credits
    const totalDebit = entryForm.lines.reduce((sum, l) => sum + parseFloat(String(l.debit)), 0);
    const totalCredit = entryForm.lines.reduce((sum, l) => sum + parseFloat(String(l.credit)), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert("Debits must equal credits!");
      return;
    }

    try {
      const res = await fetch("/api/ledger/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: entryForm.entryDate,
          description: entryForm.description,
          reference: entryForm.reference || null,
          sourceType: "MANUAL",
          lines: entryForm.lines.filter(l => l.accountId > 0),
        }),
      });
      
      if (res.ok) {
        alert("Journal entry created successfully!");
        setShowCreateModal(false);
        setEntryForm({
          entryDate: new Date().toISOString().split("T")[0],
          description: "",
          reference: "",
          lines: [
            { accountId: 0, debit: 0, credit: 0, description: "" },
            { accountId: 0, debit: 0, credit: 0, description: "" },
          ],
        });
        fetchData();
      } else {
        alert("Failed to create entry");
      }
    } catch (error) {
      console.error("Error creating entry:", error);
    }
  };

  const handlePostEntry = async (entryId: number) => {
    try {
      const res = await fetch("/api/ledger/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post", entryId }),
      });
      
      if (res.ok) {
        alert("Entry posted successfully!");
        fetchData();
      } else {
        alert("Failed to post entry");
      }
    } catch (error) {
      console.error("Error posting entry:", error);
    }
  };

  const handleVoidEntry = async (entryId: number) => {
    if (!confirm("Are you sure you want to void this entry?")) return;
    
    try {
      const res = await fetch("/api/ledger/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void", entryId }),
      });
      
      if (res.ok) {
        alert("Entry voided successfully!");
        fetchData();
      } else {
        alert("Failed to void entry");
      }
    } catch (error) {
      console.error("Error voiding entry:", error);
    }
  };

  const addLine = () => {
    setEntryForm({
      ...entryForm,
      lines: [...entryForm.lines, { accountId: 0, debit: 0, credit: 0, description: "" }],
    });
  };

  const removeLine = (index: number) => {
    if (entryForm.lines.length <= 2) return;
    const newLines = [...entryForm.lines];
    newLines.splice(index, 1);
    setEntryForm({ ...entryForm, lines: newLines });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...entryForm.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEntryForm({ ...entryForm, lines: newLines });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "POSTED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "VOIDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "ASSET": return "Asset";
      case "LIABILITY": return "Liability";
      case "EQUITY": return "Equity";
      case "REVENUE": return "Revenue";
      case "EXPENSE": return "Expense";
      default: return type;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-gray-600 mt-1">Manage chart of accounts and journal entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedAccounts}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Seed Default Accounts
          </button>
          {activeTab === "entries" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Journal Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "accounts"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setActiveTab("entries")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "entries"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Journal Entries
        </button>
        <button
          onClick={() => setActiveTab("balances")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "balances"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Account Balances
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <>
          {/* Chart of Accounts */}
          {activeTab === "accounts" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Normal Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No accounts found. Click "Seed Default Accounts" to create initial chart of accounts.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {account.accountCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.parentId && "→ "}{account.accountName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              account.accountType === "ASSET" ? "bg-blue-100 text-blue-800" :
                              account.accountType === "LIABILITY" ? "bg-red-100 text-red-800" :
                              account.accountType === "EQUITY" ? "bg-purple-100 text-purple-800" :
                              account.accountType === "REVENUE" ? "bg-green-100 text-green-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {getAccountTypeLabel(account.accountType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.normalBalance}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              account.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {account.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal Entries */}
          {activeTab === "entries" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entry #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No journal entries found.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                            {entry.entryNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(entry.entryDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <button
                              onClick={() => setSelectedEntry(entry)}
                              className="text-blue-600 hover:underline"
                            >
                              {entry.description}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.reference || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(entry.totalDebit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(entry.totalCredit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {entry.status === "DRAFT" && (
                              <>
                                <button
                                  onClick={() => handlePostEntry(entry.id)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Post
                                </button>
                                <button
                                  onClick={() => handleVoidEntry(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Void
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Account Balances */}
          {activeTab === "balances" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Credit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {balances.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No account balances found. Post some journal entries first.
                        </td>
                      </tr>
                    ) : (
                      balances.map((balance) => (
                        <tr key={balance.accountId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {balance.accountCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.accountName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(balance.totalDebit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(balance.totalCredit)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            balance.balance >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatCurrency(balance.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Journal Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">New Journal Entry</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateEntry}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Date
                    </label>
                    <input
                      type="date"
                      value={entryForm.entryDate}
                      onChange={(e) => setEntryForm({ ...entryForm, entryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={entryForm.reference}
                      onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., OR-001"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={entryForm.description}
                    onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journal Lines
                  </label>
                  <div className="space-y-2">
                    {entryForm.lines.map((line, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={line.accountId}
                          onChange={(e) => updateLine(index, "accountId", parseInt(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value={0}>Select Account</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountCode} - {acc.accountName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Debit"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-right"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Credit"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-right"
                        />
                        {entryForm.lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-900"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Total Debit: {formatCurrency(entryForm.lines.reduce((s, l) => s + parseFloat(String(l.debit)), 0))}</span>
                    <span>Total Credit: {formatCurrency(entryForm.lines.reduce((s, l) => s + parseFloat(String(l.credit)), 0))}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Journal Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Entry {selectedEntry.entryNumber}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {formatDate(selectedEntry.entryDate)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {selectedEntry.description}
                </p>
                {selectedEntry.reference && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Reference:</span> {selectedEntry.reference}
                  </p>
                )}
              </div>

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Account</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Debit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedEntry.JournalLineItem?.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2 text-sm">
                        {line.account?.accountCode} - {line.account?.accountName}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium">Total</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">
                      {formatCurrency(selectedEntry.totalDebit)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium">
                      {formatCurrency(selectedEntry.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
