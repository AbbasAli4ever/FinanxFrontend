"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import documentService from "@/services/documentService";
import type {
  Attachment,
  AttachmentEntityType,
  StorageUsage,
  UploadAttachmentParams,
} from "@/types/documents";
import {
  ENTITY_TYPE_LABELS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/types/documents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type FileIconType = "pdf" | "image" | "spreadsheet" | "word" | "file";

function getFileIconType(mimeType: string): FileIconType {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "spreadsheet";
  if (mimeType.includes("word")) return "word";
  return "file";
}

const FILE_ICON_CONFIG: Record<
  FileIconType,
  { bg: string; text: string; label: string; iconBg: string }
> = {
  pdf: {
    bg: "bg-red-50 dark:bg-red-900/10",
    text: "text-red-600 dark:text-red-400",
    label: "PDF",
    iconBg: "bg-red-100 dark:bg-red-900/30",
  },
  image: {
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    label: "IMG",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  spreadsheet: {
    bg: "bg-green-50 dark:bg-green-900/10",
    text: "text-green-600 dark:text-green-400",
    label: "XLS",
    iconBg: "bg-green-100 dark:bg-green-900/30",
  },
  word: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    label: "DOC",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  file: {
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    label: "FILE",
    iconBg: "bg-gray-100 dark:bg-gray-800",
  },
};

function FileIconBadge({
  type,
  size = "md",
}: {
  type: FileIconType;
  size?: "sm" | "md" | "lg";
}) {
  const c = FILE_ICON_CONFIG[type];
  const dim =
    size === "sm"
      ? "h-8 w-8 text-[8px]"
      : size === "lg"
      ? "h-14 w-14 text-[11px]"
      : "h-10 w-10 text-[9px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg ${c.iconBg} ${dim}`}
    >
      <span className={`font-bold tracking-wider ${c.text}`}>{c.label}</span>
    </div>
  );
}

// ─── Storage Usage Bar ────────────────────────────────────────────────────────

function StorageBar({ usage }: { usage: StorageUsage }) {
  const pct = Math.min(usage.usedPercentage, 100);
  const barColor =
    pct >= 90
      ? "bg-red-500"
      : pct >= 75
      ? "bg-warning-500"
      : "bg-brand-500";
  const textColor =
    pct >= 90
      ? "text-red-600 dark:text-red-400"
      : pct >= 75
      ? "text-warning-600 dark:text-warning-400"
      : "text-brand-600 dark:text-brand-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Storage Usage
          </p>
          <p className={`mt-1 text-2xl font-bold ${textColor}`}>
            {pct.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(usage.usedBytes)} of {formatFileSize(usage.quotaBytes)} used
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Files</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {usage.fileCount.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(usage.remainingBytes)} remaining
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 75 && (
        <p className={`mt-2 text-xs ${textColor}`}>
          {pct >= 90
            ? "Storage almost full — consider deleting old files."
            : "Approaching storage limit."}
        </p>
      )}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onUploaded: () => void;
}

const ALL_ENTITY_TYPES = Object.keys(ENTITY_TYPE_LABELS) as AttachmentEntityType[];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(val: string): boolean {
  return UUID_REGEX.test(val.trim());
}

