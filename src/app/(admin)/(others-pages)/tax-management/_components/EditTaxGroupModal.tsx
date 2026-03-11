"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import taxesService from "@/services/taxesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { TaxGroup, TaxRate } from "@/types/taxes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  group: TaxGroup | null;
  availableRates: TaxRate[];
}

const EditTaxGroupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUpdated,
  group,
  availableRates,
}) => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [linkedRateIds, setLinkedRateIds] = useState<string[]>([]);

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name,
        code: group.code,
        description: group.description ?? "",
      });
      setLinkedRateIds(
        [...group.taxGroupRates]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((r) => r.taxRateId)
      );
      setError(null);
    }
  }, [group]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleToggleRate = async (rateId: string) => {
    if (!token || !group) return;
    const isLinked = linkedRateIds.includes(rateId);
    try {
      if (isLinked) {
        await taxesService.removeRateFromGroup(token, group.id, rateId);
        setLinkedRateIds((prev) => prev.filter((r) => r !== rateId));
      } else {
        await taxesService.addRateToGroup(token, group.id, rateId);
        setLinkedRateIds((prev) => [...prev, rateId]);
      }
      onUpdated();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !group) return;
    setSaving(true);
    setError(null);
    try {
      await taxesService.updateGroup(token, group.id, {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const combinedRate = availableRates
    .filter((r) => linkedRateIds.includes(r.id))
    .reduce((sum, r) => sum + parseFloat(r.rate), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Tax Group</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update name/code and manage included rates.</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="egrp-name">Name</Label>
              <Input id="egrp-name" type="text" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="egrp-code">Code</Label>
              <Input id="egrp-code" type="text" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div>
            <Label htmlFor="egrp-desc">Description</Label>
            <TextArea value={form.description} onChange={(val) => set("description", val)} rows={2} />
          </div>

          {/* Rate toggles — live updates */}
          <div>
            <Label>Included Rates <span className="text-xs font-normal text-gray-400">(changes apply immediately)</span></Label>
            <div className="mt-1.5 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {availableRates.map((rate) => {
                const linked = linkedRateIds.includes(rate.id);
                return (
                  <label
                    key={rate.id}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      linked ? "bg-brand-50 dark:bg-brand-900/20" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={linked}
                        onChange={() => handleToggleRate(rate.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rate.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{rate.code} · {rate.taxType}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${linked ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {parseFloat(rate.rate)}%
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {linkedRateIds.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 px-4 py-3">
              <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">Combined Rate</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{combinedRate.toFixed(2)}%</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button size="sm" disabled={saving} type="submit">{saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditTaxGroupModal;
