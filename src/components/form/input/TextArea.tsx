import React from "react";

interface TextareaProps {
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message",
  rows = 3,
  value = "",
  onChange,
  className = "",
  disabled = false,
  error = false,
  hint = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e.target.value);
  };

  let textareaClasses = `w-full rounded border px-3 py-2 text-[13px] focus:outline-none focus:ring-2 transition-colors duration-150 resize-y ${className}`;

  if (disabled) {
    textareaClasses += ` bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-white text-gray-800 border-error-400 focus:border-error-500 focus:ring-error-500/20 placeholder:text-gray-400 dark:bg-gray-800 dark:border-error-600 dark:text-gray-100`;
  } else {
    textareaClasses += ` bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:border-brand-500 focus:ring-brand-500/20 placeholder:text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-brand-400 dark:placeholder:text-gray-500`;
  }

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p className={`mt-1 text-[11px] ${error ? "text-error-500" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
