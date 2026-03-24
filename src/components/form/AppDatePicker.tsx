"use client";

import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

interface AppDatePickerProps {
  id?: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  min?: string; // "YYYY-MM-DD"
  max?: string; // "YYYY-MM-DD"
  maxToday?: boolean; // disallow future dates
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({
  id,
  value,
  onChange,
  placeholder = "Select date",
  label,
  min,
  max,
  maxToday = false,
  disabled = false,
  required = false,
  className = "",
  error = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref current so the flatpickr callback always has the latest
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const resolvedMax = maxToday ? "today" : max;

  // Init flatpickr once
  useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      dateFormat: "Y-m-d",
      allowInput: true,
      disableMobile: true,
      minDate: min,
      maxDate: resolvedMax,
      defaultDate: value || undefined,
      onChange: (selectedDates, dateStr) => {
        onChangeRef.current(dateStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync min/max changes
  useEffect(() => {
    if (!fpRef.current) return;
    fpRef.current.set("minDate", min ?? "");
    fpRef.current.set("maxDate", resolvedMax ?? "");
  }, [min, resolvedMax]);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!fpRef.current) return;
    const current = fpRef.current.selectedDates[0];
    const currentStr = current
      ? flatpickr.formatDate(current, "Y-m-d")
      : "";
    if (currentStr !== value) {
      if (value) {
        fpRef.current.setDate(value, false);
      } else {
        fpRef.current.clear();
      }
    }
  }, [value]);

  const borderClass = error
    ? "border-error-300 focus:border-error-300 focus:ring-error-500/20 dark:border-error-700"
    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
        >
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={false}
          className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-sm shadow-theme-xs transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60 bg-transparent text-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${borderClass}`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default AppDatePicker;
