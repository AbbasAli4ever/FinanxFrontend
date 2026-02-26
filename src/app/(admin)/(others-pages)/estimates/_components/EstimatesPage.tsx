"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import estimatesService from "@/services/estimatesService";
import customersService from "@/services/customersService";
import accountsService from "@/services/accountsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { EstimateListItem, EstimateSummary } from "@/types/estimates";

import EstimatesSummaryCards from "./EstimatesSummaryCards";
import EstimatesTable from "./EstimatesTable";
import CreateEstimateModal from "./CreateEstimateModal";
import EditEstimateModal from "./EditEstimateModal";
import EstimateDetailModal from "./EstimateDetailModal";
import SendEstimateModal from "./SendEstimateModal";
import AcceptEstimateModal from "./AcceptEstimateModal";
import RejectEstimateModal from "./RejectEstimateModal";
import ConvertToInvoiceModal from "./ConvertToInvoiceModal";
import VoidEstimateModal from "./VoidEstimateModal";
import DeleteEstimateModal from "./DeleteEstimateModal";

type AlertState = { variant: "error" | "warning" | "success" | "info"; title: string; message: string };

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CONVERTED", label: "Converted" },
  { value: "VOID", label: "Void" },
];

const EstimatesPage: React.FC = () => {
  const { token } = useAuth();

  // Data state
  const [estimates, setEstimates] = useState<EstimateListItem[]>([]);
  const [summary, setSummary] = useState<EstimateSummary | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Reference data
  const [customersList, setCustomersList] = useState<{ id: string; displayName: string }[]>([]);
  const [accountsList, setAccountsList] = useState<{ id: string; name: string; accountNumber: string }[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected context
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [selectedTotalAmount, setSelectedTotalAmount] = useState(0);

  // Modals
  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal();
  const sendModal = useModal();
  const acceptModal = useModal();
  const rejectModal = useModal();
  const convertModal = useModal();
  const voidModal = useModal();
  const deleteModal = useModal();

  // Data fetching
  const fetchEstimates = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await estimatesService.getEstimates({
        status: statusFilter || undefined,
        search: searchFilter || undefined,
        sortBy: "estimateDate",
        sortOrder: "desc",
        page: String(page),
        limit: String(pagination.limit),
      }, token);
      setEstimates(data.items ?? []);
      setPagination(data.pagination);
    } catch (error) {
      setAlert({ variant: "error", title: "Unable to load estimates", message: formatApiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchFilter, pagination.limit]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    setSummaryLoading(true);
    try {
      const data = await estimatesService.getSummary(token);
      setSummary(data);
    } catch {
      // Non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  const fetchReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      const [cust, accts] = await Promise.all([
        customersService.getCustomers({ isActive: "true", sortBy: "displayName", sortOrder: "asc" }, token),
        accountsService.getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token),
      ]);
      setCustomersList((Array.isArray(cust) ? cust : []).map((c) => ({ id: c.id, displayName: c.displayName })));
      setAccountsList((Array.isArray(accts) ? accts : []).map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber })));
    } catch {
      // Non-critical
    }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchEstimates(1);
    fetchSummary();
  }, [fetchEstimates, fetchSummary]);

  useEffect(() => { fetchEstimates(1); }, [statusFilter, searchFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSummary(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReferenceData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearchFilter(value), 400);
  };

  // Expire overdue
  const [expiringLoading, setExpiringLoading] = useState(false);
  const handleExpireOverdue = async () => {
    if (!token) return;
    setExpiringLoading(true);
    try {
      const result = await estimatesService.expireOverdue(token);
      setAlert({ variant: "success", title: "Done", message: `${result.expiredCount} estimate(s) marked as expired.` });
      refreshAll();
    } catch (err) {
      setAlert({ variant: "error", title: "Error", message: formatApiErrorMessage(err) });
    } finally {
      setExpiringLoading(false);
    }
  };

  // Table action handlers
  const handleView = (est: EstimateListItem) => {
    setSelectedId(est.id); setSelectedNumber(est.estimateNumber); setSelectedTotalAmount(est.totalAmount);
    detailModal.openModal();
  };
  const handleEdit = (est: EstimateListItem) => { setSelectedId(est.id); editModal.openModal(); };
  const handleDelete = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); deleteModal.openModal(); };
  const handleSend = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); setSelectedTotalAmount(est.totalAmount); sendModal.openModal(); };
  const handleAccept = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); setSelectedTotalAmount(est.totalAmount); acceptModal.openModal(); };
  const handleReject = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); rejectModal.openModal(); };
  const handleConvert = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); setSelectedTotalAmount(est.totalAmount); convertModal.openModal(); };
  const handleVoid = (est: EstimateListItem) => { setSelectedId(est.id); setSelectedNumber(est.estimateNumber); voidModal.openModal(); };

  // From detail modal action triggers
  const handleDetailEdit = (id: string) => { setSelectedId(id); editModal.openModal(); };
  const handleDetailSend = (id: string, number: string, amount: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedTotalAmount(amount); sendModal.openModal(); };
  const handleDetailAccept = (id: string, number: string, amount: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedTotalAmount(amount); acceptModal.openModal(); };
  const handleDetailReject = (id: string, number: string) => { setSelectedId(id); setSelectedNumber(number); rejectModal.openModal(); };
  const handleDetailConvert = (id: string, number: string, amount: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedTotalAmount(amount); convertModal.openModal(); };
  const handleDetailVoid = (id: string, number: string) => { setSelectedId(id); setSelectedNumber(number); voidModal.openModal(); };
  const handleDetailDelete = (id: string, number: string) => { setSelectedId(id); setSelectedNumber(number); deleteModal.openModal(); };

  const totalPages = pagination.totalPages;

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Create and manage quotes for customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExpireOverdue} disabled={expiringLoading}>
            {expiringLoading ? "Processing..." : "Expire Overdue"}
          </Button>
          <Button onClick={createModal.openModal}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Estimate
          </Button>
        </div>
      </div>

      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
        />
      )}

      {/* Summary Cards */}
      <EstimatesSummaryCards summary={summary} loading={summaryLoading} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search estimates..."
            className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading estimates...</span>
        </div>
      ) : (
        <EstimatesTable
          estimates={estimates}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSend={handleSend}
          onAccept={handleAccept}
          onReject={handleReject}
          onConvert={handleConvert}
          onVoid={handleVoid}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchEstimates(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => fetchEstimates(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateEstimateModal
        isOpen={createModal.isOpen}
        customers={customersList}
        accounts={accountsList}
        onClose={createModal.closeModal}
        onCreated={refreshAll}
      />

      <EditEstimateModal
        isOpen={editModal.isOpen}
        estimateId={selectedId}
        customers={customersList}
        accounts={accountsList}
        onClose={editModal.closeModal}
        onUpdated={refreshAll}
      />

      <EstimateDetailModal
        isOpen={detailModal.isOpen}
        estimateId={selectedId}
        onClose={detailModal.closeModal}
        onEdit={handleDetailEdit}
        onSend={handleDetailSend}
        onAccept={handleDetailAccept}
        onReject={handleDetailReject}
        onConvert={handleDetailConvert}
        onVoid={handleDetailVoid}
        onDelete={handleDetailDelete}
        onDuplicated={refreshAll}
      />

      <SendEstimateModal
        isOpen={sendModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        totalAmount={selectedTotalAmount}
        onClose={sendModal.closeModal}
        onSent={refreshAll}
      />

      <AcceptEstimateModal
        isOpen={acceptModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        totalAmount={selectedTotalAmount}
        onClose={acceptModal.closeModal}
        onAccepted={refreshAll}
      />

      <RejectEstimateModal
        isOpen={rejectModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        onClose={rejectModal.closeModal}
        onRejected={refreshAll}
      />

      <ConvertToInvoiceModal
        isOpen={convertModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        totalAmount={selectedTotalAmount}
        onClose={convertModal.closeModal}
        onConverted={refreshAll}
      />

      <VoidEstimateModal
        isOpen={voidModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        onClose={voidModal.closeModal}
        onVoided={refreshAll}
      />

      <DeleteEstimateModal
        isOpen={deleteModal.isOpen}
        estimateId={selectedId}
        estimateNumber={selectedNumber}
        onClose={deleteModal.closeModal}
        onDeleted={refreshAll}
      />
    </div>
  );
};

export default EstimatesPage;
