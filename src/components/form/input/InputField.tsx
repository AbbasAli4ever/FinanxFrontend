import React, { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string | number;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  autoComplete?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  defaultValue,
  onChange,
  value,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  autoComplete,
}) => {
  let inputClasses = `h-9 w-full rounded border appearance-none px-3 py-2 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:text-gray-100 dark:placeholder:text-gray-500 transition-colors duration-150 ${className}`;

  if (disabled) {
    inputClasses += ` bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` bg-white text-gray-800 border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:bg-gray-800 dark:border-error-600 dark:text-gray-100`;
  } else if (success) {
    inputClasses += ` bg-white text-gray-800 border-success-400 focus:border-success-500 focus:ring-success-500/20 dark:bg-gray-800 dark:border-success-600 dark:text-gray-100`;
  } else {
    inputClasses += ` bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:border-brand-500 focus:ring-brand-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-brand-400`;
  }

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
      />
      {hint && (
        <p
          className={`mt-1 text-[11px] ${
            error
              ? "text-error-500"
              : success
              ? "text-success-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
