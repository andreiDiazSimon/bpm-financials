"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Filter,
  PhilippinePeso,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  RefreshCw,
  FileText,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  jobTitle?: string;
}

interface ExpenseReport {
  id: string;
  employeeId: string;
  expenseCategory: string;
  totalAmount: number;
  submissionDate: Date;
  status: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  employees: Employee;
  claim_validations?: any[];
  reimbursements?: any[];
  documents?: any[];
}

interface ReimbursementFormData {
  reimbursementAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

const EXPENSE_CATEGORIES = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Equipment",
  "Software",
  "Training",
  "Communication",
  "Transportation",
  "Accommodation",
  "Entertainment",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "Submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "Under_Review", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "Approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "Rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "Paid", label: "Paid", color: "bg-purple-100 text-purple-800" },
];

const REIMBURSEMENT_STATUS = [
  { value: "Pending", label: "Pending" },
  { value: "Processed", label: "Processed" },
  { value: "Paid", label: "Paid" },
];

export default function ExpenseTrackingAndTax() {
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReport | null>(null);
  const [isFetchingFromHR2, setIsFetchingFromHR2] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    expenseCategory: "Travel",
    totalAmount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });
  const [reimbursementData, setReimbursementData] = useState<ReimbursementFormData>({
    reimbursementAmount: 0,
    paymentMethod: "Bank_Transfer",
    paymentDate: "",
    status: "Pending",
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  const fetchExpenses = async () => {
    try {
      const url = new URL("/api/expenses", window.location.href);
      if (statusFilter !== "all") {
        url.searchParams.append("status", statusFilter);
      }
      const response = await fetch(url);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFromHR2 = async () => {
    setIsFetchingFromHR2(true);
    try {
      const response = await fetch("/api/expenses?action=sync", {
        method: "POST",
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully synced ${result.syncedCount || 0} expenses from HR2`);
        fetchExpenses();
      } else {
        alert("Failed to fetch data from HR2");
      }
    } catch (error) {
      console.error("Error fetching from HR2:", error);
      alert("Error fetching data from HR2");
    } finally {
      setIsFetchingFromHR2(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({
          employeeId: "",
          expenseCategory: "Travel",
          totalAmount: "",
          description: "",
          expenseDate: new Date().toISOString().split("T")[0],
        });
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  const handleReimbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      const response = await fetch("/api/expenses/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseReportId: selectedExpense.id,
          ...reimbursementData,
        }),
      });

      if (response.ok) {
        setShowReimbursementModal(false);
        setSelectedExpense(null);
        setReimbursementData({
          reimbursementAmount: 0,
          paymentMethod: "Bank_Transfer",
          paymentDate: "",
          status: "Pending",
        });
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error creating reimbursement:", error);
    }
  };

  const openReimbursementModal = (expense: ExpenseReport) => {
    setSelectedExpense(expense);
    setReimbursementData({
      reimbursementAmount: expense.totalAmount,
      paymentMethod: "Bank_Transfer",
      paymentDate: new Date().toISOString().split("T")[0],
      status: expense.reimbursements?.[0]?.status || "Pending",
    });
    setShowReimbursementModal(true);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      expense.employees?.name?.toLowerCase().includes(searchLower) ||
      expense.expenseCategory?.toLowerCase().includes(searchLower) ||
      expense.id?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Expense Tracking & Tax
            </h1>
            <p className="text-sm text-gray-500">
              Manage employee expense reports and reimbursements
            </p>
          </div>
        </div>
        <button
          onClick={fetchFromHR2}
          disabled={isFetchingFromHR2}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetchingFromHR2 ? "animate-spin" : ""}`} />
          {isFetchingFromHR2 ? "Syncing..." : "Fetch Data from HR2"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchExpenses();
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {expenses.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {expenses.filter((e) => e.status === "Submitted").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {expenses.filter((e) => e.status === "Approved").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  expenses.reduce((sum, e) => sum + e.totalAmount, 0)
                )}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PhilippinePeso className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reimbursement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {expense.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {expense.employees?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.employees?.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {expense.expenseCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(expense.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {formatDate(expense.submissionDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        {expense.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.reimbursements?.[0] ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              expense.reimbursements[0].reimbursementAmount
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.reimbursements[0].paymentMethod.replace(
                              "_",
                              " "
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not logged</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openReimbursementModal(expense)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        {expense.reimbursements?.[0] ? "Update" : "Log Reimbursement"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                New Expense Report
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={formData.expenseCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseCategory: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expenseDate: e.target.value })
                    }
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expense description..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all"
                >
                  Submit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reimbursement Modal */}
      {showReimbursementModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Log Reimbursement
              </h2>
              <button
                onClick={() => setShowReimbursementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedExpense.expenseCategory}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedExpense.employees?.name} - {selectedExpense.id}
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedExpense.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleReimbursementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reimbursement Amount
                </label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={reimbursementData.reimbursementAmount}
                    onChange={(e) =>
                      setReimbursementData({
                        ...reimbursementData,
                        reimbursementAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={reimbursementData.paymentMethod}
                  onChange={(e) =>
                    setReimbursementData({
                      ...reimbursementData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank_Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={reimbursementData.paymentDate}
                    onChange={(e) =>
                      setReimbursementData({
                        ...reimbursementData,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={reimbursementData.status}
                  onChange={(e) =>
                    setReimbursementData({
                      ...reimbursementData,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REIMBURSEMENT_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReimbursementModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all"
                >
                  {selectedExpense.reimbursements?.[0]
                    ? "Update Reimbursement"
                    : "Log Reimbursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
