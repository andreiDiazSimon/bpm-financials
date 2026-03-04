"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle,
  Search,
  Download,
  Plus,
  ChevronRight,
  X,
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  projectName: string;
  Client: { id: number; name: string; email: string };
  totalAmount: number;
  balanceDue: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  issueDate: string;
  daysOverdue: number;
  agingCategory: string;
  Payment: any[];
}

interface ClientSummary {
  clientId: number;
  clientName: string;
  email: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  invoiceCount: number;
}

interface AgingSummary {
  totalOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export default function CollectionsManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [agingSummary, setAgingSummary] = useState<AgingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "clients" | "aging">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: string; message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, clientsRes, agingRes] = await Promise.all([
        fetch("/api/collections/invoices"),
        fetch("/api/collections/client-summary"),
        fetch("/api/collections/aging"),
      ]);

      const invoicesData = await invoicesRes.json();
      const clientsData = await clientsRes.json();
      const agingData = await agingRes.json();

      setInvoices(invoicesData);
      setClientSummaries(clientsData);
      setAgingSummary(agingData.summary);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/collections/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
          clientId: selectedInvoice.Client.id,
        }),
      });

      if (response.ok) {
        showNotification("success", "Payment recorded successfully!");
        setShowPaymentModal(false);
        setPaymentAmount("");
        setPaymentReference("");
        setPaymentNotes("");
        fetchData();
      } else {
        const error = await response.json();
        showNotification("error", error.error || "Failed to record payment");
      }
    } catch (error) {
      showNotification("error", "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceDue.toString());
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH");
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.Client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const overdueInvoices = invoices.filter((inv) => inv.daysOverdue > 0 && inv.balanceDue > 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0067b8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5c5c5c]">Loading collections data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-100 border border-green-400 text-green-800"
              : "bg-red-100 border border-red-400 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Collections Management</h1>
          <p className="text-[#5c5c5c] mt-1">Track payments, manage outstanding balances, and generate receipts</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0067b8] hover:bg-[#005a9e] text-white text-sm font-medium rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5c5c5c]">Total Outstanding</p>
              <p className="text-2xl font-semibold text-[#1a1a1a] mt-1">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#0067b8]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5c5c5c]">Total Collected</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5c5c5c]">Overdue Amount</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {formatCurrency(totalOverdue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-[#5c5c5c] mt-2">{overdueInvoices.length} invoices overdue</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5c5c5c]">Active Clients</p>
              <p className="text-2xl font-semibold text-[#1a1a1a] mt-1">
                {clientSummaries.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "invoices", label: "Outstanding Invoices", icon: Clock },
              { id: "clients", label: "Client Balances", icon: Users },
              { id: "aging", label: "Aging Report", icon: AlertCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#0067b8] text-[#0067b8]"
                    : "border-transparent text-[#5c5c5c] hover:text-[#1a1a1a]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Aging Summary */}
              {agingSummary && (
                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-4">Aging Summary</h3>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-[#5c5c5c]">Current</p>
                      <p className="text-lg font-semibold text-[#1a1a1a]">
                        {formatCurrency(agingSummary.current)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-[#5c5c5c]">1-30 Days</p>
                      <p className="text-lg font-semibold text-yellow-700">
                        {formatCurrency(agingSummary.days1to30)}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-[#5c5c5c]">31-60 Days</p>
                      <p className="text-lg font-semibold text-orange-700">
                        {formatCurrency(agingSummary.days31to60)}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-[#5c5c5c]">61-90 Days</p>
                      <p className="text-lg font-semibold text-red-700">
                        {formatCurrency(agingSummary.days61to90)}
                      </p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4 text-center">
                      <p className="text-xs text-[#5c5c5c]">90+ Days</p>
                      <p className="text-lg font-semibold text-red-800">
                        {formatCurrency(agingSummary.days90Plus)}
                      </p>
                    </div>
                    <div className="bg-[#0067b8]/10 rounded-lg p-4 text-center">
  <p className="text-xs text-[#5c5c5c]">Total</p>
  <p className="text-lg font-semibold text-[#0067b8]">
    {formatCurrency(agingSummary.totalOutstanding)}
  </p>
</div>
                  </div>
                </div>
              )}

              {/* Recent Overdue Invoices */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#1a1a1a]">Top Overdue Invoices</h3>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-sm text-[#0067b8] hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Client</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Balance</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Days Overdue</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overdueInvoices
                        .sort((a, b) => b.daysOverdue - a.daysOverdue)
                        .slice(0, 5)
                        .map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-[#1a1a1a]">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-[#5c5c5c]">{formatDate(invoice.dueDate)}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#1a1a1a]">{invoice.Client.name}</td>
                            <td className="px-4 py-3 text-right text-sm text-[#1a1a1a]">
                              {formatCurrency(invoice.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                              {formatCurrency(invoice.balanceDue)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {invoice.daysOverdue} days
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => openPaymentModal(invoice)}
                                className="text-sm text-[#0067b8] hover:underline"
                              >
                                Record Payment
                              </button>
                            </td>
                          </tr>
                        ))}
                      {overdueInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[#5c5c5c]">
                            No overdue invoices. Great job!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5c5c5c]" />
                  <input
                    type="text"
                    placeholder="Search invoices by number, client, or project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Project</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Paid</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Balance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Due Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices
                      .filter((inv) => inv.balanceDue > 0)
                      .map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm text-[#1a1a1a]">{invoice.Client.name}</td>
                          <td className="px-4 py-3 text-sm text-[#5c5c5c]">{invoice.projectName}</td>
                          <td className="px-4 py-3 text-right text-sm text-[#1a1a1a]">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-green-600">
                            {formatCurrency(invoice.amountPaid)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                            {formatCurrency(invoice.balanceDue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {invoice.daysOverdue > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue ({invoice.daysOverdue}d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#5c5c5c]">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openPaymentModal(invoice)}
                              className="px-3 py-1 text-xs font-medium text-white bg-[#0067b8] hover:bg-[#005a9e] rounded-sm transition-colors"
                            >
                              Pay
                            </button>
                          </td>
                        </tr>
                      ))}
                    {filteredInvoices.filter((inv) => inv.balanceDue > 0).length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-[#5c5c5c]">
                          No outstanding invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Client</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#5c5c5c] uppercase">Invoices</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Total Invoiced</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Outstanding</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Current</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">30 Days</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">60 Days</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">90+ Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientSummaries.map((client) => (
                      <tr key={client.clientId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[#1a1a1a]">{client.clientName}</p>
                          <p className="text-xs text-[#5c5c5c]">{client.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[#1a1a1a]">{client.invoiceCount}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#1a1a1a]">
                          {formatCurrency(client.totalInvoiced || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-[#1a1a1a]">
                          {formatCurrency(client.totalOutstanding || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-green-600">
                          {formatCurrency(
                            (client.totalOutstanding || 0) -
                            (client.overdue30 || 0) -
                            (client.overdue60 || 0) -
                            (client.overdue90 || 0)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-yellow-600">{formatCurrency(client.overdue30 || 0)}</td>
                        <td className="px-4 py-3 text-right text-sm text-orange-600">{formatCurrency(client.overdue60 || 0)}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(client.overdue90 || 0)}</td>
                      </tr>
                    ))}
                    {clientSummaries.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[#5c5c5c]">
                          No client data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aging Report Tab */}
          {activeTab === "aging" && agingSummary && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#1a1a1a]">Accounts Receivable Aging</h3>
                {/* <button className="flex items-center gap-2 px-4 py-2 text-sm text-[#5c5c5c] border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button> */}
              </div>

              {/* Aging Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5c5c5c] uppercase">Aging Period</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#5c5c5c] uppercase">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">Current (Not yet due)</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                        {formatCurrency(agingSummary.current)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">
                        {((agingSummary.current / agingSummary.totalOutstanding) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">1-30 Days Overdue</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-yellow-600">
                        {formatCurrency(agingSummary.days1to30)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">
                        {((agingSummary.days1to30 / agingSummary.totalOutstanding) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">31-60 Days Overdue</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-orange-600">
                        {formatCurrency(agingSummary.days31to60)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">
                        {((agingSummary.days31to60 / agingSummary.totalOutstanding) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">61-90 Days Overdue</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                        {formatCurrency(agingSummary.days61to90)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">
                        {((agingSummary.days61to90 / agingSummary.totalOutstanding) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">90+ Days Overdue</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-700">
                        {formatCurrency(agingSummary.days90Plus)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">
                        {((agingSummary.days90Plus / agingSummary.totalOutstanding) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-sm text-[#1a1a1a]">Total Outstanding</td>
                      <td className="px-4 py-3 text-right text-sm text-[#0067b8]">
                        {formatCurrency(agingSummary.totalOutstanding)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#5c5c5c]">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual Bar Chart */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-[#5c5c5c] mb-4">Aging Distribution</h4>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  {agingSummary.totalOutstanding > 0 && (
                    <>
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(agingSummary.current / agingSummary.totalOutstanding) * 100}%` }}
                      />
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${(agingSummary.days1to30 / agingSummary.totalOutstanding) * 100}%` }}
                      />
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${(agingSummary.days31to60 / agingSummary.totalOutstanding) * 100}%` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${(agingSummary.days61to90 / agingSummary.totalOutstanding) * 100}%` }}
                      />
                      <div
                        className="h-full bg-red-700"
                        style={{ width: `${(agingSummary.days90Plus / agingSummary.totalOutstanding) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs text-[#5c5c5c]">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-[#5c5c5c]">1-30 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-[#5c5c5c]">31-60 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-[#5c5c5c]">61-90 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-700 rounded"></div>
                    <span className="text-xs text-[#5c5c5c]">90+ Days</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">
                {selectedInvoice ? "Record Payment" : "Select Invoice First"}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-[#5c5c5c] hover:text-[#1a1a1a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedInvoice ? (
              <div className="p-6">
                <p className="text-[#5c5c5c] mb-4">Select an invoice to record payment:</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {invoices
                    .filter((inv) => inv.balanceDue > 0)
                    .map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => setSelectedInvoice(invoice)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#1a1a1a]">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-[#5c5c5c]">{invoice.Client.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">{formatCurrency(invoice.balanceDue)}</p>
                            <p className="text-xs text-[#5c5c5c]">Balance Due</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-[#5c5c5c]">Invoice: <span className="font-medium text-[#1a1a1a]">{selectedInvoice.invoiceNumber}</span></p>
                  <p className="text-sm text-[#5c5c5c]">Client: <span className="font-medium text-[#1a1a1a]">{selectedInvoice.Client.name}</span></p>
                  <p className="text-sm text-[#5c5c5c]">Balance Due: <span className="font-medium text-red-600">{formatCurrency(selectedInvoice.balanceDue)}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedInvoice.balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                    required
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="ONLINE_PAYMENT">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Check number, transaction ID, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Notes</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(null);
                      setPaymentAmount("");
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-[#5c5c5c] border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedInvoice.balanceDue}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0067b8] hover:bg-[#005a9e] rounded-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
