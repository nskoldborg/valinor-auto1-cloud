import React from "react";

// Table Container with Card Styling
export const TableCard = ({ children, title, icon: Icon, badge, actions, className = "" }) => (
  <div className={`bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="text-blue-400 text-xl" />}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {badge && (
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400 font-medium">
              {badge}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    )}
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

// Table
export const Table = ({ children, className = "" }) => (
  <table className={`w-full ${className}`}>
    {children}
  </table>
);

// Table Head
export const THead = ({ children, className = "" }) => (
  <thead className={`bg-white/5 border-b border-white/10 ${className}`}>
    {children}
  </thead>
);

// Table Header Cell
export const TH = ({ children, width, className = "" }) => (
  <th
    style={{ width }}
    className={`px-6 py-4 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

// Table Row
export const TRow = ({ children, className = "", onClick }) => (
  <tr
    onClick={onClick}
    className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-150 ${
      onClick ? "cursor-pointer" : ""
    } ${className}`}
  >
    {children}
  </tr>
);

// Table Data Cell
export const TD = ({ children, className = "", colSpan }) => (
  <td
    colSpan={colSpan}
    className={`px-6 py-3 text-sm text-blue-200/70 ${className}`}
  >
    {children}
  </td>
);

// Empty State for Tables
export const TableEmptyState = ({ message, icon: Icon }) => (
  <TRow>
    <TD colSpan="100" className="text-center py-8">
      <div className="flex flex-col items-center gap-3">
        {Icon && (
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Icon className="text-blue-400/40 text-xl" />
          </div>
        )}
        <p className="text-blue-400/30">{message}</p>
      </div>
    </TD>
  </TRow>
);

// Loading State for Tables
export const TableLoadingState = ({ colSpan = 8, message = "Loading..." }) => (
  <TRow>
    <TD colSpan={colSpan} className="text-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/30 border-t-blue-500"></div>
        <p className="text-blue-400/50">{message}</p>
      </div>
    </TD>
  </TRow>
);
