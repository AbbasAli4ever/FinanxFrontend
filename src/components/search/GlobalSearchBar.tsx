"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import searchService from "@/services/searchService";
import type { SearchResult, EntityType, QuickSearchData } from "@/types/search";

// ─── Entity config ────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<
  EntityType,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  CUSTOMER: {
    label: "Customer",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
      </svg>
    ),
  },
  VENDOR: {
    label: "Vendor",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  PRODUCT: {
    label: "Product",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
      </svg>
    ),
  },
  ACCOUNT: {
    label: "Account",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  INVOICE: {
    label: "Invoice",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  BILL: {
    label: "Bill",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H13a1 1 0 100-2H8.414l1.293-1.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  EXPENSE: {
    label: "Expense",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  JOURNAL_ENTRY: {
    label: "Journal",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  CREDIT_NOTE: {
    label: "Credit Note",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  DEBIT_NOTE: {
    label: "Debit Note",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  ESTIMATE: {
    label: "Estimate",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  PURCHASE_ORDER: {
    label: "Purchase Order",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
      </svg>
    ),
  },
  SALES_ORDER: {
    label: "Sales Order",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  PROJECT: {
    label: "Project",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
      </svg>
    ),
  },
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
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

// ─── Group results by entityType ──────────────────────────────────────────────

function groupByEntity(results: SearchResult[]): Map<EntityType, SearchResult[]> {
  const map = new Map<EntityType, SearchResult[]>();
  for (const r of results) {
    const arr = map.get(r.entityType) ?? [];
    arr.push(r);
    map.set(r.entityType, arr);
  }
  return map;
}

// ─── Single result row ────────────────────────────────────────────────────────

function ResultRow({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  const cfg = ENTITY_CONFIG[result.entityType];
  return (
    <Link
      href={result.url}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors rounded-lg mx-1 group"
    >
      <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        {result.amount != null && (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            ${result.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
        {result.status && <StatusBadge status={result.status} />}
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GlobalSearchBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function GlobalSearchBar({ inputRef }: GlobalSearchBarProps) {
  const { token } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [data, setData] = useState<QuickSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (!token || q.trim().length < 2) {
        setData(null);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const result = await searchService.quickSearch(q.trim(), token);
        setData(result);
        setOpen(true);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setData(null);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && query.trim().length >= 2) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setData(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const closeDropdown = () => setOpen(false);

  const grouped = data ? groupByEntity(data.results) : new Map<EntityType, SearchResult[]>();
  const hasResults = grouped.size > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <span className="absolute -translate-y-1/2 left-2.5 top-1/2 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg
              className="fill-gray-500 dark:fill-gray-400"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                fill=""
              />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (data && query.trim().length >= 2) setOpen(true);
          }}
          placeholder="Search customers, invoices, products..."
          className="h-8 w-full rounded border border-gray-200 bg-transparent py-0 pl-9 pr-16 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-600 xl:w-[360px]"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.22 1.22a.75.75 0 011.06 0L7 5.94l4.72-4.72a.75.75 0 111.06 1.06L8.06 7l4.72 4.72a.75.75 0 11-1.06 1.06L7 8.06l-4.72 4.72a.75.75 0 01-1.06-1.06L5.94 7 1.22 2.28a.75.75 0 010-1.06z"
                />
              </svg>
            </button>
          )}
          {!query && (
            <span className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] leading-none text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-500">
              <span>⌘</span>
              <span>K</span>
            </span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full xl:w-[430px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden z-[99999]">
          {!hasResults && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363Z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No results for "{query}"</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
            </div>
          )}

          {hasResults && (
            <div className="py-2 max-h-[420px] overflow-y-auto">
              {Array.from(grouped.entries()).map(([entityType, results]) => {
                const cfg = ENTITY_CONFIG[entityType];
                return (
                  <div key={entityType} className="mb-1">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <span className={`flex items-center justify-center w-5 h-5 rounded ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {cfg.label}s
                      </span>
                    </div>
                    {results.map((r) => (
                      <ResultRow key={r.id} result={r} onSelect={closeDropdown} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer — view all */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={closeDropdown}
              className="flex items-center justify-between w-full text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              <span>View all results for "{query}"</span>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
