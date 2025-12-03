import React from "react";

export const Badge = ({ 
  children, 
  variant = "default", // "default" | "success" | "warning" | "danger" | "info"
  className = "" 
}) => {
  const variants = {
    default: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",

    basic_roles: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    basic_groups: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    basic_positions: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    basic_datasource: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    assigned_options: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    assignable_options: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",

    tag_cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    tag_blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tag_green: "bg-green-500/20 text-green-400 border-green-500/30",
    tag_yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    tag_red: "bg-red-500/20 text-red-400 border-red-500/30",
    tag_orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    tag_purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    tag_pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    tag_black: "bg-black-500/20 text-white-400 border-black-500/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Priority Badge (specific for tasks)
export const PriorityBadge = ({ priority }) => {
  const variants = {
    high: "danger",
    medium: "warning",
    low: "success"
  };

  return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
};