function UploadModal({ isOpen, onClose, token, onUploaded }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [entityType, setEntityType] = useState<AttachmentEntityType | "">("");
  const [entityId, setEntityId] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ entityType?: string; entityId?: string }>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFiles([]);
    setEntityType("");
    setEntityId("");
    setDescription("");
    setProgress(0);
    setError(null);
    setFieldErrors({});
    setUploading(false);
  };

  const handleClose = () => {
    if (!uploading) { reset(); onClose(); }
  };

  const validateFiles = (fs: File[]) => {
    for (const f of fs) {
      if (!ALLOWED_MIME_TYPES.includes(f.type as typeof ALLOWED_MIME_TYPES[number])) {
        return `File type "${f.type}" is not allowed.`;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        return `"${f.name}" exceeds the 10 MB limit.`;
      }
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const err = validateFiles(dropped);
    if (err) { setError(err); return; }
    setError(null);
    setFiles(dropped);
  };

  const validate = (): boolean => {
    const errs: { entityType?: string; entityId?: string } = {};
    if (!entityType) {
      errs.entityType = "Please select an entity type.";
    }
    if (!entityId.trim()) {
      errs.entityId = "Entity ID is required.";
    } else if (!isValidUUID(entityId)) {
      errs.entityId = "Must be a valid UUID (e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) { setError("Please select at least one file."); return; }
    if (!validate()) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const params: UploadAttachmentParams = {
          file,
          entityType: entityType as AttachmentEntityType,
          entityId: entityId.trim(),
          description: description || undefined,
        };
        await documentService.uploadAttachment(params, token, setProgress);
      }
      onUploaded();
      reset();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
      setUploading(false);
    }
  };

  const selectClasses =
    "h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const inputClasses =
    "h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="mx-4 max-w-lg w-full">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 dark:text-brand-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Upload Files</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Attach files to any entity in FinanX</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 cursor-pointer transition-all duration-150
              ${dragging
                ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/10"
                : "border-gray-300 bg-gray-50/60 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800/30"
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                const err = validateFiles(fs);
                if (err) { setError(err); return; }
                setError(null);
                setFiles(fs);
                e.target.value = "";
              }}
            />
            {files.length > 0 ? (
              <div className="w-full space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-800">
                    <FileIconBadge type={getFileIconType(f.type)} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{f.name}</span>
                    <span className="text-xs text-gray-400">{formatFileSize(f.size)}</span>
                  </div>
                ))}
                <p className="pt-1 text-center text-xs text-gray-400">Click to change selection</p>
              </div>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 dark:text-brand-400">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop files or <span className="text-brand-600 dark:text-brand-400">browse</span>
                </p>
                <p className="text-xs text-gray-400">PDF, JPEG, PNG, WEBP, XLSX, CSV, DOCX · max 10 MB</p>
              </>
            )}
          </div>

          {/* Entity Type + ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as AttachmentEntityType);
                  setFieldErrors((prev) => ({ ...prev, entityType: undefined }));
                }}
                className={`${selectClasses} ${fieldErrors.entityType ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""}`}
              >
                <option value="">Select type…</option>
                {ALL_ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>
                ))}
              </select>
              {fieldErrors.entityType && (
                <p className="mt-1 text-[11px] text-red-500">{fieldErrors.entityType}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Entity ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={entityId}
                onChange={(e) => {
                  setEntityId(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, entityId: undefined }));
                }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={`${inputClasses} ${fieldErrors.entityId ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""}`}
              />
              {fieldErrors.entityId && (
                <p className="mt-1 text-[11px] text-red-500">{fieldErrors.entityId}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the file…"
              maxLength={500}
              className={inputClasses}
            />
          </div>

          {/* Upload progress */}
          {uploading && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/10 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !files.length || !entityType || !entityId.trim() || !isValidUUID(entityId)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {uploading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length : ""} File${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  attachment,
  token,
  isOpen,
  onClose,
}: {
  attachment: Attachment | null;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!attachment) return null;
  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";
  const url = documentService.getDownloadUrl(attachment.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="mx-4 max-w-4xl w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <FileIconBadge type={getFileIconType(attachment.mimeType)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {attachment.originalName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(attachment.fileSize)} · {ENTITY_TYPE_LABELS[attachment.entityType]} · {formatDate(attachment.createdAt)}
            </p>
          </div>
          <button
            onClick={() => documentService.downloadAttachment(attachment.id, attachment.originalName, token)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
        <div className="flex min-h-[400px] items-center justify-center bg-gray-50 dark:bg-gray-900/50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={attachment.originalName} className="max-h-[70vh] max-w-full object-contain" />
          ) : isPdf ? (
            <iframe src={url} className="h-[70vh] w-full" title={attachment.originalName} />
          ) : (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <FileIconBadge type={getFileIconType(attachment.mimeType)} size="lg" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Preview not available for this file type.</p>
              <button
                onClick={() => documentService.downloadAttachment(attachment.id, attachment.originalName, token)}
                className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  attachment,
  isOpen,
  onClose,
  onConfirm,
  deleting,
}: {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  if (!attachment) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="mx-4 max-w-sm w-full">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Attachment</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">{attachment.originalName}</span>?
          This cannot be undone.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Attachment Row ───────────────────────────────────────────────────────────

function AttachmentRow({
  attachment,
  onPreview,
  onDownload,
  onDelete,
}: {
  attachment: Attachment;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const iconType = getFileIconType(attachment.mimeType);
  const uploaderName =
    [attachment.uploadedBy.firstName, attachment.uploadedBy.lastName]
      .filter(Boolean)
      .join(" ") || attachment.uploadedBy.email;
  const isPreviewable =
    attachment.mimeType.startsWith("image/") ||
    attachment.mimeType === "application/pdf";

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all duration-150 hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-gray-700">
      <FileIconBadge type={iconType} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {attachment.originalName}
          </p>
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {ENTITY_TYPE_LABELS[attachment.entityType]}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
          <span>{formatFileSize(attachment.fileSize)}</span>
          <span>·</span>
          <span>{formatDate(attachment.createdAt)}</span>
          <span>·</span>
          <span>by {uploaderName}</span>
          {attachment.description && (
            <>
              <span>·</span>
              <span className="italic">{attachment.description}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {isPreviewable && (
          <button
            onClick={onPreview}
            title="Preview"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}
        <button
          onClick={onDownload}
          title="Download"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DocumentsPage: React.FC = () => {
  const { token, isAuthenticated, isReady } = useAuth();
  const uploadModal = useModal();
  const previewModal = useModal();
  const deleteModal = useModal();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "error" | "warning"; text: string } | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lookup inputs — both required by backend
  const [lookupEntityType, setLookupEntityType] = useState<AttachmentEntityType | "">("");
  const [lookupEntityId, setLookupEntityId] = useState("");
  const [lookupIdError, setLookupIdError] = useState<string | null>(null);

  // Active query (committed on search)
  const [activeEntityType, setActiveEntityType] = useState<AttachmentEntityType | null>(null);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // Client-side name filter
  const [nameFilter, setNameFilter] = useState("");

  const fetchAttachments = useCallback(async (entityType: AttachmentEntityType, entityId: string, pg: number) => {
    if (!token) return;
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await documentService.listAttachments({ entityType, entityId, page: pg, limit: LIMIT }, token);
      setAttachments(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setHasFetched(true);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setAlertMsg({ type: "warning", text: getPermissionDeniedMessage(err) });
      } else {
        setAlertMsg({ type: "error", text: formatApiErrorMessage(err) });
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStorage = useCallback(async () => {
    if (!token) return;
    setStorageLoading(true);
    try {
      const data = await documentService.getStorageUsage(token);
      setStorageUsage(data);
    } catch {
      // non-critical
    } finally {
      setStorageLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStorage(); }, [fetchStorage]);

  // Re-fetch when page changes (only if a query is active)
  useEffect(() => {
    if (activeEntityType && activeEntityId) {
      fetchAttachments(activeEntityType, activeEntityId, page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEntityType) return;
    if (!lookupEntityId.trim()) {
      setLookupIdError("Entity ID is required.");
      return;
    }
    if (!isValidUUID(lookupEntityId)) {
      setLookupIdError("Must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
      return;
    }
    setLookupIdError(null);
    setActiveEntityType(lookupEntityType);
    setActiveEntityId(lookupEntityId.trim());
    setPage(1);
    setHasFetched(false);
    setNameFilter("");
    fetchAttachments(lookupEntityType, lookupEntityId.trim(), 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await documentService.deleteAttachment(deleteTarget.id, token);
      setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setTotal((p) => p - 1);
      deleteModal.closeModal();
      setDeleteTarget(null);
      fetchStorage();
    } catch (err) {
      setAlertMsg({ type: "error", text: formatApiErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  const displayed = nameFilter
    ? attachments.filter((a) =>
        a.originalName.toLowerCase().includes(nameFilter.toLowerCase()) ||
        (a.description ?? "").toLowerCase().includes(nameFilter.toLowerCase())
      )
    : attachments;

  const selectClasses =
    "h-9 appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";
  const inputClasses =
    "h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500";

  if (!isReady) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Checking authentication…
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="font-semibold text-gray-900 dark:text-white">Not authenticated</p>
        <p className="mt-1 text-sm text-gray-500">Sign in to access documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">File Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload and view files attached to invoices, employees, projects, and more
          </p>
        </div>
        <button
          onClick={uploadModal.openModal}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Files
        </button>
      </header>

      {/* Storage Usage */}
      {storageLoading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : storageUsage ? (
        <StorageBar usage={storageUsage} />
      ) : null}

      {/* Storage stats */}
      {storageUsage && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Files Stored", value: storageUsage.fileCount.toLocaleString() },
            { label: "Entity Types", value: Object.keys(ENTITY_TYPE_LABELS).length.toString() },
            { label: "Storage Used", value: formatFileSize(storageUsage.usedBytes) },
            { label: "Remaining", value: formatFileSize(storageUsage.remainingBytes) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lookup form — required because API needs entityType + entityId */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Look up attachments
        </p>
        <form onSubmit={handleLookup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Entity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={lookupEntityType}
              onChange={(e) => setLookupEntityType(e.target.value as AttachmentEntityType)}
              className={`w-full ${selectClasses}`}
              required
            >
              <option value="">Select entity type…</option>
              {ALL_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Entity ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lookupEntityId}
              onChange={(e) => { setLookupEntityId(e.target.value); setLookupIdError(null); }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={`w-full ${inputClasses} ${lookupIdError ? "border-red-400" : ""}`}
            />
            {lookupIdError && (
              <p className="mt-1 text-[11px] text-red-500">{lookupIdError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!lookupEntityType || !lookupEntityId.trim() || loading}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            Search
          </button>
        </form>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
          alertMsg.type === "error"
            ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10"
            : "border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-900/10"
        }`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mt-0.5 shrink-0 ${alertMsg.type === "error" ? "text-red-500" : "text-yellow-600"}`}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className={`flex-1 text-sm ${alertMsg.type === "error" ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg(null)} className="text-gray-400 hover:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Results */}
      {!hasFetched && !loading ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an entity type and enter its ID above to view attachments
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Result header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {activeEntityType && (
                <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  {ENTITY_TYPE_LABELS[activeEntityType]}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {total} file{total !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filter by name…"
                className="h-8 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
          </div>

          {displayed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No attachments found</p>
              <p className="text-xs text-gray-400">
                {nameFilter ? "Try clearing the name filter" : "This entity has no files attached yet"}
              </p>
              <button
                onClick={uploadModal.openModal}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Upload a file
              </button>
            </div>
          ) : (
            <>
              {displayed.map((att) => (
                <AttachmentRow
                  key={att.id}
                  attachment={att}
                  onPreview={() => { setSelectedAttachment(att); previewModal.openModal(); }}
                  onDownload={() => documentService.downloadAttachment(att.id, att.originalName, token)}
                  onDelete={() => { setDeleteTarget(att); deleteModal.openModal(); }}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} total</p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = page <= 3 ? i + 1 : page - 2 + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                            p === page
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.closeModal}
        token={token}
        onUploaded={() => {
          fetchStorage();
          if (activeEntityType && activeEntityId) fetchAttachments(activeEntityType, activeEntityId, page);
        }}
      />
      <PreviewModal
        attachment={selectedAttachment}
        token={token}
        isOpen={previewModal.isOpen}
        onClose={previewModal.closeModal}
      />
      <DeleteConfirmModal
        attachment={deleteTarget}
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.closeModal(); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
};

export default DocumentsPage;
