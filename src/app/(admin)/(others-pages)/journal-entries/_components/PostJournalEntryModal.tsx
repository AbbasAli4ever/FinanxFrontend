"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import journalEntriesService from "@/services/journalEntriesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface PostJournalEntryModalProps {
  isOpen: boolean;
  entryId: string | null;
  entryNumber: string;
  totalDebit: number;
  totalCredit: number;
  onClose: () => void;
  onPosted: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const PostJournalEntryModal: React.FC<PostJournalEntryModalProps> = ({
  isOpen,
  entryId,
  entryNumber,
  totalDebit,
  totalCredit,
  onClose,
  onPosted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handlePost = async () => {
    if (!token || !entryId) return;
    setError("");
    setLoading(true);
    try {
      await journalEntriesService.postJournalEntry(entryId, token);
      onPosted();
      handleClose();
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
          Post Journal Entry
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Post entry{" "}
          <strong className="text-gray-900 dark:text-white">{entryNumber}</strong>{" "}
          to the general ledger? This will update account balances.
        </p>

        {/* Balance Check */}
        <div className={`mt-3 rounded-lg border p-3 ${
          isBalanced
            ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20"
            : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20"
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}>
              Total Debits
            </span>
            <span className={`font-medium tabular-nums ${isBalanced ? "text-success-800 dark:text-success-200" : "text-error-800 dark:text-error-200"}`}>
              {formatCurrency(totalDebit)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className={isBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}>
              Total Credits
            </span>
            <span className={`font-medium tabular-nums ${isBalanced ? "text-success-800 dark:text-success-200" : "text-error-800 dark:text-error-200"}`}>
              {formatCurrency(totalCredit)}
            </span>
          </div>
          {!isBalanced && (
            <div className="mt-2 border-t border-error-200 pt-2 dark:border-error-700">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-error-700 dark:text-error-300">Difference</span>
                <span className="font-bold tabular-nums text-error-700 dark:text-error-200">
                  {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </span>
              </div>
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                Debits and credits must be equal to post this entry.
              </p>
            </div>
          )}
          {isBalanced && (
            <p className="mt-2 text-xs text-success-600 dark:text-success-400">
              Entry is balanced and ready to post.
            </p>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Once posted, this entry cannot be edited. To correct errors, void
            this entry or create a reversing entry.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
        <Button size="sm" onClick={handlePost} disabled={loading || !isBalanced}>
          {loading ? "Posting..." : "Post to Ledger"}
        </Button>
      </div>
    </Modal>
  );
};

export default PostJournalEntryModal;
