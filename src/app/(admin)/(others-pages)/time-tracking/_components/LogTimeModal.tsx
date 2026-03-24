"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import timeEntriesService from "@/services/timeEntriesService";
import AppDatePicker from "@/components/form/AppDatePicker";
import projectsService from "@/services/projectsService";
import type { CreateTimeEntryRequest } from "@/types/projects";
import type { Project } from "@/types/projects";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedProjectId?: string;
}

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";
const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

const LogTimeModal: React.FC<Props> = ({ isOpen, onClose, onCreated, preselectedProjectId }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [durationMode, setDurationMode] = useState<"minutes" | "time">("minutes");
  const [form, setForm] = useState<CreateTimeEntryRequest>({
    projectId: preselectedProjectId ?? "",
    date: new Date().toISOString().slice(0, 10),
    duration: 60,
    isBillable: true,
  });

  // Derived duration from start/end
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!isOpen || !token) return;
    projectsService.getList({ status: "ACTIVE", limit: 100 }, token)
      .then((r) => setProjects(r.items))
      .catch(() => {});
  }, [isOpen, token]);

  useEffect(() => {
    if (preselectedProjectId) setForm((p) => ({ ...p, projectId: preselectedProjectId }));
  }, [preselectedProjectId]);

  useEffect(() => {
    if (durationMode === "time" && startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) setForm((p) => ({ ...p, duration: mins, startTime, endTime }));
    }
  }, [durationMode, startTime, endTime]);

  const set = (key: keyof CreateTimeEntryRequest, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.projectId) return;
    setSaving(true);
    setError("");
    try {
      await timeEntriesService.create(form, token);
      onCreated();
      onClose();
      setForm({ projectId: preselectedProjectId ?? "", date: new Date().toISOString().slice(0, 10), duration: 60, isBillable: true });
      setStartTime(""); setEndTime("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log time.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hours = Math.floor(form.duration / 60);
  const mins = form.duration % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Log Time</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <div className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700 dark:bg-error-900/20 dark:text-error-400">{error}</div>}

          {/* Project */}
          <div>
            <label className={labelCls}>Project <span className="text-error-500">*</span></label>
            <select required value={form.projectId} onChange={(e) => set("projectId", e.target.value)} className={inputCls}>
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Date <span className="text-error-500">*</span></label>
            <AppDatePicker value={form.date} onChange={(val) => set("date", val)} maxToday />
          </div>

          {/* Duration mode toggle */}
          <div>
            <label className={labelCls}>Duration</label>
            <div className="mb-2 flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
              {(["minutes", "time"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMode(m)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    durationMode === m
                      ? "bg-brand-500 text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {m === "minutes" ? "Manual (h:m)" : "Start / End"}
                </button>
              ))}
            </div>

            {durationMode === "minutes" ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Hours</label>
                  <input
                    type="number" min="0" max="23"
                    value={hours}
                    onChange={(e) => set("duration", Number(e.target.value) * 60 + mins)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Minutes</label>
                  <input
                    type="number" min="0" max="59" step="5"
                    value={mins}
                    onChange={(e) => set("duration", hours * 60 + Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {/* Duration preview */}
            {form.duration > 0 && (
              <p className="mt-1 text-xs text-gray-400">= {Math.floor(form.duration / 60)}h {form.duration % 60}m ({form.duration} min)</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value || undefined)} rows={2} placeholder="What did you work on?" className={inputCls + " h-auto resize-none"} />
          </div>

          {/* Hourly rate */}
          <div>
            <label className={labelCls}>Hourly Rate ($)</label>
            <input type="number" min="0" step="0.01" value={form.hourlyRate ?? ""} onChange={(e) => set("hourlyRate", e.target.value ? Number(e.target.value) : undefined)} placeholder="Use project default" className={inputCls} />
          </div>

          {/* Billable toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("isBillable", !form.isBillable)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isBillable ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isBillable ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {form.isBillable ? "Billable" : "Non-billable"}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={saving || !form.projectId || form.duration <= 0} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {saving ? "Logging…" : "Log Time"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogTimeModal;
