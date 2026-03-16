"use client";
import React, { useState } from "react";

interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
}

const Switch: React.FC<SwitchProps> = ({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    setIsChecked(next);
    if (onChange) onChange(next);
  };

  const trackColor = disabled
    ? "bg-gray-100 dark:bg-gray-700"
    : isChecked
    ? color === "blue"
      ? "bg-brand-500"
      : "bg-gray-700 dark:bg-gray-500"
    : "bg-gray-200 dark:bg-gray-600";

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-2.5 text-[13px] font-medium ${
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 dark:text-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div className="relative shrink-0">
        <div
          className={`h-5 w-9 rounded-full transition-colors duration-200 ease-in-out ${trackColor}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-theme-xs transition-transform duration-200 ease-in-out ${
            isChecked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      {label}
    </label>
  );
};

export default Switch;
