"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import debitNotesService from "@/services/debitNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteDebitNoteModalProps {
  isOpen: boolean;
  debitNoteId: string | null;
  debitNoteNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteDebitNoteModal: React.FC<DeleteDebitNoteModalProps> = ({
  isOpen, debitNoteId, debitNoteNumber, onClose, onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !debitNoteId) return;
    setLoading(true); setError("");
    try {
      await debitNotesService.deleteDebitNote(debitNoteId, token);
      onDeleted(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
          <svg className="h-7 w-7 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Debit Note</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Permanently delete <span className="font-semibold text-gray-900 dark:text-white">{debitNoteNumber}</span>? This action cannot be undone.
          </p>
        </div>
        {error && <Alert variant="error" title="Error" message={error} />}
        <div className="flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" className="flex-1 bg-error-600 hover:bg-error-700" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteDebitNoteModal;
