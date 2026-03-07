"use client";
import React from "react";
import type { ProjectStatus } from "@/types/projects";

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE:    { label: "Active",    color: "text-success-700 dark:text-success-300", bg: "bg-success-50 dark:bg-success-900/20", dot: "bg-success-500" },
  ON_HOLD:   { label: "On Hold",   color: "text-warning-700 dark:text-warning-300", bg: "bg-warning-50 dark:bg-warning-900/20", dot: "bg-warning-500" },
  COMPLETED: { label: "Completed", color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-900/20",       dot: "bg-blue-500"    },
  CANCELLED: { label: "Cancelled", color: "text-error-700 dark:text-error-300",     bg: "bg-error-50 dark:bg-error-900/20",     dot: "bg-error-500"   },
};

const ProjectStatusBadge: React.FC<{ status: ProjectStatus; size?: "sm" | "md" }> = ({ status, size = "sm" }) => {
  const m = STATUS_META[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" };
  const sz = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sz} ${m.bg} ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

export const BILLING_METHOD_LABELS: Record<string, string> = {
  FIXED_PRICE:       "Fixed Price",
  TIME_AND_MATERIALS: "Time & Materials",
  NON_BILLABLE:      "Non-Billable",
};

export default ProjectStatusBadge;
