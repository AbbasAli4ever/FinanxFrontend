"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isPermissionDeniedError, getPermissionDeniedMessage } from "@/services/apiClient";
import debitNotesService from "@/services/debitNotesService";
import vendorsService from "@/services/vendorsService";
import accountsService from "@/services/accountsService";
import type { DebitNoteListItem, DebitNoteSummary } from "@/types/debitNotes";

import DebitNotesSummaryCards from "./DebitNotesSummaryCards";
import DebitNotesTable from "./DebitNotesTable";
import CreateDebitNoteModal from "./CreateDebitNoteModal";
import EditDebitNoteModal from "./EditDebitNoteModal";
import DebitNoteDetailModal from "./DebitNoteDetailModal";
import OpenDebitNoteModal from "./OpenDebitNoteModal";
import ApplyDebitNoteModal from "./ApplyDebitNoteModal";
import RefundDebitNoteModal from "./RefundDebitNoteModal";
import VoidDebitNoteModal from "./VoidDebitNoteModal";
import DeleteDebitNoteModal from "./DeleteDebitNoteModal";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_APPLIED", label: "Partial" },
  { value: "APPLIED", label: "Applied" },
  { value: "VOID", label: "Void" },
];

const DebitNotesPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [debitNotes, setDebitNotes] = useState<DebitNoteListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [summary, setSummary] = useState<DebitNoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [vendorsList, setVendorsList] = useState<{ id: string; displayName: string }[]>([]);
  const [accountsList, setAccountsList] = useState<{ id: string; name: string; accountNumber: string }[]>([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal();
  const openModal = useModal();
  const applyModal = useModal();
  const refundModal = useModal();
  const voidModal = useModal();
  const deleteModal = useModal();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedRemainingDebit, setSelectedRemainingDebit] = useState(0);
  const [selectedTotalAmount, setSelectedTotalAmount] = useState(0);

  const hasAccess = Boolean(token && isAuthenticated);

  const fetchDebitNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await debitNotesService.getDebitNotes(
        { status: statusFilter || undefined, search: searchFilter || undefined, sortBy: "debitNoteDate", sortOrder: "desc", page: pagination.page.toString(), limit: pagination.limit.toString() },
        token
      );
      setDebitNotes(data.items ?? []);
      setPagination(data.pagination);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({ variant: "warning", title: "Access Denied", message: getPermissionDeniedMessage(error) });
      } else {
        setAlert({ variant: "error", title: "Unable to load debit notes", message: formatApiErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchFilter, pagination.page, pagination.limit]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try { setSummary(await debitNotesService.getSummary(token)); } catch { /* non-critical */ }
  }, [token]);

  const fetchReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      const vendors = await vendorsService.getVendors({ isActive: "true", sortBy: "displayName", sortOrder: "asc" }, token);
      setVendorsList(vendors.map((v) => ({ id: v.id, displayName: v.displayName })));
    } catch { /* non-critical */ }
    try {
      const accounts = await accountsService.getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token);
      setAccountsList(accounts.map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber })));
    } catch { /* non-critical */ }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchDebitNotes();
    fetchSummary();
    fetchReferenceData();
  }, [hasAccess, permissionsLoading, fetchDebitNotes, fetchSummary, fetchReferenceData]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchFilter(value), 400);
  };

  const refreshAll = () => { fetchDebitNotes(); fetchSummary(); };

  const handleView = (dn: DebitNoteListItem) => { setSelectedId(dn.id); detailModal.openModal(); };
  const handleEdit = (dn: DebitNoteListItem) => { setSelectedId(dn.id); editModal.openModal(); };
  const handleDelete = (dn: DebitNoteListItem) => { setSelectedId(dn.id); setSelectedNumber(dn.debitNoteNumber); deleteModal.openModal(); };
  const handleOpen = (dn: DebitNoteListItem) => { setSelectedId(dn.id); setSelectedNumber(dn.debitNoteNumber); setSelectedTotalAmount(dn.totalAmount); openModal.openModal(); };
  const handleApply = (dn: DebitNoteListItem) => { setSelectedId(dn.id); setSelectedNumber(dn.debitNoteNumber); setSelectedVendorId(dn.vendor.id); setSelectedRemainingDebit(dn.remainingDebit); applyModal.openModal(); };
  const handleRefund = (dn: DebitNoteListItem) => { setSelectedId(dn.id); setSelectedNumber(dn.debitNoteNumber); setSelectedRemainingDebit(dn.remainingDebit); refundModal.openModal(); };
  const handleVoid = (dn: DebitNoteListItem) => { setSelectedId(dn.id); setSelectedNumber(dn.debitNoteNumber); setSelectedRemainingDebit(dn.remainingDebit); voidModal.openModal(); };

  const handleDetailEdit = (id: string) => { setSelectedId(id); editModal.openModal(); };
  const handleDetailOpen = (id: string, number: string, amount: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedTotalAmount(amount); openModal.openModal(); };
  const handleDetailApply = (id: string, number: string, vendorId: string, remainingDebit: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedVendorId(vendorId); setSelectedRemainingDebit(remainingDebit); applyModal.openModal(); };
  const handleDetailRefund = (id: string, number: string, remainingDebit: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedRemainingDebit(remainingDebit); refundModal.openModal(); };
  const handleDetailVoid = (id: string, number: string, remainingDebit: number) => { setSelectedId(id); setSelectedNumber(number); setSelectedRemainingDebit(remainingDebit); voidModal.openModal(); };
  const handleDetailDelete = (id: string, number: string) => { setSelectedId(id); setSelectedNumber(number); deleteModal.openModal(); };

  if (!isReady || permissionsLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <p className="font-semibold text-gray-900 dark:text-white/90">Sign in to view debit notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Purchases</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Debit Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage vendor returns and purchase adjustments</p>
        </div>
        <Button size="sm" onClick={createModal.openModal}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z" fill="currentColor" />
          </svg>
          New Debit Note
        </Button>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      <DebitNotesSummaryCards summary={summary} />

      {/* Status Tabs + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-800"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search debit notes..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading debit notes...</span>
          </div>
        </div>
      ) : (
        <>
          <DebitNotesTable
            debitNotes={debitNotes}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpen={handleOpen}
            onApply={handleApply}
            onRefund={handleRefund}
            onVoid={handleVoid}
          />
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateDebitNoteModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={() => { setAlert({ variant: "success", title: "Debit Note Created", message: "Draft debit note created successfully." }); refreshAll(); }}
        vendors={vendorsList}
      />

      <EditDebitNoteModal
        isOpen={editModal.isOpen}
        debitNoteId={selectedId}
        onClose={() => { editModal.closeModal(); setSelectedId(null); }}
        onUpdated={() => { setAlert({ variant: "success", title: "Debit Note Updated", message: "Debit note updated successfully." }); refreshAll(); }}
        vendors={vendorsList}
      />

      <DebitNoteDetailModal
        isOpen={detailModal.isOpen}
        debitNoteId={selectedId}
        onClose={() => { detailModal.closeModal(); setSelectedId(null); }}
        onEdit={handleDetailEdit}
        onOpen={handleDetailOpen}
        onApply={handleDetailApply}
        onRefund={handleDetailRefund}
        onVoid={handleDetailVoid}
        onDelete={handleDetailDelete}
      />

      <OpenDebitNoteModal
        isOpen={openModal.isOpen}
        debitNoteId={selectedId}
        debitNoteNumber={selectedNumber}
        totalAmount={selectedTotalAmount}
        onClose={() => { openModal.closeModal(); setSelectedId(null); }}
        onOpened={() => { setAlert({ variant: "success", title: "Debit Note Issued", message: "Debit note is now open and ready to apply." }); refreshAll(); }}
      />

      <ApplyDebitNoteModal
        isOpen={applyModal.isOpen}
        debitNoteId={selectedId}
        debitNoteNumber={selectedNumber}
        vendorId={selectedVendorId}
        remainingDebit={selectedRemainingDebit}
        onClose={() => { applyModal.closeModal(); setSelectedId(null); }}
        onApplied={() => { setAlert({ variant: "success", title: "Debit Applied", message: "Debit note applied to bill(s) successfully." }); refreshAll(); }}
      />

      <RefundDebitNoteModal
        isOpen={refundModal.isOpen}
        debitNoteId={selectedId}
        debitNoteNumber={selectedNumber}
        remainingDebit={selectedRemainingDebit}
        accounts={accountsList}
        onClose={() => { refundModal.closeModal(); setSelectedId(null); }}
        onRefunded={() => { setAlert({ variant: "success", title: "Refund Received", message: "Vendor refund recorded successfully." }); refreshAll(); }}
      />

      <VoidDebitNoteModal
        isOpen={voidModal.isOpen}
        debitNoteId={selectedId}
        debitNoteNumber={selectedNumber}
        remainingDebit={selectedRemainingDebit}
        onClose={() => { voidModal.closeModal(); setSelectedId(null); }}
        onVoided={() => { setAlert({ variant: "success", title: "Debit Note Voided", message: "Debit note has been voided." }); refreshAll(); }}
      />

      <DeleteDebitNoteModal
        isOpen={deleteModal.isOpen}
        debitNoteId={selectedId}
        debitNoteNumber={selectedNumber}
        onClose={() => { deleteModal.closeModal(); setSelectedId(null); }}
        onDeleted={() => { setAlert({ variant: "success", title: "Debit Note Deleted", message: "Draft debit note permanently deleted." }); refreshAll(); }}
      />
    </div>
  );
};

export default DebitNotesPage;
