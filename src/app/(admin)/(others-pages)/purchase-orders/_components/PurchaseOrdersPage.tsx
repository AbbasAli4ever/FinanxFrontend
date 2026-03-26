"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { BulkExportButton } from "@/components/export/ExportButton";
import purchaseOrdersService from "@/services/purchaseOrdersService";
import vendorsService from "@/services/vendorsService";
import accountsService from "@/services/accountsService";
import type { POListItem, POSummary, PurchaseOrder } from "@/types/purchaseOrders";
import type { Vendor } from "@/types/vendors";
import type { Account } from "@/types/accounts";

import PurchaseOrdersSummaryCards from "./PurchaseOrdersSummaryCards";
import PurchaseOrdersTable from "./PurchaseOrdersTable";
import CreatePurchaseOrderModal from "./CreatePurchaseOrderModal";
import EditPurchaseOrderModal from "./EditPurchaseOrderModal";
import PurchaseOrderDetailModal from "./PurchaseOrderDetailModal";
import DeletePurchaseOrderModal from "./DeletePurchaseOrderModal";
import SendPurchaseOrderModal from "./SendPurchaseOrderModal";
import ReceiveItemsModal from "./ReceiveItemsModal";
import ConvertToBillModal from "./ConvertToBillModal";
import ClosePurchaseOrderModal from "./ClosePurchaseOrderModal";
import VoidPurchaseOrderModal from "./VoidPurchaseOrderModal";
import AppDatePicker from "@/components/form/AppDatePicker";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Received", value: "RECEIVED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Void", value: "VOID" },
];

const PAGE_SIZE = 20;

