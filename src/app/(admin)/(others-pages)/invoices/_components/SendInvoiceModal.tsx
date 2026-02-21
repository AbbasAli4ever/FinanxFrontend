"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import invoicesService from "@/services/invoicesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface SendInvoiceModalProps {
  isOpen: boolean;
  invoiceId: string | null;
  invoiceNumber: string;
  onClose: () => void;
  onSent: () => void;
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  invoiceId,
  invoiceNumber,
  onClose,
  onSent,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!token || !invoiceId) return;

    setError("");
    setLoading(true);

    try {
      await invoicesService.sendInvoice(invoiceId, token);
      onSent();
      onClose();
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
          Send Invoice
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to send invoice{" "}
          <strong className="text-gray-900 dark:text-white">
            {invoiceNumber}
          </strong>
          ?
        </p>
        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-xs text-brand-700 dark:text-brand-300">
            This will change the status to SENT and calculate the due date from
            payment terms. Inventory will be deducted for any inventory-type
            products in the line items.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send Invoice"}
        </Button>
      </div>
    </Modal>
  );
};

export default SendInvoiceModal;
