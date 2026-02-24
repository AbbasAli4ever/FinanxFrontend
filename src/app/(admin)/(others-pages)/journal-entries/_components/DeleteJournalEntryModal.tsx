"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import journalEntriesService from "@/services/journalEntriesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteJournalEntryModalProps {
  isOpen: boolean;
  entryId: string | null;
  entryNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteJournalEntryModal: React.FC<DeleteJournalEntryModalProps> = ({
  isOpen,
  entryId,
  entryNumber,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !entryId) return;
    setError("");
    setLoading(true);
    try {
      await journalEntriesService.deleteJournalEntry(entryId, token);
      onDeleted();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Delete Journal Entry
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Permanently delete entry{" "}
          <strong className="text-gray-900 dark:text-white">{entryNumber}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Only draft entries can be deleted. Posted entries should be voided instead.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
        <Button size="sm" onClick={handleDelete} disabled={loading} className="bg-error-500 hover:bg-error-600">
          {loading ? "Deleting..." : "Delete Entry"}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteJournalEntryModal;
