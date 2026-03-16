import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
}) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-[14px] font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        {desc && (
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className={`p-4 ${className}`}>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
