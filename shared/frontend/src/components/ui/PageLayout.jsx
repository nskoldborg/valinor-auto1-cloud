import React from "react";
import PropTypes from "prop-types";
import { PageHeader } from "./PageHeader";

/**
 * Main page layout wrapper - provides consistent background, padding, and structure
 * Use this as the outermost wrapper for all pages
 */
const PageLayout = ({ 
  title, 
  description, 
  actions, 
  children, 
  maxWidth = "1600",
  showHeader = true,
  loading = false,
  error = null,
  emptyState = null,
  className = ""
}) => {
  const maxWidthClasses = {
    "1400": "max-w-[1400px]",
    "1600": "max-w-[1600px]",
    "1800": "max-w-[1800px]",
    "full": "max-w-full",
  };

  const containerClass = maxWidthClasses[maxWidth] || "max-w-[1600px]";

  return (
    <div
      className="min-h-screen relative overflow-auto"
      style={{
        background: "linear-gradient(135deg, #0a1929 0%, #0d2847 50%, #0f3460 100%)",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content - Added pt-24 for top spacing from navbar */}
      <div className={`relative z-10 ${containerClass} mx-auto px-0 pt-28 pb-8 ${className}`}>
        {/* Page Header */}
        {showHeader && title && (
          <PageHeader
            title={title}
            description={description}
            actions={actions}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-blue-200">Loading...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xl">⚠</span>
              </div>
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-200/70 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {emptyState && !loading && !error && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            {emptyState}
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && !emptyState && children}

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 mt-8">
          <p className="text-blue-200/50 text-sm">
            © {new Date().getFullYear()} Valinor Application
          </p>
        </div>
      </div>
    </div>
  );
};

PageLayout.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(["1400", "1600", "1800", "full"]),
  showHeader: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyState: PropTypes.node,
  className: PropTypes.string,
};

export default PageLayout;