const PurchaseOrdersPage: React.FC = () => {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();

  // Data
  const [summary, setSummary] = useState<POSummary | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<POListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Loading
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [refLoading, setRefLoading] = useState(true);

  // Filters
  const [activeStatus, setActiveStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteNumber, setDeleteNumber] = useState("");
  const [sendId, setSendId] = useState<string | null>(null);
  const [sendNumber, setSendNumber] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [convertNumber, setConvertNumber] = useState("");
  const [convertAmount, setConvertAmount] = useState(0);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [closeNumber, setCloseNumber] = useState("");
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidNumber, setVoidNumber] = useState("");

  // Fetch reference data once
  useEffect(() => {
    if (!token) return;
    setRefLoading(true);
    Promise.all([
      vendorsService.getVendors({ isActive: "true", sortBy: "displayName", sortOrder: "asc" }, token),
      accountsService.getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token),
    ])
      .then(([v, a]) => {
        setVendors(Array.isArray(v) ? v : []);
        setAccounts(Array.isArray(a) ? a : []);
      })
      .catch(() => {})
      .finally(() => setRefLoading(false));
  }, [token]);

  // Fetch summary
  const fetchSummary = useCallback(() => {
    if (!token) return;
    setSummaryLoading(true);
    purchaseOrdersService.getSummary(token)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [token]);

  // Fetch table
  const fetchPurchaseOrders = useCallback((pg = 1) => {
    if (!token) return;
    setTableLoading(true);
    purchaseOrdersService.getPurchaseOrders({
      status: activeStatus || undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: String(pg),
      limit: String(PAGE_SIZE),
      sortBy: "createdAt",
      sortOrder: "desc",
    }, token)
      .then((data) => {
        setPurchaseOrders(data.items ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }, [token, activeStatus, search, dateFrom, dateTo]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    setPage(1);
    fetchPurchaseOrders(1);
  }, [fetchPurchaseOrders]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); }, 400);
  };

  const handlePageChange = (pg: number) => { setPage(pg); fetchPurchaseOrders(pg); };

  const refresh = () => { fetchSummary(); fetchPurchaseOrders(page); };

  // Receive items — needs full PO details
  const openReceive = async (id: string) => {
    if (!token) return;
    setReceiveLoading(true);
    setReceivePoId(id);
    try {
      const po = await purchaseOrdersService.getPurchaseOrder(id, token);
      setReceivePo(po);
    } catch {
      setReceivePoId(null);
    } finally {
      setReceiveLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Manage vendor purchase orders and track deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkExportButton
            entityType="purchase-order"
            token={token ?? ""}
            canExport={hasPermission("data:export")}
          />
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={refLoading}
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <PurchaseOrdersSummaryCards summary={summary} loading={summaryLoading} />

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >{tab.label}</button>
          ))}
        </div>

        {/* Search + Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search PO #, vendor..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-64"
            />
          </div>
          <AppDatePicker
            value={dateFrom}
            onChange={(val) => { setDateFrom(val); setPage(1); }}
            placeholder="From date"
            maxToday
            max={dateTo || undefined}
            className="w-36"
          />
          <span className="text-gray-400 text-sm select-none">—</span>
          <AppDatePicker
            value={dateTo}
            onChange={(val) => { setDateTo(val); setPage(1); }}
            placeholder="To date"
            min={dateFrom || undefined}
            maxToday
            className="w-36"
          />
        </div>
      </div>

      {/* Table */}
      {receiveLoading && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          Loading purchase order details...
        </div>
      )}

      <PurchaseOrdersTable
        purchaseOrders={purchaseOrders}
        loading={tableLoading}
        onView={(id) => setDetailId(id)}
        onEdit={(id) => setEditId(id)}
        onSend={(id, num, amt) => { setSendId(id); setSendNumber(num); setSendAmount(amt); }}
        onReceive={(id) => openReceive(id)}
        onConvert={(id, num, amt) => { setConvertId(id); setConvertNumber(num); setConvertAmount(amt); }}
        onClose={(id, num) => { setCloseId(id); setCloseNumber(num); }}
        onVoid={(id, num) => { setVoidId(id); setVoidNumber(num); }}
        onDelete={(id, num) => { setDeleteId(id); setDeleteNumber(num); }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => handlePageChange(pg)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                pg === page
                  ? "bg-brand-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >{pg}</button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Create */}
      <CreatePurchaseOrderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
        vendors={vendors}
        accounts={accounts}
      />

      {/* Edit */}
      <EditPurchaseOrderModal
        isOpen={!!editId}
        poId={editId}
        onClose={() => setEditId(null)}
        onUpdated={refresh}
        vendors={vendors}
        accounts={accounts}
      />

      {/* Detail */}
      <PurchaseOrderDetailModal
        isOpen={!!detailId}
        poId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(id) => { setDetailId(null); setEditId(id); }}
        onSend={(id, num, amt) => { setDetailId(null); setSendId(id); setSendNumber(num); setSendAmount(amt); }}
        onReceive={(id) => { setDetailId(null); openReceive(id); }}
        onConvert={(id, num, amt) => { setDetailId(null); setConvertId(id); setConvertNumber(num); setConvertAmount(amt); }}
        onClose2={(id, num) => { setDetailId(null); setCloseId(id); setCloseNumber(num); }}
        onVoid={(id, num) => { setDetailId(null); setVoidId(id); setVoidNumber(num); }}
        onDelete={(id, num) => { setDetailId(null); setDeleteId(id); setDeleteNumber(num); }}
        onDuplicated={refresh}
      />

      {/* Delete */}
      <DeletePurchaseOrderModal
        isOpen={!!deleteId}
        poId={deleteId}
        poNumber={deleteNumber}
        onClose={() => setDeleteId(null)}
        onDeleted={refresh}
      />

      {/* Send */}
      <SendPurchaseOrderModal
        isOpen={!!sendId}
        poId={sendId}
        poNumber={sendNumber}
        amount={sendAmount}
        onClose={() => setSendId(null)}
        onSent={refresh}
      />

      {/* Receive Items */}
      <ReceiveItemsModal
        isOpen={!!receivePoId && !!receivePo}
        po={receivePo}
        onClose={() => { setReceivePoId(null); setReceivePo(null); }}
        onReceived={refresh}
      />

      {/* Convert to Bill */}
      <ConvertToBillModal
        isOpen={!!convertId}
        poId={convertId}
        poNumber={convertNumber}
        amount={convertAmount}
        onClose={() => setConvertId(null)}
        onConverted={refresh}
      />

      {/* Close */}
      <ClosePurchaseOrderModal
        isOpen={!!closeId}
        poId={closeId}
        poNumber={closeNumber}
        onClose={() => setCloseId(null)}
        onClosed={refresh}
      />

      {/* Void */}
      <VoidPurchaseOrderModal
        isOpen={!!voidId}
        poId={voidId}
        poNumber={voidNumber}
        onClose={() => setVoidId(null)}
        onVoided={refresh}
      />
    </div>
  );
};

export default PurchaseOrdersPage;
