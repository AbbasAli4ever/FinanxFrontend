import React from "react";

interface RadioProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const Radio: React.FC<RadioProps> = ({
  id,
  name,
  value,
  checked,
  label,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer select-none items-center gap-2.5 text-[13px] font-medium transition-colors duration-150 ${
        disabled
          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          : "text-gray-700 dark:text-gray-300"
      } ${className}`}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
          checked
            ? "border-brand-500 bg-brand-500"
            : "bg-white border-gray-300 hover:border-brand-400 dark:bg-gray-800 dark:border-gray-600"
        } ${
          disabled
            ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700"
            : ""
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full bg-white ${checked ? "block" : "hidden"}`} />
      </span>
      {label}
    </label>
  );
};

export default Radio;
