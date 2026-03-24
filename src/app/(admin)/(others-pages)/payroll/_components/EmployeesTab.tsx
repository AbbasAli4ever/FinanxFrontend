"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import payrollService from "@/services/payrollService";
import type { EmployeeListItem, EmploymentType, PayType } from "@/types/payroll";
import CreateEmployeeModal from "./CreateEmployeeModal";
import EmployeeDetailModal from "./EmployeeDetailModal";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const employmentTypeBadge: Record<EmploymentType, "primary" | "success" | "warning" | "info" | "light"> = {
  FULL_TIME: "success",
  PART_TIME: "info",
  CONTRACTOR: "warning",
  TEMPORARY: "light",
};

const payTypeBadge: Record<PayType, "primary" | "light"> = {
  SALARY: "primary",
  HOURLY: "light",
};

const EmployeesTab: React.FC = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<{ search: string; employmentType: string; payType: string; isActive: string }>({
    search: "",
    employmentType: "",
    payType: "",
    isActive: "true",
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createModal = useModal();
  const detailModal = useModal();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await payrollService.getEmployees(
        {
          search: filters.search || undefined,
          employmentType: (filters.employmentType as EmploymentType) || undefined,
          payType: (filters.payType as PayType) || undefined,
          isActive: filters.isActive || undefined,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        },
        token
      );
      setEmployees(data.items ?? []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({ variant: "warning", title: "Access Denied", message: getPermissionDeniedMessage(error) });
      } else {
        setAlert({ variant: "error", title: "Unable to load employees", message: formatApiErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters, pagination.page, pagination.limit]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
  };

  const handleView = (emp: EmployeeListItem) => {
    setSelectedEmployeeId(emp.id);
    detailModal.openModal();
  };

  const handleCreated = () => {
    setAlert({ variant: "success", title: "Employee Created", message: "The employee has been added to payroll." });
    fetchEmployees();
  };

  const handleUpdated = () => {
    setAlert({ variant: "success", title: "Employee Updated", message: "Employee details have been updated." });
    fetchEmployees();
  };

  const handleDeactivated = () => {
    setAlert({ variant: "success", title: "Employee Deactivated", message: "The employee has been deactivated." });
    fetchEmployees();
  };

  return (
    <div className="space-y-5">
      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          {/* Employment Type filter */}
          <div className="relative">
            <select
              value={filters.employmentType}
              onChange={(e) => { setFilters((p) => ({ ...p, employmentType: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`${selectClasses} min-w-[160px] ${filters.employmentType ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="TEMPORARY">Temporary</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {/* Pay Type filter */}
          <div className="relative">
            <select
              value={filters.payType}
              onChange={(e) => { setFilters((p) => ({ ...p, payType: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`${selectClasses} min-w-[130px] ${filters.payType ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
            >
              <option value="">Pay Type</option>
              <option value="SALARY">Salary</option>
              <option value="HOURLY">Hourly</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {/* Active filter */}
          <div className="relative">
            <select
              value={filters.isActive}
              onChange={(e) => { setFilters((p) => ({ ...p, isActive: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`${selectClasses} min-w-[130px] text-gray-800 dark:text-white/90`}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="">All</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>

        <Button size="sm" onClick={createModal.openModal}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z" fill="currentColor" /></svg>
          Add Employee
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading employees...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    {["Employee #", "Name", "Department / Title", "Pay Type", "Pay Rate", "Frequency", "Type", "Hire Date", "Status", "Actions"].map((h) => (
                      <TableCell key={h} isHeader className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${h === "Pay Rate" || h === "Actions" ? "text-right" : "text-left"}`}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3">
                        <button onClick={() => handleView(emp)} className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400">
                          {emp.employeeNumber}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white/90">{emp.fullName}</p>
                          {emp.email && <p className="text-xs text-gray-400 dark:text-gray-500">{emp.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          {emp.department && <p className="text-sm text-gray-700 dark:text-gray-300">{emp.department}</p>}
                          {emp.jobTitle && <p className="text-xs text-gray-400 dark:text-gray-500">{emp.jobTitle}</p>}
                          {!emp.department && !emp.jobTitle && <span className="text-sm text-gray-400">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={payTypeBadge[emp.payType]} variant="light">{emp.payType === "SALARY" ? "Salary" : "Hourly"}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
                        {emp.payType === "SALARY"
                          ? formatCurrency(emp.payRate) + "/yr"
                          : formatCurrency(emp.payRate) + "/hr"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {emp.payFrequency.charAt(0) + emp.payFrequency.slice(1).toLowerCase().replace("_", "-")}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={employmentTypeBadge[emp.employmentType]} variant="light">
                          {emp.employmentType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(emp.hireDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={emp.isActive ? "success" : "dark"} variant="light">
                          {emp.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleView(emp)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            title="View Employee"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {employees.length === 0 && (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No employees found.</p>
                <button onClick={createModal.openModal} className="mt-2 text-sm text-brand-500 hover:text-brand-600 hover:underline">Add your first employee</button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateEmployeeModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onCreated={handleCreated}
      />

      <EmployeeDetailModal
        isOpen={detailModal.isOpen}
        employeeId={selectedEmployeeId}
        onClose={() => { detailModal.closeModal(); setSelectedEmployeeId(null); }}
        onUpdated={handleUpdated}
        onDeactivated={handleDeactivated}
      />
    </div>
  );
};

export default EmployeesTab;
