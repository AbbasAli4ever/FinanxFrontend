"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Alert from "@/components/ui/alert/Alert";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { CompanySelectionItem } from "@/types/auth";
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from "react-icons/hi";

type AlertState = { variant: "success" | "error"; title: string; message: string };

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never logged in";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SelectCompanyForm() {
  const router = useRouter();
  const { pendingCompanySelection, selectCompany, logout, isReady } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSelect = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    if (!pendingCompanySelection && !didSelect.current) {
      router.replace("/signin");
    }
  }, [pendingCompanySelection, isReady, router]);

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-[480px]">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
              <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
              <p className="text-[13px] text-gray-500 dark:text-gray-400">Loading your workspaces...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companies: CompanySelectionItem[] = pendingCompanySelection?.companies ?? [];

  const handleSelect = async (companyId: string) => {
    if (isSelecting) return;
    setSelectedId(companyId);
    setAlert(null);
    setIsSelecting(true);
    try {
      await selectCompany(companyId);
      didSelect.current = true;
      setAlert({ variant: "success", title: "Entering workspace…", message: "Redirecting to your dashboard." });
      redirectTimer.current = setTimeout(() => router.replace("/"), 600);
    } catch (error) {
      setAlert({ variant: "error", title: "Selection failed", message: formatApiErrorMessage(error) });
      setSelectedId(null);
      setIsSelecting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
            <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
            Choose a workspace
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Select a company to continue
          </p>
          {companies.length > 0 && !alert && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700 rounded-full px-3 py-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 inline-block" />
              {companies.length} {companies.length === 1 ? "company" : "companies"} available
            </div>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">
          {alert && (
            <div className="mb-5" role="status" aria-live="polite">
              <Alert variant={alert.variant} title={alert.title} message={alert.message} />
            </div>
          )}

          {/* Company list */}
          <div className="space-y-2.5">
            {companies.map((company) => {
              const isActive = selectedId === company.companyId;
              const isSpinning = isActive && isSelecting;

              return (
                <button
                  key={company.companyId}
                  onClick={() => handleSelect(company.companyId)}
                  disabled={isSelecting}
                  className={`
                    group relative w-full text-left rounded-xl border px-4 py-3.5
                    transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                    ${isActive
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-500 shadow-sm"
                      : "border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-800/40 hover:border-brand-300 dark:hover:border-brand-700/70 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 hover:shadow-sm"
                    }
                    ${isSelecting && !isActive ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <span className={`
                      shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-[13px] font-bold
                      transition-colors duration-200
                      ${isActive
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300"
                      }
                    `}>
                      {company.companyName.slice(0, 2).toUpperCase()}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[14px] font-semibold leading-snug truncate ${isActive ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-gray-200"}`}>
                          {company.companyName}
                        </span>
                        {company.isPrimaryAdmin && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 uppercase tracking-wider shrink-0">
                            <HiOutlineShieldCheck className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {company.role && (
                          <span className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{company.role.name}</span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                          <HiOutlineClock className="w-3 h-3" />
                          {formatLastLogin(company.lastLoginAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right indicator */}
                    <div className="shrink-0">
                      {isSpinning ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      ) : isActive ? (
                        <HiOutlineCheckCircle className="w-5 h-5 text-brand-500" />
                      ) : (
                        <HiOutlineArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors duration-150" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign out + session note */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={logout}
            className="text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
          >
            Sign out
          </button>
          <p className="text-[11px] text-gray-400 dark:text-gray-600">
            Session expires in 5 min.{" "}
            <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors">
              Sign in again
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
