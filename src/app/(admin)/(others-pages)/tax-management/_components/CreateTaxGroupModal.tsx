"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import taxesService from "@/services/taxesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { TaxRate } from "@/types/taxes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  availableRates: TaxRate[];
}

const CreateTaxGroupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreated,
  availableRates,
}) => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleRate = (id: string) => {
    setSelectedRateIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const combinedRate = availableRates
    .filter((r) => selectedRateIds.includes(r.id))
    .reduce((sum, r) => sum + parseFloat(r.rate), 0);

  const handleClose = () => {
    setForm({ name: "", code: "", description: "" });
    setSelectedRateIds([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await taxesService.createGroup(token, {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        rateIds: selectedRateIds,
      });
      onCreated();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg w-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Tax Group</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Combine multiple tax rates into a single group (e.g. HST = GST + PST).
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grp-name">Name <span className="text-error-500">*</span></Label>
              <Input id="grp-name" type="text" placeholder="e.g. HST Ontario" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="grp-code">Code <span className="text-error-500">*</span></Label>
              <Input id="grp-code" type="text" placeholder="e.g. HST-ON" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div>
            <Label htmlFor="grp-desc">Description</Label>
            <TextArea placeholder="Optional description…" value={form.description} onChange={(val) => set("description", val)} rows={2} />
          </div>

          {/* Rate selector */}
          <div>
            <Label>Include Tax Rates</Label>
            {availableRates.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No active rates available. Create rates first.</p>
            ) : (
              <div className="mt-1.5 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {availableRates.map((rate) => {
                  const selected = selectedRateIds.includes(rate.id);
                  return (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        selected ? "bg-brand-50 dark:bg-brand-900/20" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRate(rate.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rate.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{rate.code} · {rate.taxType}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${selected ? "text-brand-600 dark:text-brand-400" : "text-gray-600 dark:text-gray-400"}`}>
                        {parseFloat(rate.rate)}%
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRateIds.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 px-4 py-3">
              <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">Combined Rate</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{combinedRate.toFixed(2)}%</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={handleClose} type="button">Cancel</Button>
            <Button size="sm" disabled={saving} type="submit">{saving ? "Creating…" : "Create Group"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateTaxGroupModal;
