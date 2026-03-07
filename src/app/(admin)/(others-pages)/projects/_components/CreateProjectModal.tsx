"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import projectsService from "@/services/projectsService";
import customersService from "@/services/customersService";
import type { CreateProjectRequest, BillingMethod } from "@/types/projects";
import type { Customer } from "@/types/customers";

const PROJECT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#EC4899", "#14B8A6", "#6366F1",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";
const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateProjectRequest>({
    name: "",
    billingMethod: "TIME_AND_MATERIALS",
    color: PROJECT_COLORS[0],
  });

  useEffect(() => {
    if (!isOpen || !token) return;
    customersService.getCustomers({ isActive: "true" }, token)
      .then((r) => setCustomers(Array.isArray(r) ? r : (r as { items?: Customer[] }).items ?? []))
      .catch(() => {});
  }, [isOpen, token]);

  const set = (key: keyof CreateProjectRequest, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await projectsService.create(form, token);
      onCreated();
      onClose();
      setForm({ name: "", billingMethod: "TIME_AND_MATERIALS", color: PROJECT_COLORS[0] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700 dark:bg-error-900/20 dark:text-error-400">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className={labelCls}>Project Name <span className="text-error-500">*</span></label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Website Redesign" className={inputCls} />
          </div>

          {/* Customer */}
          <div>
            <label className={labelCls}>Customer</label>
            <select value={form.customerId ?? ""} onChange={(e) => set("customerId", e.target.value || undefined)} className={inputCls}>
              <option value="">— No customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select>
          </div>

          {/* Billing method */}
          <div>
            <label className={labelCls}>Billing Method</label>
            <select value={form.billingMethod} onChange={(e) => set("billingMethod", e.target.value as BillingMethod)} className={inputCls}>
              <option value="TIME_AND_MATERIALS">Time & Materials</option>
              <option value="FIXED_PRICE">Fixed Price</option>
              <option value="NON_BILLABLE">Non-Billable</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value || undefined)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value || undefined)} className={inputCls} />
            </div>
          </div>

          {/* Budget */}
          {form.billingMethod !== "NON_BILLABLE" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Budget Amount ($)</label>
                <input type="number" min="0" step="0.01" value={form.budgetAmount ?? ""} onChange={(e) => set("budgetAmount", e.target.value ? Number(e.target.value) : undefined)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hourly Rate ($)</label>
                <input type="number" min="0" step="0.01" value={form.hourlyRate ?? ""} onChange={(e) => set("hourlyRate", e.target.value ? Number(e.target.value) : undefined)} placeholder="0.00" className={inputCls} />
              </div>
            </div>
          )}

          {/* Budget hours */}
          <div>
            <label className={labelCls}>Budget Hours</label>
            <input type="number" min="0" step="0.5" value={form.budgetHours ?? ""} onChange={(e) => set("budgetHours", e.target.value ? Number(e.target.value) : undefined)} placeholder="0" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value || undefined)} rows={3} placeholder="Project description..." className={inputCls + " h-auto resize-none py-2.5"} />
          </div>

          {/* Color */}
          <div>
            <label className={labelCls}>Project Color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? "border-gray-800 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
