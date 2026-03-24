"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import AppDatePicker from "@/components/form/AppDatePicker";
import payrollService from "@/services/payrollService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { EmploymentType, PayType, PayFrequency, TaxFilingStatus, Gender } from "@/types/payroll";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const inputClasses = "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClasses = "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
const labelClasses = "mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300";

function todayStr() { return new Date().toISOString().split("T")[0]; }

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="col-span-2 mt-2">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{children}</p>
    <div className="mt-1.5 h-px bg-gray-100 dark:bg-gray-800" />
  </div>
);

const SelectWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    {children}
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
  </div>
);

const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [hireDate, setHireDate] = useState(todayStr());
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Job
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [payType, setPayType] = useState<PayType>("SALARY");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [payRate, setPayRate] = useState("");

  // Tax
  const [taxFilingStatus, setTaxFilingStatus] = useState<TaxFilingStatus | "">("");
  const [federalAllowances, setFederalAllowances] = useState("");
  const [stateAllowances, setStateAllowances] = useState("");

  // Bank
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankRoutingNumber, setBankRoutingNumber] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setDateOfBirth("");
    setGender(""); setHireDate(todayStr()); setEmployeeNumber(""); setNotes("");
    setDepartment(""); setJobTitle(""); setEmploymentType("FULL_TIME"); setPayType("SALARY");
    setPayFrequency("MONTHLY"); setPayRate("");
    setTaxFilingStatus(""); setFederalAllowances(""); setStateAllowances("");
    setBankName(""); setBankAccountNumber(""); setBankRoutingNumber("");
    setAddressLine1(""); setCity(""); setState(""); setPostalCode(""); setCountry("US");
    setError(null);
  };

  useEffect(() => { if (!isOpen) resetForm(); }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!firstName.trim() || !lastName.trim() || !hireDate || !payRate) {
      setError("First name, last name, hire date, and pay rate are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await payrollService.createEmployee(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          hireDate,
          employeeNumber: employeeNumber.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: (gender as Gender) || undefined,
          department: department.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          employmentType,
          payType,
          payFrequency,
          payRate: parseFloat(payRate),
          taxFilingStatus: (taxFilingStatus as TaxFilingStatus) || undefined,
          federalAllowances: federalAllowances ? parseInt(federalAllowances) : undefined,
          stateAllowances: stateAllowances ? parseInt(stateAllowances) : undefined,
          bankName: bankName.trim() || undefined,
          bankAccountNumber: bankAccountNumber.trim() || undefined,
          bankRoutingNumber: bankRoutingNumber.trim() || undefined,
          addressLine1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          country: country.trim() || "US",
          notes: notes.trim() || undefined,
        },
        token
      );
      onCreated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 my-6 max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Employee</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter employee details and compensation information.</p>
        </div>

        {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SectionTitle>Personal Information</SectionTitle>

            <div>
              <label className={labelClasses}>First Name <span className="text-error-500">*</span></label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>Last Name <span className="text-error-500">*</span></label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Date of Birth</label>
              <AppDatePicker value={dateOfBirth} onChange={(val) => setDateOfBirth(val)} maxToday />
            </div>
            <div>
              <label className={labelClasses}>Gender</label>
              <SelectWrapper>
                <select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className={selectClasses}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </SelectWrapper>
            </div>

            <SectionTitle>Employment Details</SectionTitle>

            <div>
              <label className={labelClasses}>Hire Date <span className="text-error-500">*</span></label>
              <AppDatePicker value={hireDate} onChange={(val) => setHireDate(val)} maxToday required />
            </div>
            <div>
              <label className={labelClasses}>Employee Number</label>
              <input type="text" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} placeholder="Auto-generated if blank" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" className={inputClasses} />
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
                  <option value="SALARY">Salary (Annual)</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </SelectWrapper>
            </div>
            <div>
              <label className={labelClasses}>
                Pay Rate <span className="text-error-500">*</span>
                <span className="ml-1 text-gray-400 font-normal">({payType === "SALARY" ? "annual" : "per hour"})</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input type="number" value={payRate} onChange={(e) => setPayRate(e.target.value)} placeholder={payType === "SALARY" ? "120000" : "25.00"} min="0" step="0.01" className={`${inputClasses} pl-7`} required />
              </div>
            </div>

            <SectionTitle>Tax Information</SectionTitle>

            <div>
              <label className={labelClasses}>Tax Filing Status</label>
              <SelectWrapper>
                <select value={taxFilingStatus} onChange={(e) => setTaxFilingStatus(e.target.value as TaxFilingStatus | "")} className={selectClasses}>
                  <option value="">Select status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                </select>
              </SelectWrapper>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Federal Allowances</label>
                <input type="number" value={federalAllowances} onChange={(e) => setFederalAllowances(e.target.value)} placeholder="0" min="0" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>State Allowances</label>
                <input type="number" value={stateAllowances} onChange={(e) => setStateAllowances(e.target.value)} placeholder="0" min="0" className={inputClasses} />
              </div>
            </div>

            <SectionTitle>Bank Information</SectionTitle>

            <div>
              <label className={labelClasses}>Bank Name</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Chase" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Routing Number</label>
              <input type="text" value={bankRoutingNumber} onChange={(e) => setBankRoutingNumber(e.target.value)} placeholder="021000021" className={inputClasses} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Account Number</label>
              <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="****1234" className={inputClasses} />
            </div>

            <SectionTitle>Address</SectionTitle>

            <div className="col-span-2">
              <label className={labelClasses}>Street Address</label>
              <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" className={inputClasses} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>State</label>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" maxLength={2} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>ZIP Code</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10001" className={inputClasses} />
              </div>
            </div>

            <div className="col-span-2 mt-2">
              <label className={labelClasses}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes about this employee..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : "Add Employee"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateEmployeeModal;
