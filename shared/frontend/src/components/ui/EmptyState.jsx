import React from "react";
import { FaInbox } from "react-icons/fa";

export const EmptyState = ({
  icon: Icon = FaInbox,
  title = "No data found",
  description = "There are no items to display at this time.",
  action,
  actionLabel,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {/* Icon */}
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
        <Icon className="text-blue-400/50 text-3xl" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-blue-200/60 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Optional Action Button */}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Alternative: Compact empty state
export const CompactEmptyState = ({
  icon: Icon = FaInbox,
  message = "No items found",
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
        <Icon className="text-blue-400/50 text-lg" />
      </div>
      <p className="text-blue-200/60 font-medium">{message}</p>
    </div>
  );
};

// Alternative: Empty state with illustration
export const IllustratedEmptyState = ({
  title = "Nothing here yet",
  description = "Get started by creating your first item.",
  action,
  actionLabel = "Get Started",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 ${className}`}>
      {/* Illustration placeholder - you can replace with actual SVG */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border-2 border-white/10">
          <FaInbox className="text-blue-400/50 text-5xl" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      {description && (
        <p className="text-blue-200/60 text-center max-w-md mb-8">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action}
          className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative">{actionLabel}</span>
        </button>
      )}
    </div>
  );
};