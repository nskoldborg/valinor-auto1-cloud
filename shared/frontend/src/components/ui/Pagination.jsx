import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 bg-white/5 border border-white/10 rounded-lg text-blue-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
      >
        <FaChevronLeft className="text-sm" />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            currentPage === page
              ? "bg-blue-500 text-white"
              : "bg-white/5 border border-white/10 text-blue-400 hover:bg-white/10"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 bg-white/5 border border-white/10 rounded-lg text-blue-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
      >
        <FaChevronRight className="text-sm" />
      </button>
    </div>
  );
};