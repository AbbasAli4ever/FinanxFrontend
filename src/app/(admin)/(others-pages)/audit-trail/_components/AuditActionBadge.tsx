"use client";

import React from "react";
import type { AuditAction } from "@/types/audit";

interface ActionMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export const ACTION_META: Record<string, ActionMeta> = {
  CREATE:     { label: "Created",    color: "text-success-700 dark:text-success-300",  bg: "bg-success-50 dark:bg-success-900/20",  dot: "bg-success-500"  },
  UPDATE:     { label: "Updated",    color: "text-blue-700 dark:text-blue-300",        bg: "bg-blue-50 dark:bg-blue-900/20",        dot: "bg-blue-500"     },
  DELETE:     { label: "Deleted",    color: "text-error-700 dark:text-error-300",      bg: "bg-error-50 dark:bg-error-900/20",      dot: "bg-error-500"    },
  SEND:       { label: "Sent",       color: "text-purple-700 dark:text-purple-300",    bg: "bg-purple-50 dark:bg-purple-900/20",    dot: "bg-purple-500"   },
  VOID:       { label: "Voided",     color: "text-error-700 dark:text-error-300",      bg: "bg-error-50 dark:bg-error-900/20",      dot: "bg-error-500"    },
  PAY:        { label: "Paid",       color: "text-success-700 dark:text-success-300",  bg: "bg-success-50 dark:bg-success-900/20",  dot: "bg-success-500"  },
  APPROVE:    { label: "Approved",   color: "text-success-700 dark:text-success-300",  bg: "bg-success-50 dark:bg-success-900/20",  dot: "bg-success-500"  },
  REJECT:     { label: "Rejected",   color: "text-warning-700 dark:text-warning-300",  bg: "bg-warning-50 dark:bg-warning-900/20",  dot: "bg-warning-500"  },
  RECEIVE:    { label: "Received",   color: "text-teal-700 dark:text-teal-300",        bg: "bg-teal-50 dark:bg-teal-900/20",        dot: "bg-teal-500"     },
  FULFILL:    { label: "Fulfilled",  color: "text-teal-700 dark:text-teal-300",        bg: "bg-teal-50 dark:bg-teal-900/20",        dot: "bg-teal-500"     },
  CONVERT:    { label: "Converted",  color: "text-indigo-700 dark:text-indigo-300",    bg: "bg-indigo-50 dark:bg-indigo-900/20",    dot: "bg-indigo-500"   },
  CLOSE:      { label: "Closed",     color: "text-gray-700 dark:text-gray-300",        bg: "bg-gray-100 dark:bg-gray-800",          dot: "bg-gray-500"     },
  POST:       { label: "Posted",     color: "text-brand-700 dark:text-brand-300",      bg: "bg-brand-50 dark:bg-brand-900/20",      dot: "bg-brand-500"    },
  REVERSE:    { label: "Reversed",   color: "text-orange-700 dark:text-orange-300",    bg: "bg-orange-50 dark:bg-orange-900/20",    dot: "bg-orange-500"   },
  DUPLICATE:  { label: "Duplicated", color: "text-blue-700 dark:text-blue-300",        bg: "bg-blue-50 dark:bg-blue-900/20",        dot: "bg-blue-500"     },
  OPEN:       { label: "Opened",     color: "text-brand-700 dark:text-brand-300",      bg: "bg-brand-50 dark:bg-brand-900/20",      dot: "bg-brand-500"    },
  APPLY:      { label: "Applied",    color: "text-teal-700 dark:text-teal-300",        bg: "bg-teal-50 dark:bg-teal-900/20",        dot: "bg-teal-500"     },
  REFUND:     { label: "Refunded",   color: "text-purple-700 dark:text-purple-300",    bg: "bg-purple-50 dark:bg-purple-900/20",    dot: "bg-purple-500"   },
  ADJUST:     { label: "Adjusted",   color: "text-warning-700 dark:text-warning-300",  bg: "bg-warning-50 dark:bg-warning-900/20",  dot: "bg-warning-500"  },
  TRANSFER:   { label: "Transferred",color: "text-blue-700 dark:text-blue-300",        bg: "bg-blue-50 dark:bg-blue-900/20",        dot: "bg-blue-500"     },
  MATCH:      { label: "Matched",    color: "text-teal-700 dark:text-teal-300",        bg: "bg-teal-50 dark:bg-teal-900/20",        dot: "bg-teal-500"     },
  RECONCILE:  { label: "Reconciled", color: "text-teal-700 dark:text-teal-300",        bg: "bg-teal-50 dark:bg-teal-900/20",        dot: "bg-teal-500"     },
  PAUSE:      { label: "Paused",     color: "text-warning-700 dark:text-warning-300",  bg: "bg-warning-50 dark:bg-warning-900/20",  dot: "bg-warning-500"  },
  RESUME:     { label: "Resumed",    color: "text-success-700 dark:text-success-300",  bg: "bg-success-50 dark:bg-success-900/20",  dot: "bg-success-500"  },
  CONFIRM:    { label: "Confirmed",  color: "text-brand-700 dark:text-brand-300",      bg: "bg-brand-50 dark:bg-brand-900/20",      dot: "bg-brand-500"    },
  EXPIRE:     { label: "Expired",    color: "text-gray-700 dark:text-gray-300",        bg: "bg-gray-100 dark:bg-gray-800",          dot: "bg-gray-500"     },
  IMPORT:     { label: "Imported",   color: "text-indigo-700 dark:text-indigo-300",    bg: "bg-indigo-50 dark:bg-indigo-900/20",    dot: "bg-indigo-500"   },
  INVITE:     { label: "Invited",    color: "text-purple-700 dark:text-purple-300",    bg: "bg-purple-50 dark:bg-purple-900/20",    dot: "bg-purple-500"   },
  DEACTIVATE: { label: "Deactivated",color: "text-error-700 dark:text-error-300",      bg: "bg-error-50 dark:bg-error-900/20",      dot: "bg-error-500"    },
};

const DEFAULT_META: ActionMeta = {
  label: "Action",
  color: "text-gray-700 dark:text-gray-300",
  bg: "bg-gray-100 dark:bg-gray-800",
  dot: "bg-gray-500",
};

interface AuditActionBadgeProps {
  action: AuditAction | string;
  size?: "sm" | "md";
}

const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({
  action,
  size = "sm",
}) => {
  const meta = ACTION_META[action] ?? DEFAULT_META;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses} ${meta.bg} ${meta.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

export default AuditActionBadge;
