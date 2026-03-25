"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import payrollService from "@/services/payrollService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Employee, EmploymentType, PayType, PayFrequency, TaxFilingStatus, Gender, EmployeePayHistoryItem } from "@/types/payroll";
import AttachmentsPanel from "@/components/documents/AttachmentsPanel";

interface EmployeeDetailModalProps {
  isOpen: boolean;
  employeeId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeactivated: () => void;
}

const inputClasses = "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClasses = "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
const labelClasses = "mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SelectWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">{children}<svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></div>
);

type ViewMode = "overview" | "edit" | "history";

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen, employeeId, onClose, onUpdated, onDeactivated,
}) => {
  const { token } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<ViewMode>("overview");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // History
  const [history, setHistory] = useState<EmployeePayHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit fields (populated from employee)
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payRate, setPayRate] = useState("");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [payType, setPayType] = useState<PayType>("SALARY");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [taxFilingStatus, setTaxFilingStatus] = useState<TaxFilingStatus | "">("");
  const [notes, setNotes] = useState("");

  const loadEmployee = async () => {
    if (!token || !employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await payrollService.getEmployee(employeeId, token);
      setEmployee(emp);
      // Pre-populate edit fields
      setDepartment(emp.department || "");
      setJobTitle(emp.jobTitle || "");
      setEmail(emp.email || "");
      setPhone(emp.phone || "");
      setPayRate(emp.payRate.toString());
      setPayFrequency(emp.payFrequency);
      setPayType(emp.payType);
      setEmploymentType(emp.employmentType);
      setTaxFilingStatus(emp.taxFilingStatus || "");
      setNotes(emp.notes || "");
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!token || !employeeId) return;
    setHistoryLoading(true);
    try {
      const data = await payrollService.getEmployeePayHistory(employeeId, 1, 20, token);
      setHistory(data.items);
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employeeId) { loadEmployee(); setView("overview"); setConfirmDeactivate(false); }
  }, [isOpen, employeeId]);

  useEffect(() => {
    if (view === "history" && employeeId) loadHistory();
  }, [view]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !employeeId) return;
    setSaving(true);
    setError(null);
    try {
      await payrollService.updateEmployee(employeeId, {
        department: department || undefined,
        jobTitle: jobTitle || undefined,
        email: email || undefined,
        phone: phone || undefined,
        payRate: parseFloat(payRate),
        payFrequency,
        payType,
        employmentType,
        taxFilingStatus: (taxFilingStatus as TaxFilingStatus) || undefined,
        notes: notes || undefined,
      }, token);
      onUpdated();
      setView("overview");
      loadEmployee();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!token || !employeeId) return;
    setSaving(true);
    setError(null);
    try {
      await payrollService.deactivateEmployee(employeeId, token);
      onDeactivated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
      setConfirmDeactivate(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error && !employee ? (
          <Alert variant="error" title="Error" message={error} />
        ) : employee ? (
          <>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{employee.fullName}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee.employeeNumber}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge size="sm" color={employee.isActive ? "success" : "dark"} variant="light">{employee.isActive ? "Active" : "Inactive"}</Badge>
                  <Badge size="sm" color="light" variant="light">{employee.employmentType.replace("_", " ")}</Badge>
                  <Badge size="sm" color="primary" variant="light">{employee.payType === "SALARY" ? "Salaried" : "Hourly"}</Badge>
                </div>
              </div>
            </div>

            {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}

            {/* Tab nav */}
            <div className="mb-5 flex gap-0 border-b border-gray-200 dark:border-gray-800">
              {([["overview", "Overview"], ["edit", "Edit"], ["history", "Pay History"]] as [ViewMode, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${view === id ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {view === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Department", value: employee.department || "—" },
                    { label: "Job Title", value: employee.jobTitle || "—" },
                    { label: "Email", value: employee.email || "—" },
                    { label: "Phone", value: employee.phone || "—" },
                    { label: "Hire Date", value: formatDate(employee.hireDate) },
                    { label: "Date of Birth", value: formatDate(employee.dateOfBirth) },
                    { label: "Pay Rate", value: employee.payType === "SALARY" ? `${formatCurrency(employee.payRate)}/yr` : `${formatCurrency(employee.payRate)}/hr` },
                    { label: "Pay Frequency", value: employee.payFrequency.replace("_", "-") },
                    { label: "Tax Filing Status", value: employee.taxFilingStatus || "—" },
                    { label: "Bank", value: employee.bankName || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{value}</p>
                    </div>
                  ))}
                </div>

                {employee.addressLine1 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Address</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">
                      {employee.addressLine1}{employee.city ? `, ${employee.city}` : ""}{employee.state ? `, ${employee.state}` : ""}{employee.postalCode ? ` ${employee.postalCode}` : ""}
                    </p>
                  </div>
                )}

                {employee.notes && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Notes</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{employee.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                  <AttachmentsPanel entityType="EMPLOYEE" entityId={employee.id} />
                </div>

                {/* Deactivate */}
                {employee.isActive && (
                  <div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-900/30 dark:bg-error-900/10">
                    <p className="text-sm font-medium text-error-700 dark:text-error-400">Danger Zone</p>
                    <p className="mt-1 text-xs text-error-600 dark:text-error-500">Deactivating an employee will set their status to inactive.</p>
                    {confirmDeactivate ? (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeactivate(false)}>Cancel</Button>
                        <button
                          onClick={handleDeactivate}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-error-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-error-700 disabled:opacity-60"
                        >
                          {saving ? "Deactivating..." : "Yes, Deactivate"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeactivate(true)} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-medium text-error-600 transition hover:bg-error-50 dark:border-error-800 dark:bg-transparent dark:text-error-400">
                        Deactivate Employee
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Edit */}
            {view === "edit" && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Department</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Job Title</label>
                    <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Employment Type</label>
                    <SelectWrapper>
                      <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)} className={selectClasses}>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="TEMPORARY">Temporary</option>
                      </select>
                    </SelectWrapper>
                  </div>
                  <div>
                    <label className={labelClasses}>Pay Frequency</label>
                    <SelectWrapper>
                      <select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)} className={selectClasses}>
                        <option value="WEEKLY">Weekly</option>
                        <option value="BIWEEKLY">Bi-Weekly</option>
                        <option value="SEMIMONTHLY">Semi-Monthly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </SelectWrapper>
                  </div>
                  <div>
                    <label className={labelClasses}>Pay Type</label>
                    <SelectWrapper>
                      <select value={payType} onChange={(e) => setPayType(e.target.value as PayType)} className={selectClasses}>
                        <option value="SALARY">Salary</option>
                        <option value="HOURLY">Hourly</option>
                      </select>
                    </SelectWrapper>
                  </div>
                  <div>
                    <label className={labelClasses}>Pay Rate</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input type="number" value={payRate} onChange={(e) => setPayRate(e.target.value)} min="0" step="0.01" className={`${inputClasses} pl-7`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Tax Filing Status</label>
                    <SelectWrapper>
                      <select value={taxFilingStatus} onChange={(e) => setTaxFilingStatus(e.target.value as TaxFilingStatus | "")} className={selectClasses}>
                        <option value="">—</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                      </select>
                    </SelectWrapper>
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 resize-none" />
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Button variant="outline" size="sm" type="button" onClick={() => setView("overview")}>Cancel</Button>
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                </div>
              </form>
            )}

            {/* Pay History */}
            {view === "history" && (
              <div>
                {historyLoading ? (
                  <div className="py-8 text-center"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>
                ) : history.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No pay history available.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          {["Pay Period", "Pay Date", "Gross Pay", "Deductions", "Net Pay"].map((h) => (
                            <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${h === "Pay Period" ? "text-left" : "text-right"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(item.payRun.payPeriodStart)} – {formatDate(item.payRun.payPeriodEnd)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{formatDate(item.payRun.payDate)}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(item.grossPay)}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums text-error-600 dark:text-error-400">−{formatCurrency(item.totalDeductions)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-success-600 dark:text-success-400">{formatCurrency(item.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
};

export default EmployeeDetailModal;
