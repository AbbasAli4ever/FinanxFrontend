"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import dataIOService from "@/services/dataIOService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { ImportJobListItem } from "@/types/dataIO";

interface DeleteImportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ImportJobListItem | null;
  token: string;
  onDeleted: () => void;
}

function entityLabel(type: string): string {
  return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const DeleteImportJobModal: React.FC<DeleteImportJobModalProps> = ({
  isOpen,
  onClose,
  job,
  token,
  onDeleted,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  const handleDelete = async () => {
    if (!job || !token) return;
    setDeleting(true);
    setError("");
    try {
      await dataIOService.deleteImportJob(job.id, token);
      onDeleted();
      onClose();
    } catch (e) {
      setError(formatApiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="p-6">
        {/* Warning Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error-600 dark:text-error-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Delete Import Record
        </h2>
        <p className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to delete the import record for{" "}
          <strong className="text-gray-800 dark:text-white">{entityLabel(job.entityType)}</strong>{" "}
          (<span className="font-mono text-xs">{job.fileName}</span>)?
          <br />
          <span className="mt-1 block text-xs text-gray-400">This cannot be undone.</span>
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-error-700 disabled:opacity-50 dark:bg-error-700 dark:hover:bg-error-600"
          >
            {deleting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Deleting...
              </>
            ) : "Delete Record"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteImportJobModal;
