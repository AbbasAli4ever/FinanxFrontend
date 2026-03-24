"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import documentService from "@/services/documentService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isPermissionDeniedError, getPermissionDeniedMessage } from "@/services/apiClient";
import type { Attachment, AttachmentEntityType, UploadAttachmentParams } from "@/types/documents";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/types/documents";

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

const FILE_ICON_CONFIG: Record<FileIconType, { bg: string; text: string; label: string }> = {
  pdf: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", label: "PDF" },
  image: { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", label: "IMG" },
  spreadsheet: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", label: "XLS" },
  word: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", label: "DOC" },
  file: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", label: "FILE" },
};

// ─── File Icon SVGs ───────────────────────────────────────────────────────────

function FileIcon({ type }: { type: FileIconType }) {
  const config = FILE_ICON_CONFIG[type];
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
    >
      <span className={`text-[9px] font-bold tracking-wider ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-all duration-150 cursor-pointer
        ${dragging
          ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/10"
          : "border-gray-300 bg-gray-50/60 hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-600"
        }
        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 dark:text-brand-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drop files here or <span className="text-brand-600 dark:text-brand-400">browse</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          PDF, JPEG, PNG, WEBP, XLSX, CSV, DOCX — max 10 MB each
        </p>
      </div>
    </div>
  );
}

// ─── Attachment Item ──────────────────────────────────────────────────────────

interface AttachmentItemProps {
  attachment: Attachment;
  onDownload: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function AttachmentItem({ attachment, onDownload, onPreview, onDelete, deleting }: AttachmentItemProps) {
  const iconType = getFileIconType(attachment.mimeType);
  const uploaderName =
    [attachment.uploadedBy.firstName, attachment.uploadedBy.lastName].filter(Boolean).join(" ") ||
    attachment.uploadedBy.email;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all duration-150 hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-gray-700">
      <FileIcon type={iconType} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {attachment.originalName}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(attachment.fileSize)}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span>{formatDate(attachment.createdAt)}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="truncate">{uploaderName}</span>
        </div>
        {attachment.description && (
          <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500 italic">
            {attachment.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {onPreview && (
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
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Upload Item (in-progress) ────────────────────────────────────────────────

interface UploadingItem {
  id: string;
  file: File;
  progress: number;
  error?: string;
  done?: boolean;
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  attachment: Attachment | null;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

function PreviewModal({ attachment, token, isOpen, onClose }: PreviewModalProps) {
  if (!attachment) return null;
  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";
  const url = `${documentService.getDownloadUrl(attachment.id)}?token=${token}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="mx-4 max-w-3xl w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <FileIcon type={getFileIconType(attachment.mimeType)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {attachment.originalName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(attachment.fileSize)} · {formatDate(attachment.createdAt)}
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
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900/50" style={{ minHeight: 400 }}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={attachment.originalName} className="max-h-[70vh] max-w-full object-contain rounded" />
          ) : isPdf ? (
            <iframe src={url} className="h-[70vh] w-full rounded" title={attachment.originalName} />
          ) : (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <FileIcon type={getFileIconType(attachment.mimeType)} />
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

// ─── Main AttachmentsPanel ────────────────────────────────────────────────────

export interface AttachmentsPanelProps {
  entityType: AttachmentEntityType;
  entityId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  compact?: boolean; // compact mode hides drop zone, shows inline
}

const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({
  entityType,
  entityId,
  canUpload = true,
  canDelete = true,
  compact = false,
}) => {
  const { token } = useAuth();
  const previewModal = useModal();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [description, setDescription] = useState("");
  const [showDescInput, setShowDescInput] = useState(false);
  const pendingFilesRef = useRef<File[]>([]);

  const fetchAttachments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await documentService.listAttachments({ entityType, entityId }, token);
      setAttachments(res.data);
    } catch (err) {
      if (isPermissionDeniedError(err)) setError(getPermissionDeniedMessage(err));
      else setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, entityType, entityId]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      if (!ALLOWED_MIME_TYPES.includes(f.type as typeof ALLOWED_MIME_TYPES[number])) {
        setError(`File type "${f.type}" is not allowed.`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${f.name}" exceeds the 10 MB limit.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    setError(null);
    pendingFilesRef.current = valid;
    if (valid.length > 0) {
      setShowDescInput(true);
    }
  };

  const startUpload = async () => {
    const files = pendingFilesRef.current;
    if (!files.length || !token) return;
    setShowDescInput(false);

    const items: UploadingItem[] = files.map((f) => ({
      id: `${f.name}-${Date.now()}`,
      file: f,
      progress: 0,
    }));
    setUploading((prev) => [...prev, ...items]);

    await Promise.all(
      items.map(async (item) => {
        const params: UploadAttachmentParams = {
          file: item.file,
          entityType,
          entityId,
          description: description || undefined,
        };
        try {
          await documentService.uploadAttachment(params, token, (pct) => {
            setUploading((prev) =>
              prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
            );
          });
          setUploading((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, progress: 100, done: true } : u))
          );
        } catch (err) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, error: formatApiErrorMessage(err) } : u
            )
          );
        }
      })
    );

    setDescription("");
    pendingFilesRef.current = [];
    // Remove done items after delay, refresh list
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => !u.done));
      fetchAttachments();
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await documentService.deleteAttachment(id, token);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (att: Attachment) => {
    setPreviewAttachment(att);
    previewModal.openModal();
  };

  const isPreviewable = (mimeType: string) =>
    mimeType.startsWith("image/") || mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Attachments
            {!loading && (
              <span className="ml-1.5 text-xs font-normal text-gray-400">({attachments.length})</span>
            )}
          </h4>
        </div>
        {canUpload && compact && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Attach
            <input
              type="file"
              multiple
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) handleFiles(files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/50 dark:bg-red-900/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-500">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Zone */}
      {canUpload && !compact && (
        <UploadZone onFiles={handleFiles} disabled={showDescInput} />
      )}

      {/* Description input before uploading */}
      {showDescInput && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800/50 dark:bg-brand-900/10">
          <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            {pendingFilesRef.current.length} file{pendingFilesRef.current.length > 1 ? "s" : ""} ready — add an optional description
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              maxLength={500}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />
            <button
              onClick={startUpload}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Upload
            </button>
            <button
              onClick={() => { setShowDescInput(false); pendingFilesRef.current = []; }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uploading progress items */}
      {uploading.map((u) => (
        <div key={u.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <FileIcon type={getFileIconType(u.file.type)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{u.file.name}</p>
              {u.error ? (
                <p className="text-xs text-red-500">{u.error}</p>
              ) : u.done ? (
                <p className="text-xs text-green-500">Uploaded</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{u.progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Attachment list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-gray-800">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500">No attachments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <AttachmentItem
              key={att.id}
              attachment={att}
              onDownload={() => token && documentService.downloadAttachment(att.id, att.originalName, token)}
              onPreview={isPreviewable(att.mimeType) ? () => handlePreview(att) : undefined}
              onDelete={canDelete ? () => handleDelete(att.id) : undefined}
              deleting={deletingId === att.id}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal
          attachment={previewAttachment}
          token={token ?? ""}
          isOpen={previewModal.isOpen}
          onClose={previewModal.closeModal}
        />
      )}
    </div>
  );
};

export default AttachmentsPanel;
