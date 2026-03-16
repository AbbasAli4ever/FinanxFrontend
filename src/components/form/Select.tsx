import React, { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);
    onChange(value);
  };

  return (
    <select
      className={`h-9 w-full appearance-none rounded border border-gray-300 px-3 py-2 pr-8 text-[13px] bg-white hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors duration-150 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-brand-400 ${
        selectedValue
          ? "text-gray-800 dark:text-gray-100"
          : "text-gray-400 dark:text-gray-500"
      } ${className}`}
      value={selectedValue}
      onChange={handleChange}
    >
      <option value="" disabled className="text-gray-400 dark:bg-gray-800">
        {placeholder}
      </option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
