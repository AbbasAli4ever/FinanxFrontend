import React, { useState } from "react";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const next = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];
    setSelectedOptions(next);
    if (onChange) onChange(next);
  };

  const removeOption = (_index: number, value: string) => {
    const next = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(next);
    if (onChange) onChange(next);
  };

  const selectedValuesText = selectedOptions.map(
    (value) => options.find((o) => o.value === value)?.text || ""
  );

  return (
    <div className="w-full">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="w-full">
            <div className={`mb-2 flex min-h-9 rounded border py-1 pl-2.5 pr-2 transition-colors duration-150 ${
              isOpen
                ? "border-brand-500 ring-2 ring-brand-500/20"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
            } bg-white dark:bg-gray-800 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
              <div className="flex flex-wrap flex-auto gap-1.5 py-0.5">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[12px] text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <span>{text}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeOption(index, selectedOptions[index]); }}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 leading-none"
                      >
                        <svg className="fill-current" width="10" height="10" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[13px] text-gray-400 dark:text-gray-500 py-0.5">Select options</span>
                )}
              </div>
              <div className="flex items-center pl-1 pr-0.5">
                <button type="button" onClick={toggleDropdown} className="text-gray-500 dark:text-gray-400">
                  <svg className={`stroke-current transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-theme-lg top-full max-h-48 dark:bg-gray-800 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors duration-100 border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                    selectedOptions.includes(option.value)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    selectedOptions.includes(option.value)
                      ? "border-brand-500 bg-brand-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {selectedOptions.includes(option.value) && (
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {option.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
