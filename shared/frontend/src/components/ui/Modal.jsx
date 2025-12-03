import React from "react";
import { FaTimes } from "react-icons/fa";

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = "max-w-2xl",
  closeOnBackdrop = true 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-[#0d1f33] border border-white/10 rounded-2xl w-full ${maxWidth} shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-blue-400/50 hover:text-blue-400 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};