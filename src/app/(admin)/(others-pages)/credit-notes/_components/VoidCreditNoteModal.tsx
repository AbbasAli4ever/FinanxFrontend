"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import creditNotesService from "@/services/creditNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface VoidCreditNoteModalProps {
  isOpen: boolean;
  creditNoteId: string | null;
  creditNoteNumber: string;
  remainingCredit: number;
  onClose: () => void;
  onVoided: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const VoidCreditNoteModal: React.FC<VoidCreditNoteModalProps> = ({
  isOpen,
  creditNoteId,
  creditNoteNumber,
  remainingCredit,
  onClose,
  onVoided,
}) => {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVoid = async () => {
    if (!token || !creditNoteId) return;
    setLoading(true);
    setError("");
    try {
      await creditNotesService.voidCreditNote(creditNoteId, { reason: reason || undefined }, token);
      setReason("");
      onVoided();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
            <svg className="h-5 w-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Void Credit Note</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Void <span className="font-semibold text-gray-900 dark:text-white">{creditNoteNumber}</span>?
            </p>
          </div>
        </div>

        {remainingCredit > 0 && (
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm dark:border-warning-800 dark:bg-warning-900/10">
            <p className="font-medium text-warning-700 dark:text-warning-400">
              {formatCurrency(remainingCredit)} of remaining credit will be cancelled.
            </p>
            <p className="mt-0.5 text-warning-600 dark:text-warning-500">
              Only the unapplied portion will be reversed. Any already-applied amounts are not affected.
            </p>
          </div>
        )}

        <div>
          <Label>Reason (optional)</Label>
          <TextArea
            placeholder="Reason for voiding..."
            value={reason}
            onChange={setReason}
            rows={3}
          />
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1 bg-error-600 hover:bg-error-700" onClick={handleVoid} disabled={loading}>
            {loading ? "Voiding..." : "Void Credit Note"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoidCreditNoteModal;
