"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import salesOrdersService from "@/services/salesOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { SalesOrder, SOLineItem } from "@/types/salesOrders";

interface FulfillItem {
  lineItemId: string;
  description: string;
  quantity: number;
  quantityFulfilled: number;
  remaining: number;
  toFulfill: number;
}

interface Props {
  isOpen: boolean;
  so: SalesOrder | null;
  onClose: () => void;
  onFulfilled: () => void;
}

const FulfillItemsModal: React.FC<Props> = ({ isOpen, so, onClose, onFulfilled }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<FulfillItem[]>([]);
  const [fulfilledDate, setFulfilledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!so || !isOpen) return;
    const fulfillable: FulfillItem[] = so.lineItems
      .filter((line: SOLineItem) => line.quantityFulfilled < line.quantity)
      .map((line: SOLineItem) => ({
        lineItemId: line.id,
        description: line.description,
        quantity: line.quantity,
        quantityFulfilled: line.quantityFulfilled,
        remaining: line.quantity - line.quantityFulfilled,
        toFulfill: 0,
      }));
    setItems(fulfillable);
    setFulfilledDate("");
    setError("");
  }, [so, isOpen]);

  const setToFulfill = (lineItemId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.lineItemId === lineItemId
          ? { ...item, toFulfill: Math.max(0, Math.min(value, item.remaining)) }
          : item
      )
    );
  };

  const totalToFulfill = items.reduce((sum, item) => sum + item.toFulfill, 0);

  const handleSubmit = async () => {
    if (!token || !so) return;
    const itemsToSend = items.filter((item) => item.toFulfill > 0);
    if (itemsToSend.length === 0) {
      setError("Please enter a quantity to fulfill for at least one line item.");
      return;
    }
    setLoading(true); setError("");
    try {
      await salesOrdersService.fulfillItems(so.id, {
        fulfilledDate: fulfilledDate || undefined,
        items: itemsToSend.map((item) => ({
          lineItemId: item.lineItemId,
          quantityFulfilled: item.toFulfill,
        })),
      }, token);
      onFulfilled(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!so) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fulfill Items</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {so.soNumber} — {so.customer.displayName}
          </p>
        </div>

        {/* Additive note */}
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/10">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Quantities are <strong>additive</strong> — values entered here will be added to existing fulfilled amounts per line.
          </p>
        </div>

        {/* Line items */}
        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 py-10 text-center dark:border-gray-800">
            <p className="text-sm font-medium text-gray-500">All items have been fully fulfilled.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Description</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Ordered</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Fulfilled</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Remaining</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Qty to Fulfill</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => {
                  const progressAfter = Math.min(
                    ((item.quantityFulfilled + item.toFulfill) / item.quantity) * 100,
                    100
                  );
                  return (
                    <tr key={item.lineItemId}>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white/90">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-gray-600 dark:text-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-gray-600 dark:text-gray-400">
                        {item.quantityFulfilled}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {item.remaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={String(item.remaining)}
                          value={item.toFulfill === 0 ? "" : item.toFulfill}
                          onChange={(e) => setToFulfill(item.lineItemId, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-sm tabular-nums text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-300 dark:bg-green-400"
                              style={{ width: `${progressAfter}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs tabular-nums text-gray-500">
                            {Math.round(progressAfter)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalToFulfill > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/30">
                <p className="text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total units to fulfill: <span className="text-gray-900 dark:text-white">{totalToFulfill}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fulfilled date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fulfillment Date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={fulfilledDate}
            onChange={(e) => setFulfilledDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-48"
          />
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
            {loading ? "Recording..." : `Fulfill Items${totalToFulfill > 0 ? ` (${totalToFulfill} units)` : ""}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FulfillItemsModal;
