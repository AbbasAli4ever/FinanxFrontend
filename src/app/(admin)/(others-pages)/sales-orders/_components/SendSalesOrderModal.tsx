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
  onSent: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const SendSalesOrderModal: React.FC<Props> = ({ isOpen, soId, soNumber, amount, onClose, onSent }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!token || !soId) return;
    setLoading(true); setError("");
    try {
      await salesOrdersService.sendSalesOrder(soId, token);
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
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Send Sales Order</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Send <span className="font-medium text-gray-700 dark:text-gray-300">{soNumber}</span> ({formatCurrency(amount)}) to the customer?
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Status will change from <strong>Draft</strong> to <strong>Sent</strong>. If no expected delivery date is set, it will default to 30 days from today.
            </p>
          </div>
        </div>
        {error && <Alert variant="error" title="Error" message={error} />}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send to Customer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SendSalesOrderModal;
