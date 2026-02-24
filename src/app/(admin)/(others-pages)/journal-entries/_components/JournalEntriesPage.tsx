"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import journalEntriesService from "@/services/journalEntriesService";
import accountsService from "@/services/accountsService";
import type { JournalEntryListItem, JournalEntrySummary, JournalEntryStatusInfo } from "@/types/journalEntries";

import JournalEntrySummaryCards from "./JournalEntrySummaryCards";
import JournalEntriesTable from "./JournalEntriesTable";
import CreateJournalEntryModal from "./CreateJournalEntryModal";
import EditJournalEntryModal from "./EditJournalEntryModal";
import JournalEntryDetailModal from "./JournalEntryDetailModal";
import PostJournalEntryModal from "./PostJournalEntryModal";
import VoidJournalEntryModal from "./VoidJournalEntryModal";
import DeleteJournalEntryModal from "./DeleteJournalEntryModal";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const JournalEntriesPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [summary, setSummary] = useState<JournalEntrySummary | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, JournalEntryStatusInfo>>({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Reference data
  const [accountsList, setAccountsList] = useState<
    { id: string; name: string; accountNumber: string }[]
  >([]);

  // Filters
  const [filters, setFilters] = useState({ search: "", status: "", entryType: "" });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Modals
  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal();
  const postModal = useModal();
  const voidModal = useModal();
  const deleteModal = useModal();

  // Selected entry context
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntryNumber, setSelectedEntryNumber] = useState("");
  const [selectedTotalDebit, setSelectedTotalDebit] = useState(0);
  const [selectedTotalCredit, setSelectedTotalCredit] = useState(0);

  const hasAccess = Boolean(token && isAuthenticated);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await journalEntriesService.getJournalEntries(
        {
          search: filters.search || undefined,
          status: filters.status || undefined,
          entryType: filters.entryType || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        },
        token
      );
      setEntries(data.items);
      setPagination(data.pagination);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: getPermissionDeniedMessage(error),
        });
      } else {
        setAlert({
          variant: "error",
          title: "Unable to load journal entries",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters.search, filters.status, filters.entryType, pagination.page, pagination.limit]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await journalEntriesService.getSummary(token);
      setSummary(data);
    } catch {
      // Non-critical
    }
  }, [token]);

  // Fetch statuses
  const fetchStatuses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await journalEntriesService.getStatuses(token);
      setStatusMap(data);
    } catch {
      // Non-critical
    }
  }, [token]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    if (!token) return;
    try {
      const accounts = await accountsService.getAccounts(
        { isActive: "true", sortBy: "accountNumber", sortOrder: "asc" },
        token
      );
      setAccountsList(
        accounts.map((a) => ({
          id: a.id,
          name: a.name,
          accountNumber: a.accountNumber,
        }))
      );
    } catch {
      /* Non-critical */
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchEntries();
    fetchSummary();
    fetchStatuses();
    fetchReferenceData();
  }, [
    hasAccess,
    permissionsLoading,
    fetchEntries,
    fetchSummary,
    fetchStatuses,
    fetchReferenceData,
  ]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const refreshAll = () => {
    fetchEntries();
    fetchSummary();
  };

  // Modal handlers — from table rows
  const handleView = (entry: JournalEntryListItem) => {
    setSelectedEntryId(entry.id);
    detailModal.openModal();
  };
  const handleEdit = (entry: JournalEntryListItem) => {
    setSelectedEntryId(entry.id);
    editModal.openModal();
  };
  const handlePost = (entry: JournalEntryListItem) => {
    setSelectedEntryId(entry.id);
    setSelectedEntryNumber(entry.entryNumber);
    setSelectedTotalDebit(entry.totalDebit);
    setSelectedTotalCredit(entry.totalCredit);
    postModal.openModal();
  };
  const handleVoid = (entry: JournalEntryListItem) => {
    setSelectedEntryId(entry.id);
    setSelectedEntryNumber(entry.entryNumber);
    voidModal.openModal();
  };
  const handleDelete = (entry: JournalEntryListItem) => {
    setSelectedEntryId(entry.id);
    setSelectedEntryNumber(entry.entryNumber);
    deleteModal.openModal();
  };

  // Reverse & Duplicate — inline API calls (no modal)
  const handleReverse = async (entry: JournalEntryListItem) => {
    if (!token) return;
    try {
      const reversed = await journalEntriesService.reverseJournalEntry(entry.id, token);
      setAlert({
        variant: "success",
        title: "Entry Reversed",
        message: `Reversing entry ${reversed.entryNumber} has been created as a draft.`,
      });
      refreshAll();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "Reverse Failed",
        message: formatApiErrorMessage(err),
      });
    }
  };

  const handleDuplicate = async (entry: JournalEntryListItem) => {
    if (!token) return;
    try {
      const duplicated = await journalEntriesService.duplicateJournalEntry(entry.id, token);
      setAlert({
        variant: "success",
        title: "Entry Duplicated",
        message: `Duplicate entry ${duplicated.entryNumber} has been created as a draft.`,
      });
      refreshAll();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "Duplicate Failed",
        message: formatApiErrorMessage(err),
      });
    }
  };

  // Modal handlers — from detail modal
  const handleEditById = (id: string) => {
    setSelectedEntryId(id);
    editModal.openModal();
  };
  const handlePostById = (id: string, num: string, debit: number, credit: number) => {
    setSelectedEntryId(id);
    setSelectedEntryNumber(num);
    setSelectedTotalDebit(debit);
    setSelectedTotalCredit(credit);
    postModal.openModal();
  };
  const handleVoidById = (id: string, num: string) => {
    setSelectedEntryId(id);
    setSelectedEntryNumber(num);
    voidModal.openModal();
  };
  const handleReverseById = async (id: string) => {
    if (!token) return;
    try {
      const reversed = await journalEntriesService.reverseJournalEntry(id, token);
      setAlert({
        variant: "success",
        title: "Entry Reversed",
        message: `Reversing entry ${reversed.entryNumber} has been created as a draft.`,
      });
      refreshAll();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "Reverse Failed",
        message: formatApiErrorMessage(err),
      });
    }
  };
  const handleDuplicateById = async (id: string) => {
    if (!token) return;
    try {
      const duplicated = await journalEntriesService.duplicateJournalEntry(id, token);
      setAlert({
        variant: "success",
        title: "Entry Duplicated",
        message: `Duplicate entry ${duplicated.entryNumber} has been created as a draft.`,
      });
      refreshAll();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "Duplicate Failed",
        message: formatApiErrorMessage(err),
      });
    }
  };
  const handleDeleteById = (id: string, num: string) => {
    setSelectedEntryId(id);
    setSelectedEntryNumber(num);
    deleteModal.openModal();
  };

  // Success callbacks
  const handleCreated = () => {
    setAlert({
      variant: "success",
      title: "Entry Created",
      message: "The journal entry has been created successfully.",
    });
    refreshAll();
  };
  const handleUpdated = () => {
    setAlert({
      variant: "success",
      title: "Entry Updated",
      message: "The journal entry has been updated successfully.",
    });
    refreshAll();
  };
  const handlePosted = () => {
    setAlert({
      variant: "success",
      title: "Entry Posted",
      message: "The journal entry has been posted to the general ledger.",
    });
    refreshAll();
  };
  const handleVoided = () => {
    setAlert({
      variant: "success",
      title: "Entry Voided",
      message: "The journal entry has been voided.",
    });
    refreshAll();
  };
  const handleDeleted = () => {
    setAlert({
      variant: "success",
      title: "Entry Deleted",
      message: "The journal entry has been permanently deleted.",
    });
    refreshAll();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

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
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
        <p className="font-semibold text-gray-900 dark:text-white/90">
          Waiting for authentication...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in to view journal entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
            Finance
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Journal Entries
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage general ledger journal entries
          </p>
        </div>
        <Button size="sm" onClick={createModal.openModal}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z"
              fill="currentColor"
            />
          </svg>
          New Entry
        </Button>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      <JournalEntrySummaryCards summary={summary} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search journal entries..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.status
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
          <option value="VOID">Void</option>
        </select>
        <select
          value={filters.entryType}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, entryType: e.target.value }))
          }
          className={`${selectClasses} ${
            filters.entryType
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          <option value="">All Types</option>
          <option value="STANDARD">Standard</option>
          <option value="ADJUSTING">Adjusting</option>
          <option value="CLOSING">Closing</option>
          <option value="REVERSING">Reversing</option>
          <option value="RECURRING">Recurring</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading journal entries...
            </span>
          </div>
        </div>
      ) : (
        <>
          <JournalEntriesTable
            entries={entries}
            statusMap={statusMap}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPost={handlePost}
            onVoid={handleVoid}
            onReverse={handleReverse}
            onDuplicate={handleDuplicate}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateJournalEntryModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
        accounts={accountsList}
      />

      <EditJournalEntryModal
        isOpen={editModal.isOpen}
        entryId={selectedEntryId}
        onClose={() => {
          editModal.closeModal();
          setSelectedEntryId(null);
        }}
        onUpdated={handleUpdated}
        accounts={accountsList}
      />

      <JournalEntryDetailModal
        isOpen={detailModal.isOpen}
        entryId={selectedEntryId}
        statusMap={statusMap}
        onClose={() => {
          detailModal.closeModal();
          setSelectedEntryId(null);
        }}
        onEdit={handleEditById}
        onPost={handlePostById}
        onVoid={handleVoidById}
        onReverse={handleReverseById}
        onDuplicate={handleDuplicateById}
        onDelete={handleDeleteById}
      />

      <PostJournalEntryModal
        isOpen={postModal.isOpen}
        entryId={selectedEntryId}
        entryNumber={selectedEntryNumber}
        totalDebit={selectedTotalDebit}
        totalCredit={selectedTotalCredit}
        onClose={() => {
          postModal.closeModal();
          setSelectedEntryId(null);
        }}
        onPosted={handlePosted}
      />

      <VoidJournalEntryModal
        isOpen={voidModal.isOpen}
        entryId={selectedEntryId}
        entryNumber={selectedEntryNumber}
        onClose={() => {
          voidModal.closeModal();
          setSelectedEntryId(null);
        }}
        onVoided={handleVoided}
      />

      <DeleteJournalEntryModal
        isOpen={deleteModal.isOpen}
        entryId={selectedEntryId}
        entryNumber={selectedEntryNumber}
        onClose={() => {
          deleteModal.closeModal();
          setSelectedEntryId(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default JournalEntriesPage;
