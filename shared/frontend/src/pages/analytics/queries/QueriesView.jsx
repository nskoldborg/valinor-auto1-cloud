import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaTimes,
  FaTable,
  FaTag,
  FaDatabase,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaClock,
  FaUser,
  FaGlobe,
  FaEyeSlash,
  FaDownload,
  FaChartBar,
  FaPlus,
  FaSync,
  FaEllipsisV,
  FaCopy,
  FaArchive,
  FaLock,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const QueriesView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [query, setQuery] = useState(null);
  const [datasource, setDatasource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Tag input
  const [tagInput, setTagInput] = useState("");

  // PostgreSQL Logo Component
  const PostgresLogo = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      <path
        d="M17.128 2.513c-1.216 0-2.197.98-2.197 2.197 0 .362.088.703.244 1.003-.244-.088-.513-.137-.794-.137-1.216 0-2.197.98-2.197 2.197 0 .362.088.703.244 1.003-.244-.088-.513-.137-.794-.137-1.216 0-2.197.98-2.197 2.197v9.164c0 1.216.98 2.197 2.197 2.197h6.591c1.216 0 2.197-.98 2.197-2.197V4.71c0-1.216-.98-2.197-2.197-2.197h-1.097z"
        fill="#336791"
      />
      <path
        d="M11.634 11.639c-.244-.088-.513-.137-.794-.137-1.216 0-2.197.98-2.197 2.197v6.301c0 1.216.98 2.197 2.197 2.197h1.097c1.216 0 2.197-.98 2.197-2.197v-6.301c0-.362-.088-.703-.244-1.003.244.088.513.137.794.137.362 0 .703-.088 1.003-.244v7.408c0 1.216.98 2.197 2.197 2.197h1.097c1.216 0 2.197-.98 2.197-2.197V4.71c0-1.216-.98-2.197-2.197-2.197h-1.097c-1.216 0-2.197.98-2.197 2.197v6.929z"
        fill="#336791"
      />
    </svg>
  );

  // ------------------------------------------------------------
  // Fetch query details
  // ------------------------------------------------------------
  const fetchQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch queries");
      }

      const foundQuery = data.find(q => q.id === parseInt(id));
      
      if (!foundQuery) {
        setQuery(null);
        setLoading(false);
        return;
      }

      setQuery(foundQuery);
      setTempName(foundQuery.name);

      // Fetch datasource details if datasource_id exists
      if (foundQuery.datasource_id) {
        try {
          const dsRes = await fetch(
            `http://10.46.0.140:8650/analytics/resources/${foundQuery.datasource_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const dsData = await dsRes.json();
          if (dsRes.ok) {
            setDatasource(dsData);
          }
        } catch (err) {
          console.error("Error loading datasource:", err);
        }
      }
    } catch (err) {
      console.error("Error loading query:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Query"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ------------------------------------------------------------
  // Update query name
  // ------------------------------------------------------------
  const handleSaveName = async () => {
    if (!tempName.trim() || tempName === query.name) {
      setEditingName(false);
      setTempName(query.name);
      return;
    }

    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: tempName.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update name");
      }

      setQuery(prev => ({ ...prev, name: tempName.trim() }));
      setEditingName(false);
      setMessage({
        type: "success",
        message: t("Name Updated"),
        description: t("Query name updated successfully"),
      });
    } catch (err) {
      console.error("Error updating name:", err);
      setMessage({
        type: "error",
        message: t("Update Failed"),
        description: err.message,
      });
      setTempName(query.name);
      setEditingName(false);
    }
  };

  // ------------------------------------------------------------
  // Execute query
  // ------------------------------------------------------------
  const handleExecuteQuery = async () => {
    if (!query || !query.datasource_id) {
      setMessage({
        type: "error",
        message: t("Cannot Execute Query"),
        description: t("No datasource configured for this query"),
      });
      return;
    }

    setExecuting(true);
    setMessage(null);
    setQueryResults(null);
    setExecutionTime(null);
    setCurrentPage(1);

    const startTime = performance.now();

    try {
      const res = await fetch(
        `http://10.46.0.140:8650/analytics/resources/${query.datasource_id}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sql: query.sql_text }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Query execution failed");
      }

      const data = await res.json();
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      setQueryResults(data);
      setExecutionTime(duration);
      
      // Update last_executed_at in the query object
      setQuery(prev => ({
        ...prev,
        last_executed_at: new Date().toISOString()
      }));

      setMessage({
        type: "success",
        message: t("Query Executed Successfully"),
        description: `${t("Returned")} ${data.rows?.length || 0} ${t("rows in")} ${duration}s`,
      });
    } catch (err) {
      console.error("Query execution error:", err);
      setMessage({
        type: "error",
        message: t("Query Execution Failed"),
        description: err.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  // ------------------------------------------------------------
  // Update query tags
  // ------------------------------------------------------------
  const handleAddTag = async () => {
    if (!tagInput.trim() || query.tags.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }

    const newTags = [...query.tags, tagInput.trim()];
    
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: newTags }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update tags");
      }

      setQuery(prev => ({ ...prev, tags: newTags }));
      setTagInput("");
      setMessage({
        type: "success",
        message: t("Tag Added"),
        description: t("Tag added successfully"),
      });
    } catch (err) {
      console.error("Error adding tag:", err);
      setMessage({
        type: "error",
        message: t("Update Failed"),
        description: err.message,
      });
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const newTags = query.tags.filter(tag => tag !== tagToRemove);
    
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: newTags }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update tags");
      }

      setQuery(prev => ({ ...prev, tags: newTags }));
      setMessage({
        type: "success",
        message: t("Tag Removed"),
        description: t("Tag removed successfully"),
      });
    } catch (err) {
      console.error("Error removing tag:", err);
      setMessage({
        type: "error",
        message: t("Update Failed"),
        description: err.message,
      });
    }
  };

  // ------------------------------------------------------------
  // Toggle publish status
  // ------------------------------------------------------------
  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_published: !query.is_published }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update publish status");
      }

      setQuery(prev => ({ ...prev, is_published: !prev.is_published }));
      setMessage({
        type: "success",
        message: query.is_published ? t("Query Unpublished") : t("Query Published"),
        description: query.is_published 
          ? t("Query is now private") 
          : t("Query is now visible to all users"),
      });
    } catch (err) {
      console.error("Error toggling publish:", err);
      setMessage({
        type: "error",
        message: t("Update Failed"),
        description: err.message,
      });
    } finally {
      setPublishing(false);
    }
  };

  // ------------------------------------------------------------
  // Fork query
  // ------------------------------------------------------------
  const handleFork = async () => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${query.name} (Copy)`,
          datasource_id: query.datasource_id,
          sql_text: query.sql_text,
          is_published: false,
          is_archived: false,
          tags: query.tags || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fork query");

      setMessage({
        type: "success",
        message: t("Query Forked"),
        description: t("A copy of this query has been created"),
      });

      setTimeout(() => {
        navigate(`/analytics/queries/${data.id}/edit`);
      }, 1500);
    } catch (err) {
      console.error("Error forking query:", err);
      setMessage({
        type: "error",
        message: t("Fork Failed"),
        description: err.message,
      });
    }
    setShowActionsMenu(false);
  };

  // ------------------------------------------------------------
  // Archive query
  // ------------------------------------------------------------
  const handleArchive = async () => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/analytics/queries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          is_archived: true,
          is_published: false 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to archive query");
      }

      setMessage({
        type: "success",
        message: t("Query Archived"),
        description: t("Query has been archived and unpublished"),
      });

      setTimeout(() => {
        navigate("/analytics/queries");
      }, 1500);
    } catch (err) {
      console.error("Error archiving query:", err);
      setMessage({
        type: "error",
        message: t("Archive Failed"),
        description: err.message,
      });
    }
    setShowActionsMenu(false);
  };

  // ------------------------------------------------------------
  // Download results
  // ------------------------------------------------------------
  const handleDownload = (format) => {
    if (!queryResults?.rows || queryResults.rows.length === 0) {
      setMessage({
        type: "error",
        message: t("No Data"),
        description: t("No results to download"),
      });
      return;
    }

    // TODO: Implement actual download logic
    console.log(`Download as ${format}`);
    setMessage({
      type: "info",
      message: t("Download"),
      description: t(`Download as ${format.toUpperCase()} - Coming soon`),
    });
  };

  // ------------------------------------------------------------
  // Create Reppy (placeholder)
  // ------------------------------------------------------------
  const handleCreateReppy = () => {
    // TODO: Open modal for creating a Reppy
    console.log("Create Reppy");
    setMessage({
      type: "info",
      message: t("Create Reppy"),
      description: t("Reppy creation - Coming soon"),
    });
  };

  // ------------------------------------------------------------
  // Permissions (placeholder)
  // ------------------------------------------------------------
  const handlePermissions = () => {
    console.log("Manage Permissions");
    setMessage({
      type: "info",
      message: t("Permissions"),
      description: t("Permission management - Coming soon"),
    });
    setShowActionsMenu(false);
  };

  // ------------------------------------------------------------
  // Format date
  // ------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t("just now");
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? t("hour ago") : t("hours ago")}`;
    if (diffInDays === 1) return t("yesterday");
    if (diffInDays < 7) return `${diffInDays} ${t("days ago")}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${t("weeks ago")}`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ${t("months ago")}`;
    return `${Math.floor(diffInDays / 365)} ${t("years ago")}`;
  };

  // ------------------------------------------------------------
  // Pagination helpers
  // ------------------------------------------------------------
  const getPaginatedRows = () => {
    if (!queryResults?.rows) return [];
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return queryResults.rows.slice(startIndex, endIndex);
  };

  const totalPages = queryResults?.rows
    ? Math.ceil(queryResults.rows.length / rowsPerPage)
    : 0;

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // ------------------------------------------------------------
  // Render results table
  // ------------------------------------------------------------
  const renderResultsTable = () => {
    if (!queryResults || !queryResults.rows || queryResults.rows.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTable className="text-blue-400/60 text-2xl" />
          </div>
          <p className="text-blue-200/60">{t("No data")}</p>
        </div>
      );
    }

    const columns = queryResults.columns || Object.keys(queryResults.rows[0]);
    const paginatedRows = getPaginatedRows();

    return (
      <>
        {/* Fixed height scrollable table */}
        <div className="overflow-auto" style={{ maxHeight: "500px" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0B1437] z-10">
              <tr className="border-b border-white/10">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="text-left px-4 py-3 font-semibold text-blue-200 bg-white/5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 text-blue-100">
                      {row[col] !== null && row[col] !== undefined
                        ? String(row[col])
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <div className="text-sm text-blue-200">
              {t("Showing")} {(currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, queryResults.rows.length)} {t("of")}{" "}
              {queryResults.rows.length} {t("rows")}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="text-blue-300 text-xs" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-500 text-white"
                          : "bg-white/5 text-blue-200 hover:bg-white/10"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronRight className="text-blue-300 text-xs" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading) {
    return (
      <Protected role="route:analytics#queries-view">
        <PageLayout title={t("Loading Query...")} loading={true} />
      </Protected>
    );
  }

  if (!query) {
    return (
      <Protected role="route:analytics#queries-view">
        <PageLayout title={t("Query Not Found")}>
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaDatabase className="text-blue-400/60 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t("Query Not Found")}
              </h3>
              <p className="text-blue-200/60 mb-6">
                {t("The query you're looking for doesn't exist or has been deleted.")}
              </p>
              <PrimaryButton onClick={() => navigate("/analytics/queries")}>
                {t("Back to Queries")}
              </PrimaryButton>
            </div>
          </Card>
        </PageLayout>
      </Protected>
    );
  }

  return (
    <Protected role="route:analytics#queries-view">
      <PageLayout
        title={
          <div className="flex items-center gap-4 flex-wrap">
            {editingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setTempName(query.name);
                  }
                }}
                autoFocus
                className="bg-transparent border-b-2 border-blue-400 text-2xl font-semibold text-white focus:outline-none px-2 py-1"
                style={{ minWidth: "200px", maxWidth: "500px" }}
              />
            ) : (
              <span
                onClick={() => setEditingName(true)}
                className="text-2xl font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors px-2 py-1"
              >
                {query.name}
              </span>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {query.tags && query.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30"
                >
                  <FaTag className="text-xs" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder={t("Add tag...")}
                  className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
                  style={{ width: "120px" }}
                />
                <button
                  onClick={handleAddTag}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title={t("Add tag")}
                >
                  <FaPlus className="text-blue-300 text-xs" />
                </button>
              </div>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-3">
            <SecondaryButton onClick={handleExecuteQuery} icon={FaSync} disabled={executing}>
              {executing ? t("Refreshing...") : t("Refresh Query")}
            </SecondaryButton>
            
            {publishing ? (
              <SecondaryButton disabled>
                <LoadingSpinner size="sm" className="mr-2" />
                {t("Updating...")}
              </SecondaryButton>
            ) : (
              <SecondaryButton
                onClick={handleTogglePublish}
                icon={query.is_published ? FaEyeSlash : FaGlobe}
              >
                {query.is_published ? t("Unpublish") : t("Publish")}
              </SecondaryButton>
            )}
            
            <PrimaryButton 
              onClick={() => navigate(`/analytics/queries/${id}/edit`)} 
              icon={FaEdit}
            >
              {t("Edit Query")}
            </PrimaryButton>

            {/* Actions Menu */}
            <div className="relative">
              <SecondaryButton
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                icon={FaEllipsisV}
              />

              {showActionsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 bg-[#1a2744] border border-white/10 rounded-lg shadow-xl z-50 min-w-[180px]">
                    <button
                      onClick={handleFork}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-white/5 transition-colors first:rounded-t-lg"
                    >
                      <FaCopy className="text-blue-400" />
                      {t("Fork")}
                    </button>
                    <button
                      onClick={handleArchive}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-white/5 transition-colors"
                    >
                      <FaArchive className="text-orange-400" />
                      {t("Archive")}
                    </button>
                    <button
                      onClick={handlePermissions}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-white/5 transition-colors last:rounded-b-lg"
                    >
                      <FaLock className="text-purple-400" />
                      {t("Permissions")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      >
        {message && (
          <div className="mb-6">
            <Alert
              type={message.type}
              message={message.message}
              description={message.description}
              onClose={() => setMessage(null)}
            />
          </div>
        )}

        {/* Query Results */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <FaTable className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Results")}
              </h3>
            </div>

            {queryResults && queryResults.rows && queryResults.rows.length > 0 && (
              <div className="flex items-center gap-3 text-sm text-blue-200">
                <span>
                  {queryResults.rows.length} {t("rows")}
                </span>
                {executionTime && (
                  <span className="text-blue-300/70">
                    • {executionTime}s
                  </span>
                )}
              </div>
            )}
          </div>

          {renderResultsTable()}

          {/* Action Buttons */}
          {queryResults && queryResults.rows && queryResults.rows.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              {/* Left - Download & Reppy */}
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <SecondaryButton icon={FaDownload}>
                    {t("Download")}
                  </SecondaryButton>
                  <div className="absolute left-0 bottom-full mb-2 bg-[#1a2744] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleDownload("csv")}
                      className="block w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-white/5 transition-colors first:rounded-t-lg whitespace-nowrap"
                    >
                      {t("Download as CSV")}
                    </button>
                    <button
                      onClick={() => handleDownload("xlsx")}
                      className="block w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-white/5 transition-colors last:rounded-b-lg whitespace-nowrap"
                    >
                      {t("Download as XLSX")}
                    </button>
                  </div>
                </div>

                <SecondaryButton onClick={handleCreateReppy} icon={FaChartBar}>
                  {t("Create Reppy")}
                </SecondaryButton>
              </div>

              {/* Right - Last Refreshed */}
              <div className="flex items-center gap-2 text-sm text-blue-200/60">
                <FaClock className="text-blue-400/60" />
                <span>
                  {t("Refreshed")} {query.last_executed_at ? getTimeAgo(query.last_executed_at) : t("never")}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Metadata Card */}
        <Card>
          <div className="flex items-start justify-between">
            {/* Left side - Created/Updated */}
            <div className="space-y-2">
              {query.created_at && (
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <FaUser className="text-blue-400/60" />
                  <span>
                    <span className="font-medium text-white">System User</span> {t("created")} {getTimeAgo(query.created_at)}
                  </span>
                </div>
              )}
              {query.updated_at && (
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <FaUser className="text-blue-400/60" />
                  <span>
                    <span className="font-medium text-white">System User</span> {t("updated")} {getTimeAgo(query.updated_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Datasource & Refresh Schedule */}
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-end gap-4 text-sm text-blue-200">
                {datasource && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200/60">{t("Data Source")}:</span>
                    <PostgresLogo />
                    <span className="font-medium text-white">{datasource.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-blue-200/60">{t("Refresh Schedule")}:</span>
                  <span className="font-medium text-white">
                    {query.refresh_schedule || t("Never")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageLayout>
    </Protected>
  );
};

export default QueriesView;