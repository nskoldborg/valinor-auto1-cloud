import React from "react";
import PropTypes from "prop-types";

export const StatCard = ({ title, value, icon: Icon, color = "blue", active = false }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/30",
    green: "from-green-500 to-green-600 shadow-green-500/30",
    red: "from-red-500 to-red-600 shadow-red-500/30",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/30",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/30",
  };

  return (
    <div
      className={`bg-white/5 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 ${
        active
          ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-200/60 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="text-white text-2xl" />
        </div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(["blue", "green", "red", "purple", "orange"]),
  active: PropTypes.bool,
};