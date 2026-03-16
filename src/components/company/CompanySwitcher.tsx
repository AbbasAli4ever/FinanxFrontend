"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { getMyCompanies } from "@/services/authService";
import { formatApiErrorMessage } from "@/utils/apiError";
import CreateCompanyModal from "@/components/company/CreateCompanyModal";
import type { MyCompanyItem } from "@/types/auth";
import {
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlinePlusSm,
  HiOutlineShieldCheck,
  HiOutlineSwitchHorizontal,
} from "react-icons/hi";

interface CompanySwitcherProps {
  /** "sidebar" = icon + compact label, "header" = full name pill */
  variant?: "sidebar" | "header";
}

export default function CompanySwitcher({ variant = "sidebar" }: CompanySwitcherProps) {
  const { token, user, switchCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreateCompany = hasPermission("company:create");
  const [companies, setCompanies] = useState<MyCompanyItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = companies.find((c) => c.isCurrentCompany);
  const others = companies.filter((c) => !c.isCurrentCompany);

  const fetchCompanies = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await getMyCompanies(token);
      setCompanies(res.data);
    } catch {
      // Silent fail — company list is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen, companies.length, fetchCompanies]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSwitchError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleSwitch = async (companyId: string) => {
    if (!token || isSwitching) return;
    setSwitchError(null);
    setIsSwitching(companyId);
    try {
      await switchCompany(companyId);
      setIsSwitching(null);
      setIsOpen(false);
      setCompanies([]);  // force re-fetch next time dropdown opens
    } catch (err) {
      setSwitchError(formatApiErrorMessage(err));
      setIsSwitching(null);
    }
  };

  // Fallback display name
  const displayName =
    current?.companyName ?? user?.company?.name ?? "Company";
  const initials = displayName.slice(0, 2).toUpperCase();

  const trigger =
    variant === "sidebar" ? (
      <button
        onClick={() => setIsOpen((p) => !p)}
        title={displayName}
        className="flex flex-col items-center gap-1 py-2.5 px-1 w-full transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 group"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 transition-colors duration-150 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/40">
          {initials}
        </span>
        <span className="text-[9px] font-semibold leading-none tracking-wider text-gray-400 uppercase group-hover:text-gray-500 truncate max-w-full px-0.5 transition-colors duration-150 dark:text-gray-500 dark:group-hover:text-gray-400">
          {displayName.length > 7 ? displayName.slice(0, 6) + "…" : displayName}
        </span>
      </button>
    ) : (
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700 dark:hover:bg-brand-900/10 transition-all duration-150"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 flex-shrink-0">
          {initials}
        </span>
        <span className="truncate max-w-[120px]">{displayName}</span>
        <svg
          className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 12 12"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );

  return (
    <>
      <div ref={dropdownRef} className="relative w-full">
        {trigger}

        {isOpen && (
          <div
            className={`
              absolute z-[9999] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-xl shadow-theme-lg overflow-hidden
              ${variant === "sidebar"
                ? "left-full bottom-0 ml-2 w-[240px]"
                : "right-0 top-full mt-1.5 w-[260px]"
              }
            `}
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/60">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Your Companies
              </p>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="w-5 h-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[280px] py-1.5">
                {/* Current company */}
                {current && (
                  <div className="px-2 mb-0.5">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30">
                      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-500 text-[10px] font-bold text-white flex-shrink-0">
                        {current.companyName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-brand-700 dark:text-brand-300 truncate leading-tight">
                          {current.companyName}
                        </p>
                        {current.role && (
                          <p className="text-[10px] text-brand-500 dark:text-brand-400 truncate">{current.role.name}</p>
                        )}
                      </div>
                      <HiOutlineCheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    </div>
                  </div>
                )}

                {/* Other companies */}
                {others.length > 0 && (
                  <div className="px-2 mt-1">
                    {others.length > 0 && current && (
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1">
                        Switch to
                      </p>
                    )}
                    {others.map((company) => {
                      const loading = isSwitching === company.companyId;
                      return (
                        <button
                          key={company.companyId}
                          onClick={() => handleSwitch(company.companyId)}
                          disabled={!!isSwitching}
                          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-100 group disabled:opacity-50"
                        >
                          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300 transition-colors">
                            {company.companyName.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {company.companyName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {company.role && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{company.role.name}</span>
                              )}
                              {company.isPrimaryAdmin && (
                                <span className="flex items-center gap-0.5 text-[9px] text-brand-500 dark:text-brand-400">
                                  <HiOutlineShieldCheck className="w-2.5 h-2.5" />
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                          {loading ? (
                            <svg className="w-4 h-4 animate-spin text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && companies.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <HiOutlineOfficeBuilding className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-[12px] text-gray-400 dark:text-gray-500">No companies found</p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {switchError && (
              <div className="mx-2 mb-2 px-3 py-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg">
                <p className="text-[11px] text-error-600 dark:text-error-400">{switchError}</p>
              </div>
            )}

            {/* Footer — only shown to users with company:create permission */}
            {canCreateCompany && (
              <div className="border-t border-gray-100 dark:border-gray-700/60 p-1.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCreateOpen(true);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors duration-100"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 shrink-0">
                    <HiOutlinePlusSm className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </span>
                  Create New Company
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateCompanyModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
