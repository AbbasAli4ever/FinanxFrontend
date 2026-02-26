"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface ConvertToInvoiceModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  totalAmount: number;
  onClose: () => void;
  onConverted: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const ConvertToInvoiceModal: React.FC<ConvertToInvoiceModalProps> = ({
  isOpen, estimateId, estimateNumber, totalAmount, onClose, onConverted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [convertedInvoiceNumber, setConvertedInvoiceNumber] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) { setError(""); setConvertedInvoiceNumber(null); }
  }, [isOpen]);

  const handleConvert = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      const result = await estimatesService.convertToInvoice(estimateId, token);
      setConvertedInvoiceNumber(result.convertedInvoice?.invoiceNumber ?? "Invoice");
      onConverted();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConvertedInvoiceNumber(null);
    onClose();
  };

  // Success state
  if (convertedInvoiceNumber) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <svg className="h-8 w-8 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estimate Converted!</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-success-600 dark:text-success-400">{convertedInvoiceNumber}</span> has been created as a draft invoice with all line items copied.
            </p>
          </div>
          <div className="w-full rounded-xl border border-success-200 bg-success-50/60 px-4 py-3 dark:border-success-800 dark:bg-success-900/10">
            <p className="text-sm text-success-700 dark:text-success-300">
              Go to <strong>Invoices</strong> to review and send the new invoice to the customer.
            </p>
          </div>
          <Button className="w-full" onClick={handleClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Convert to Invoice</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Convert <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span> into a draft invoice.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Invoice Amount</span>
            <span className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">What will be created:</p>
          <ul className="mt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-1.5"><span className="text-emerald-500">•</span> A new draft invoice with all line items copied</li>
            <li className="flex items-center gap-1.5"><span className="text-emerald-500">•</span> This estimate will be marked as Converted</li>
            <li className="flex items-center gap-1.5"><span className="text-emerald-500">•</span> You can edit the invoice before sending to the customer</li>
          </ul>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleConvert} disabled={loading}>
            {loading ? "Converting..." : "Convert to Invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConvertToInvoiceModal;
