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
import type { TaxRate, TaxType } from "@/types/taxes";

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  rate: TaxRate | null;
}

const EditTaxRateModal: React.FC<Props> = ({ isOpen, onClose, onUpdated, rate }) => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    rateValue: "",
    taxType: "BOTH" as TaxType,
    isCompound: false,
  });

  useEffect(() => {
    if (rate) {
      setForm({
        name: rate.name,
        code: rate.code,
        description: rate.description ?? "",
        rateValue: rate.rate,
        taxType: rate.taxType,
        isCompound: rate.isCompound,
      });
      setError(null);
    }
  }, [rate]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rate) return;
    setSaving(true);
    setError(null);
    try {
      await taxesService.updateRate(token, rate.id, {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        rate: parseFloat(form.rateValue),
        taxType: form.taxType,
        isCompound: form.isCompound,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Tax Rate</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update rate details for {rate?.name}.</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-rate-name">Name <span className="text-error-500">*</span></Label>
              <Input id="edit-rate-name" type="text" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-rate-code">Code <span className="text-error-500">*</span></Label>
              <Input id="edit-rate-code" type="text" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-rate-percent">Rate (%)</Label>
              <Input id="edit-rate-percent" type="number" min="0" max="100" step={0.01} value={form.rateValue} onChange={(e) => set("rateValue", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-rate-type">Tax Type</Label>
              <div className="relative">
                <select id="edit-rate-type" className={selectClasses} value={form.taxType} onChange={(e) => set("taxType", e.target.value as TaxType)}>
                  <option value="BOTH">Both</option>
                  <option value="SALES">Sales Only</option>
                  <option value="PURCHASE">Purchase Only</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M4 6l4 4 4-4" /></svg>
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-rate-desc">Description</Label>
            <TextArea value={form.description} onChange={(val) => set("description", val)} rows={2} />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <input
              id="edit-rate-compound"
              type="checkbox"
              checked={form.isCompound}
              onChange={(e) => set("isCompound", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
            />
            <div>
              <label htmlFor="edit-rate-compound" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                Compound Tax
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Applied on top of base + previous taxes</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button size="sm" disabled={saving} type="submit">{saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditTaxRateModal;
