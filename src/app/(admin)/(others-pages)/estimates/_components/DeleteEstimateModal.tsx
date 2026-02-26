"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteEstimateModal: React.FC<DeleteEstimateModalProps> = ({
  isOpen, estimateId, estimateNumber, onClose, onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  const handleDelete = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      await estimatesService.deleteEstimate(estimateId, token);
      onDeleted(); onClose();
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
            <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Estimate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1 bg-error-600 hover:bg-error-700" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Estimate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteEstimateModal;
