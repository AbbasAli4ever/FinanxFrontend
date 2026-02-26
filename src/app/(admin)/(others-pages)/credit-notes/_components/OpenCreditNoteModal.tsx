"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import creditNotesService from "@/services/creditNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface OpenCreditNoteModalProps {
  isOpen: boolean;
  creditNoteId: string | null;
  creditNoteNumber: string;
  totalAmount: number;
  onClose: () => void;
  onOpened: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const OpenCreditNoteModal: React.FC<OpenCreditNoteModalProps> = ({
  isOpen,
  creditNoteId,
  creditNoteNumber,
  totalAmount,
  onClose,
  onOpened,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpen = async () => {
    if (!token || !creditNoteId) return;
    setLoading(true);
    setError("");
    try {
      await creditNotesService.openCreditNote(creditNoteId, token);
      onOpened();
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
            <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Credit Note</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Issue <span className="font-semibold text-gray-900 dark:text-white">{creditNoteNumber}</span> for{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">{formatCurrency(totalAmount)}</span>?
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/10 dark:text-brand-300">
          <p className="font-medium">This will:</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-brand-600 dark:text-brand-400">
            <li>Transition the credit note from Draft → Open</li>
            <li>Create an automatic journal entry (Debit Income, Credit AR)</li>
            <li>Make the credit available for applying to invoices or refunding</li>
          </ul>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleOpen} disabled={loading}>
            {loading ? "Issuing..." : "Issue Credit Note"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OpenCreditNoteModal;
