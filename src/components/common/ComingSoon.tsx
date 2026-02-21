import React from "react";

interface ComingSoonProps {
  pageName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ pageName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white/90 mb-4">
          {pageName}
        </h1>
        <div className="text-6xl mb-6">
          <span role="img" aria-label="construction">
            🚧
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Coming Soon
        </h2>
        <p className="text-gray-500 dark:text-gray-500 max-w-md">
          We&apos;re working hard to bring you this feature. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
