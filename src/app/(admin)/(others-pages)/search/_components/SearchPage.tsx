"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import searchService from "@/services/searchService";
import type {
  SearchResult,
  EntityType,
  GlobalSearchData,
  EntitySearchData,
  GlobalSearchCategories,
  EntitySearchType,
} from "@/types/search";

// ─── Entity config (same as GlobalSearchBar) ──────────────────────────────────

const ENTITY_CONFIG: Record<
  EntityType,
  { label: string; plural: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  CUSTOMER: {
    label: "Customer", plural: "Customers",
    color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>,
  },
  VENDOR: {
    label: "Vendor", plural: "Vendors",
    color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>,
  },
  PRODUCT: {
    label: "Product", plural: "Products",
    color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" /></svg>,
  },
  ACCOUNT: {
    label: "Account", plural: "Accounts",
    color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>,
  },
  INVOICE: {
    label: "Invoice", plural: "Invoices",
    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  },
  BILL: {
    label: "Bill", plural: "Bills",
    color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H13a1 1 0 100-2H8.414l1.293-1.293z" clipRule="evenodd" /></svg>,
  },
  EXPENSE: {
    label: "Expense", plural: "Expenses",
    color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>,
  },
  JOURNAL_ENTRY: {
    label: "Journal Entry", plural: "Journal Entries",
    color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>,
  },
  CREDIT_NOTE: {
    label: "Credit Note", plural: "Credit Notes",
    color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/30", border: "border-teal-200 dark:border-teal-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  },
  DEBIT_NOTE: {
    label: "Debit Note", plural: "Debit Notes",
    color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  },
  ESTIMATE: {
    label: "Estimate", plural: "Estimates",
    color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/30", border: "border-cyan-200 dark:border-cyan-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
  },
  PURCHASE_ORDER: {
    label: "Purchase Order", plural: "Purchase Orders",
    color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30", border: "border-indigo-200 dark:border-indigo-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" /></svg>,
  },
  SALES_ORDER: {
    label: "Sales Order", plural: "Sales Orders",
    color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30", border: "border-violet-200 dark:border-violet-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
  },
  PROJECT: {
    label: "Project", plural: "Projects",
    color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/30", border: "border-sky-200 dark:border-sky-800",
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" /></svg>,
  },
};

// ─── Category → entityType mapping ───────────────────────────────────────────

const CATEGORY_TO_ENTITY: Record<keyof GlobalSearchCategories, EntitySearchType> = {
  customers: "customer",
  vendors: "vendor",
  products: "product",
  accounts: "account",
  invoices: "invoice",
  bills: "bill",
  expenses: "expense",
  journalEntries: "journal_entry",
  creditNotes: "credit_note",
  debitNotes: "debit_note",
  estimates: "estimate",
  purchaseOrders: "purchase_order",
  salesOrders: "sales_order",
  projects: "project",
};

