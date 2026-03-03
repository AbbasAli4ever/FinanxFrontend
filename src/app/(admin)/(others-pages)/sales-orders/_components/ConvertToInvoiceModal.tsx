"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import salesOrdersService from "@/services/salesOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface Props {
  isOpen: boolean;
  soId: string | null;
  soNumber: string;
  amount: number;
  onClose: () => void;
  onConverted: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const ConvertToInvoiceModal: React.FC<Props> = ({ isOpen, soId, soNumber, amount, onClose, onConverted }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [convertedInvoiceNumber, setConvertedInvoiceNumber] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!token || !soId) return;
    setLoading(true); setError("");
    try {
      const so = await salesOrdersService.convertToInvoice(soId, token);
      setConvertedInvoiceNumber(so.convertedInvoice?.invoiceNumber ?? "");
      onConverted();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setConvertedInvoiceNumber(null); setError(""); onClose(); };

  // Stage 2: success
  if (convertedInvoiceNumber) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Created!</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sales order <span className="font-medium text-gray-700 dark:text-gray-300">{soNumber}</span> has been successfully converted.
            </p>
          </div>
          <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-900/10">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">New Invoice Created</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{convertedInvoiceNumber}</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Status: Draft — ready for review and sending</p>
          </div>
          <p className="text-xs text-gray-400">
            The SO is now <strong>Closed</strong>. Go to <strong>Invoices</strong> to review and send the new invoice.
          </p>
          <Button onClick={handleClose} className="w-full">Done</Button>
        </div>
      </Modal>
    );
  }

  // Stage 1: confirm
  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Convert to Invoice</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Convert <span className="font-medium text-gray-700 dark:text-gray-300">{soNumber}</span> ({formatCurrency(amount)}) into a draft invoice?
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">What will happen:</p>
          <ul className="mt-1.5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-emerald-500">✓</span>
              A new <strong>Draft invoice</strong> will be created using fulfilled quantities
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-emerald-500">✓</span>
              Invoice amounts are calculated based on <strong>qty fulfilled</strong> (proportional for partial)
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-emerald-500">✓</span>
              Sales order number is linked in the invoice for traceability
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-emerald-500">✓</span>
              This sales order will be <strong>Closed</strong> after conversion
            </li>
          </ul>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleConvert} disabled={loading}>
            {loading ? "Converting..." : "Convert to Invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConvertToInvoiceModal;
