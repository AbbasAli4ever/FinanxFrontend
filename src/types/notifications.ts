export type NotificationType =
  | "INVOICE_OVERDUE"
  | "BILL_OVERDUE"
  | "LOW_STOCK"
  | "RECURRING_UPCOMING"
  | "EXPENSE_PENDING_APPROVAL"
  | "PROJECT_DEADLINE"
  | "PAYMENT_RECEIVED"
  | "INVOICE_SENT"
  | "SYSTEM_ALERT"
  | "GENERAL";

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreference {
  notificationType: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface PaginatedNotifications {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface NotificationFilters {
  type?: NotificationType | "";
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "type";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ─── Display config ───────────────────────────────────────────────────────────

export interface NotificationTypeConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  INVOICE_OVERDUE: {
    label: "Overdue Invoice",
    color: "text-error-600 dark:text-error-400",
    bg: "bg-error-50 dark:bg-error-900/20",
    border: "border-error-200 dark:border-error-800",
    iconColor: "text-error-500",
  },
  BILL_OVERDUE: {
    label: "Overdue Bill",
    color: "text-error-600 dark:text-error-400",
    bg: "bg-error-50 dark:bg-error-900/20",
    border: "border-error-200 dark:border-error-800",
    iconColor: "text-error-500",
  },
  LOW_STOCK: {
    label: "Low Stock Alert",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-500",
  },
  RECURRING_UPCOMING: {
    label: "Recurring Due",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  EXPENSE_PENDING_APPROVAL: {
    label: "Expense Approval",
    color: "text-warning-600 dark:text-warning-400",
    bg: "bg-warning-50 dark:bg-warning-900/20",
    border: "border-warning-200 dark:border-warning-800",
    iconColor: "text-warning-500",
  },
  PROJECT_DEADLINE: {
    label: "Project Deadline",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-500",
  },
  PAYMENT_RECEIVED: {
    label: "Payment Received",
    color: "text-success-600 dark:text-success-400",
    bg: "bg-success-50 dark:bg-success-900/20",
    border: "border-success-200 dark:border-success-800",
    iconColor: "text-success-500",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  SYSTEM_ALERT: {
    label: "System Alert",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
    iconColor: "text-gray-500",
  },
  GENERAL: {
    label: "General",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
    iconColor: "text-gray-500",
  },
};

// ─── Entity → route mapping ───────────────────────────────────────────────────

export function getNotificationLink(notification: Notification): string | null {
  if (!notification.entityType || !notification.entityId) return null;
  const routes: Record<string, string> = {
    INVOICE: `/invoices/${notification.entityId}`,
    BILL: `/bills/${notification.entityId}`,
    PRODUCT: `/products/${notification.entityId}`,
    EXPENSE: `/expenses/${notification.entityId}`,
    PROJECT: `/projects/${notification.entityId}`,
  };
  return routes[notification.entityType] ?? null;
}

// ─── Time ago helper ──────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
