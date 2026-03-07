"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import auditService from "@/services/auditService";
import type { AuditEntityType, EntityAuditLogItem, AuditAction } from "@/types/audit";
import AuditActionBadge, { ACTION_META } from "./AuditActionBadge";

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

// ── Metadata display ────────────────────────────────────────────
const MetadataDisplay: React.FC<{ action: AuditAction | string; metadata: Record<string, unknown> }> = ({
  action,
  metadata,
}) => {
  const entries = Object.entries(metadata).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;

  // Highlighted keys per action
  const highlightMap: Record<string, string[]> = {
    VOID:      ["reason"],
    PAY:       ["amount", "paymentMethod"],
    ADJUST:    ["previousQuantity", "adjustmentQuantity", "newQuantity", "reason"],
    IMPORT:    ["importedCount"],
    APPLY:     ["totalApplied"],
    RECONCILE: ["matchedCount", "difference"],
  };
  const highlights = highlightMap[action] ?? [];

  return (
    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/40">
      {highlights.length > 0 &&
        highlights.map((k) => {
          if (!(k in metadata)) return null;
          const v = metadata[k];
          return (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="capitalize text-gray-500 dark:text-gray-400">{k.replace(/([A-Z])/g, " $1").trim()}:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{String(v)}</span>
            </div>
          );
        })}
      <details className="mt-1">
        <summary className="cursor-pointer text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          All details
        </summary>
        <div className="mt-1 space-y-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[11px]">
              <span className="min-w-[90px] text-gray-400 dark:text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}:</span>
              <span className="text-gray-700 dark:text-gray-300 break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

// ── Changes (diff) display ──────────────────────────────────────
const ChangesDisplay: React.FC<{ changes: Record<string, { from: unknown; to: unknown }> }> = ({
  changes,
}) => {
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 dark:border-blue-900/30 dark:bg-blue-900/10">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        Changes
      </p>
      <div className="space-y-0.5">
        {entries.map(([field, { from, to }]) => (
          <div key={field} className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="capitalize text-gray-500 dark:text-gray-400">{field.replace(/([A-Z])/g, " $1").trim()}:</span>
            <span className="rounded bg-error-100 px-1 text-error-700 dark:bg-error-900/30 dark:text-error-400 line-through">
              {from !== null && from !== undefined ? String(from) : "—"}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="rounded bg-success-100 px-1 text-success-700 dark:bg-success-900/30 dark:text-success-400">
              {to !== null && to !== undefined ? String(to) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Skeleton ────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 py-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="mt-1 h-12 w-0.5 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="flex-1 space-y-2 pb-4">
          <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

// ── Main component ──────────────────────────────────────────────
interface EntityHistoryPanelProps {
  entityType: AuditEntityType;
  entityId: string;
}

const EntityHistoryPanel: React.FC<EntityHistoryPanelProps> = ({
  entityType,
  entityId,
}) => {
  const { token } = useAuth();
  const [items, setItems] = useState<EntityAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await auditService.getEntityHistory(entityType, entityId, token);
      setItems(data);
    } catch {
      setError("Failed to load activity history.");
    } finally {
      setLoading(false);
    }
  }, [token, entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {items.map((item, idx) => {
        const { date, time } = formatDateTime(item.performedAt);
        const meta = ACTION_META[item.action];
        const isLast = idx === items.length - 1;

        return (
          <div key={item.id ?? idx} className="relative flex gap-3 pb-5">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-3.5 top-7 h-full w-px bg-gray-200 dark:bg-gray-700" />
            )}

            {/* Dot */}
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
              <span className={`h-3 w-3 rounded-full ${meta?.dot ?? "bg-gray-400"}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <AuditActionBadge action={item.action} size="sm" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {date} · {time}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  by {item.user.name}
                </span>
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              )}
              {item.changes && Object.keys(item.changes).length > 0 && (
                <ChangesDisplay changes={item.changes} />
              )}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <MetadataDisplay action={item.action} metadata={item.metadata} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EntityHistoryPanel;
