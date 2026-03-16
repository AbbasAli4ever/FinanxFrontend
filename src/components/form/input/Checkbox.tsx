import type React from "react";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      className={`flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <div className="relative w-4 h-4 shrink-0">
        <input
          id={id}
          type="checkbox"
          className={`w-4 h-4 appearance-none cursor-pointer border rounded transition-colors duration-150
            ${checked
              ? "bg-brand-500 border-brand-500"
              : "bg-white border-gray-300 hover:border-brand-400 dark:bg-gray-800 dark:border-gray-600"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {checked && (
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