const CATEGORY_TO_DISPLAY: Record<keyof GlobalSearchCategories, EntityType> = {
  customers: "CUSTOMER",
  vendors: "VENDOR",
  products: "PRODUCT",
  accounts: "ACCOUNT",
  invoices: "INVOICE",
  bills: "BILL",
  expenses: "EXPENSE",
  journalEntries: "JOURNAL_ENTRY",
  creditNotes: "CREDIT_NOTE",
  debitNotes: "DEBIT_NOTE",
  estimates: "ESTIMATE",
  purchaseOrders: "PURCHASE_ORDER",
  salesOrders: "SALES_ORDER",
  projects: "PROJECT",
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  SENT: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  OVERDUE: "bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400",
  VOID: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  APPROVED: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  PENDING: "bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
  ACTIVE: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status.toUpperCase()] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Result card ─────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: SearchResult }) {
  const cfg = ENTITY_CONFIG[result.entityType];
  return (
    <Link
      href={result.url}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-sm transition-all duration-150 group"
    >
      <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
            {result.title}
          </p>
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        {result.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{result.subtitle}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(result.date)}</p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {result.amount != null && (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
            ${result.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
        {result.status && <StatusBadge status={result.status} />}
      </div>
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
      </svg>
    </Link>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
      </div>
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

// ─── Main SearchPage ──────────────────────────────────────────────────────────

export default function SearchPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<keyof GlobalSearchCategories | "all">("all");

  const [globalData, setGlobalData] = useState<GlobalSearchData | null>(null);
  const [entityData, setEntityData] = useState<EntitySearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [entityLoading, setEntityLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Global search ──────────────────────────────────────────────────────────

  const runGlobalSearch = useCallback(
    async (q: string) => {
      if (!token || q.trim().length < 2) return;
      setLoading(true);
      setError(null);
      try {
        const data = await searchService.globalSearch(q.trim(), token, 50);
        setGlobalData(data);
        setActiveTab("all");
        setEntityData(null);
        setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // ── Entity search (tab drill-down) ─────────────────────────────────────────

  const runEntitySearch = useCallback(
    async (q: string, cat: keyof GlobalSearchCategories, pg: number) => {
      if (!token || q.trim().length < 2) return;
      setEntityLoading(true);
      try {
        const entityType = CATEGORY_TO_ENTITY[cat];
        const data = await searchService.entitySearch(entityType, q.trim(), token, pg, 20);
        setEntityData(data);
      } catch {
        setEntityData(null);
      } finally {
        setEntityLoading(false);
      }
    },
    [token]
  );

  // ── Init from URL ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      runGlobalSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tab change ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== "all" && activeQuery.trim().length >= 2) {
      setPage(1);
      runEntitySearch(activeQuery, activeTab, 1);
    }
  }, [activeTab, activeQuery, runEntitySearch]);

  // ── Page change ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== "all" && activeQuery.trim().length >= 2) {
      runEntitySearch(activeQuery, activeTab, page);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input handler ──────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim().length < 2) return;
    const q = inputValue.trim();
    setActiveQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    runGlobalSearch(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Tab pills with category counts ────────────────────────────────────────

  const tabs = globalData
    ? ([
        { key: "all" as const, label: "All", count: globalData.totalMatches },
        ...Object.entries(globalData.categories)
          .filter(([, count]) => count > 0)
          .map(([cat, count]) => ({
            key: cat as keyof GlobalSearchCategories,
            label: ENTITY_CONFIG[CATEGORY_TO_DISPLAY[cat as keyof GlobalSearchCategories]].plural,
            count,
          })),
      ])
    : [];

  // ── Results to render ─────────────────────────────────────────────────────

  const allResults: SearchResult[] =
    activeTab === "all"
      ? globalData?.results ?? []
      : entityData?.results ?? [];

  const pagination = activeTab !== "all" ? entityData?.pagination : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Global Search</h1>

          {/* Search input */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
                </svg>
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search across all entities..."
                autoFocus
                className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-12 pr-28 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 dark:focus:border-brand-700 focus:outline-none focus:ring-3 focus:ring-brand-500/10 transition-colors"
              />
              <button
                type="submit"
                disabled={inputValue.trim().length < 2}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          {globalData && !loading && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{globalData.totalMatches}</span> results for{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">"{globalData.query}"</span> across 14 entity types
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 px-4 py-3">
            <svg className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
          </div>
        )}

        {/* ── Empty / initial state ── */}
        {!loading && !globalData && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-brand-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Search everything</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Search across customers, invoices, products, expenses, and 10 more entity types all at once.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {(["INVOICE", "CUSTOMER", "EXPENSE", "PRODUCT", "PROJECT"] as EntityType[]).map((et) => {
                const cfg = ENTITY_CONFIG[et];
                return (
                  <span key={et} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.icon}
                    {cfg.plural}
                  </span>
                );
              })}
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                +9 more
              </span>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <ResultSkeleton key={i} />)}
          </div>
        )}

        {/* ── Results ── */}
        {!loading && globalData && (
          <>
            {/* Category tabs */}
            {tabs.length > 1 && (
              <div className="mb-5 flex items-center gap-1 flex-wrap">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-brand-500 text-white shadow-sm"
                          : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[18px] h-[18px] px-1 ${
                          isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results for query */}
            {globalData.totalMatches === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No results found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No matches for "{globalData.query}". Try different keywords.
                </p>
              </div>
            )}

            {/* Result cards */}
            {entityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <ResultSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {allResults.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            )}

            {/* Pagination (entity tabs only) */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                    </svg>
                    Prev
                  </button>

                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          pg === pagination.page
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
