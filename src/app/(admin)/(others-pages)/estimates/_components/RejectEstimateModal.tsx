"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface RejectEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  onClose: () => void;
  onRejected: () => void;
}

const RejectEstimateModal: React.FC<RejectEstimateModalProps> = ({
  isOpen, estimateId, estimateNumber, onClose, onRejected,
}) => {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) { setReason(""); setError(""); }
  }, [isOpen]);

  const handleReject = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      await estimatesService.rejectEstimate(estimateId, { reason: reason || undefined }, token);
      onRejected(); onClose();
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Estimate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mark <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span> as rejected.
            </p>
          </div>
        </div>

        <div>
          <Label>Reason (optional)</Label>
          <TextArea
            placeholder="e.g. Budget constraints, timeline conflicts..."
            value={reason}
            onChange={setReason}
            rows={3}
          />
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1 bg-error-600 hover:bg-error-700" onClick={handleReject} disabled={loading}>
            {loading ? "Rejecting..." : "Reject Estimate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectEstimateModal;
