"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface AcceptEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  totalAmount: number;
  onClose: () => void;
  onAccepted: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const AcceptEstimateModal: React.FC<AcceptEstimateModalProps> = ({
  isOpen, estimateId, estimateNumber, totalAmount, onClose, onAccepted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  const handleAccept = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      await estimatesService.acceptEstimate(estimateId, token);
      onAccepted(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accept Estimate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mark <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span> as accepted by the customer.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-success-200 bg-success-50/60 px-4 py-3 dark:border-success-800 dark:bg-success-900/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-success-700 dark:text-success-300">Estimate Value</span>
            <span className="text-xl font-bold tabular-nums text-success-600 dark:text-success-400">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Once accepted, you can convert this estimate into an invoice to proceed with billing.
        </p>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleAccept} disabled={loading}>
            {loading ? "Accepting..." : "Accept Estimate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AcceptEstimateModal;
