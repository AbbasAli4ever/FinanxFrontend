"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import dataIOService from "@/services/dataIOService";
import type { SupportedEntity } from "@/types/dataIO";
import ImportWizard from "./ImportWizard";
import ExportPanel from "./ExportPanel";
import ImportHistoryTable from "./ImportHistoryTable";

type Tab = "import" | "export" | "history";

const DataIOPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading, hasPermission } = usePermissions();

  const [tab, setTab] = useState<Tab>("import");
  const [supportedEntities, setSupportedEntities] = useState<SupportedEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  const canImport = hasPermission("data:import");
  const canExport = hasPermission("data:export");
  const hasAccess = Boolean(token && isAuthenticated);

  const fetchEntities = useCallback(async () => {
    if (!token) return;
    setLoadingEntities(true);
    try {
      const data = await dataIOService.getSupportedEntities(token);
      setSupportedEntities(data);
    } catch {
      // Non-critical — child components handle gracefully
    } finally {
      setLoadingEntities(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    fetchEntities();
  }, [hasAccess, permissionsLoading, fetchEntities]);

  // Set default tab based on permissions
  useEffect(() => {
    if (permissionsLoading) return;
    if (!canImport && canExport) setTab("export");
  }, [permissionsLoading, canImport, canExport]);

  if (!isReady || permissionsLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span>Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-white/90">Waiting for authentication...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to access Data I/O.</p>
        </div>
      </div>
    );
  }

  if (!canImport && !canExport) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div className="rounded-2xl border border-error-200 bg-error-50 p-8 text-center dark:border-error-800 dark:bg-error-900/20">
          <p className="font-semibold text-error-700 dark:text-error-400">Access Denied</p>
          <p className="mt-1 text-sm text-error-600 dark:text-error-500">
            You don&apos;t have permission to import or export data.
          </p>
        </div>
      </div>
    );
  }

  const importableEntities = supportedEntities.filter((e) => e.importable);
  const exportableEntities = supportedEntities.filter((e) => e.exportable);

  const visibleTabs: { id: Tab; label: string }[] = [
    ...(canImport ? [{ id: "import" as Tab, label: "Import" }] : []),
    ...(canExport ? [{ id: "export" as Tab, label: "Export" }] : []),
    ...(canImport ? [{ id: "history" as Tab, label: "Import History" }] : []),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Data Management</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Data I/O</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Import and export your financial data using CSV files
        </p>
      </header>

      {/* Tab Bar */}
      <div className="flex w-fit gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/40">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "import" && canImport && (
        <ImportWizard
          importableEntities={loadingEntities ? [] : importableEntities}
          token={token!}
          onViewHistory={() => setTab("history")}
        />
      )}
      {tab === "export" && canExport && (
        <ExportPanel
          exportableEntities={loadingEntities ? [] : exportableEntities}
          token={token!}
        />
      )}
      {tab === "history" && canImport && (
        <ImportHistoryTable token={token!} />
      )}
    </div>
  );
};

export default DataIOPage;
