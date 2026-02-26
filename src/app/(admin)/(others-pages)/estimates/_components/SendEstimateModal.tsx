"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface SendEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  totalAmount: number;
  onClose: () => void;
  onSent: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const SendEstimateModal: React.FC<SendEstimateModalProps> = ({
  isOpen, estimateId, estimateNumber, totalAmount, onClose, onSent,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  const handleSend = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      await estimatesService.sendEstimate(estimateId, token);
      onSent(); onClose();
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Estimate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Issue <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span> to the customer.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Estimate Amount</span>
            <span className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">What happens when you send:</p>
          <ul className="mt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Status changes from Draft → Sent</li>
            <li className="flex items-center gap-1.5"><span className="text-blue-500">•</span> If no expiration date is set, a 30-day expiry will be applied automatically</li>
            <li className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Customer can then accept or reject the estimate</li>
          </ul>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send Estimate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SendEstimateModal;
