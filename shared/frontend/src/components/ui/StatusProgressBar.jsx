// src/components/ui/StatusProgressBar.jsx
import React from "react";

/**
 * Unified Progress Bar for dark UI
 * Works in both page and table contexts
 */
const StatusProgressBar = ({
  stages = [],
  currentStatus = "",
  activeColor = "#3b82f6", // Blue-500
  inactiveColor = "rgba(255, 255, 255, 0.1)",
  textActiveColor = "#93c5fd", // Blue-300
  textInactiveColor = "rgba(147, 197, 253, 0.3)",
  compact = false,
}) => {
  const currentIndex = stages.findIndex((s) => s === currentStatus);

  return (
    <div
      className={`flex items-center justify-center ${
        compact ? "my-2" : "my-4"
      } w-full`}
    >
      {stages.map((stage, i) => (
        <React.Fragment key={stage}>
          {/* Circle + Label */}
          <div
            className="flex flex-col items-center text-center mx-2 flex-shrink-0"
            style={{
              width: compact ? "70px" : "90px",
              minHeight: compact ? "56px" : "64px",
            }}
          >
            {/* Circle */}
            <div
              className={`flex items-center justify-center rounded-full font-semibold transition-all ${
                compact ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
              }`}
              style={{
                backgroundColor: i <= currentIndex ? activeColor : inactiveColor,
                color: i <= currentIndex ? "#ffffff" : "rgba(147, 197, 253, 0.5)",
                border: i <= currentIndex ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {i + 1}
            </div>

            {/* Label */}
            <div
              className={`leading-tight break-words ${
                compact ? "text-[9px]" : "text-[10px]"
              } font-medium transition-all`}
              style={{
                color: i <= currentIndex ? textActiveColor : textInactiveColor,
                lineHeight: compact ? "1rem" : "1.1rem",
                height: compact ? "1.8rem" : "2.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                maxWidth: compact ? "70px" : "80px",
              }}
            >
              {stage}
            </div>
          </div>

          {/* Connector Line (between steps) */}
          {i < stages.length - 1 && (
            <div
              className={`flex-1 ${compact ? "mx-0.5" : "mx-1"} transition-all`}
              style={{
                height: compact ? "1.5px" : "2px",
                backgroundColor: i < currentIndex ? activeColor : inactiveColor,
              }}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StatusProgressBar;