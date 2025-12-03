import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaDatabase,
  FaPlay,
  FaSave,
  FaTimes,
  FaTable,
  FaSearch,
  FaSync,
  FaChevronRight,
  FaChevronDown,
  FaColumns,
  FaPlus,
  FaTag,
  FaMagic,
  FaCog,
  FaChevronLeft,
} from "react-icons/fa";
import Editor from "@monaco-editor/react";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormCheckbox } from "@/components/ui/FormCheckbox";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const QueriesCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [datasources, setDatasources] = useState([]);
  const [selectedDatasource, setSelectedDatasource] = useState(null);
  const [schema, setSchema] = useState([]);
  const [expandedTables, setExpandedTables] = useState({});
  const [schemaSearch, setSchemaSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  // 👉 ID of the query once it's been saved (used by execute)
  const [savedQueryId, setSavedQueryId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Resizable editor
  const [editorHeight, setEditorHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const editorRef = useRef(null);

  const [form, setForm] = useState({
    name: "New Query",
    tags: [],
    sql_query: "-- Write your SQL query here\nSELECT * FROM your_table LIMIT 1000;",
    is_published: false,
    limit: true,
  });

  const [tagInput, setTagInput] = useState("");

  // ------------------------------------------------------------
  // PostgreSQL Logo Component (Simple SVG)
  // ------------------------------------------------------------
  const PostgresLogo = () => (
    <svg
      width="16"
      height="16"
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
  // Fetch datasources
  // ------------------------------------------------------------
  const fetchDatasources = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://10.46.0.140:8650/analytics/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch datasources");

      const dsOptions = data.map((ds) => ({
        value: ds.id,
        label: ds.name, // Removed the type from label
        type: ds.type || "postgresql",
      }));

      setDatasources(dsOptions);
      if (dsOptions.length > 0) setSelectedDatasource(dsOptions[0]);
    } catch (err) {
      console.error("Error loading datasources:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Datasources"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Fetch schema for selected datasource
  // ------------------------------------------------------------
  const fetchSchema = async (datasourceId) => {
    if (!datasourceId) return;

    setLoadingSchema(true);
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/analytics/resources/${datasourceId}/schema`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch schema");

      setSchema(data.tables || []);
    } catch (err) {
      console.error("Error loading schema:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Schema"),
        description: err.message,
      });
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    fetchDatasources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDatasource) {
      fetchSchema(selectedDatasource.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasource]);

  // ------------------------------------------------------------
  // Handle resizing
  // ------------------------------------------------------------
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newHeight =
        e.clientY - resizeRef.current.getBoundingClientRect().top;
      if (newHeight > 200 && newHeight < 800) {
        setEditorHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ------------------------------------------------------------
  // Execute query
  // ------------------------------------------------------------
  const handleExecuteQuery = async () => {
    if (!selectedDatasource) {
      setMessage({
        type: "warning",
        message: t("No Datasource Selected"),
        description: t("Please select a datasource before executing the query."),
      });
      return;
    }

    if (!form.sql_query.trim()) {
      setMessage({
        type: "warning",
        message: t("Empty Query"),
        description: t("Please write a SQL query before executing."),
      });
      return;
    }

    setExecuting(true);
    setMessage(null);
    setQueryResults(null);
    setExecutionTime(null);
    setCurrentPage(1);

    try {
      let queryId = savedQueryId;

      // ✅ If the query hasn't been saved yet, save it first
      if (!queryId) {
        const payload = {
          name: form.name,
          datasource_id: selectedDatasource.value,
          sql_text: form.sql_query,
          is_published: form.is_published,
          is_archived: false,
          tags: form.tags || [],
        };

        const saveRes = await fetch(
          "http://10.46.0.140:8650/analytics/queries",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const saveData = await saveRes.json();
        if (!saveRes.ok)
          throw new Error(saveData.detail || "Failed to save query");
        queryId = saveData.id;
        setSavedQueryId(queryId);
      }

      // ✅ Now execute via the cache-aware backend endpoint
      const execRes = await fetch(
        `http://10.46.0.140:8650/analytics/queries/${queryId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const execData = await execRes.json();
      if (!execRes.ok) throw new Error(execData.detail || "Execution failed");

      // ✅ Set runtime metrics
      setQueryResults(execData);
      setExecutionTime(execData.execution_time);

      const meta = [
        `${execData.cached ? "Cached Result" : "Executed Live"}`,
        `${execData.row_count ?? 0} rows`,
        `${execData.row_scanned ?? "?"} scanned`,
        `${execData.execution_time?.toFixed?.(2) ?? "?"}s runtime`,
      ].join(" • ");

      setMessage({
        type: execData.cached ? "info" : "success",
        message: t("Query Executed Successfully"),
        description: meta,
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
  // Save query
  // ------------------------------------------------------------
  const handleSaveQuery = async () => {
    if (!form.name.trim()) {
      setMessage({
        type: "warning",
        message: t("Missing Query Name"),
        description: t("Please provide a name for the query."),
      });
      return;
    }

    if (!selectedDatasource) {
      setMessage({
        type: "warning",
        message: t("No Datasource Selected"),
        description: t("Please select a datasource."),
      });
      return;
    }

    if (!form.sql_query.trim()) {
      setMessage({
        type: "warning",
        message: t("Empty Query"),
        description: t("Please write a SQL query."),
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: form.name,
        datasource_id: selectedDatasource.value, // ✅ FIXED
        sql_text: form.sql_query, // ✅ FIXED
        is_published: form.is_published,
        is_archived: false, // ✅ optional, backend default
        tags: form.tags || [],
      };

      const res = await fetch("http://10.46.0.140:8650/analytics/queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save query");

      setMessage({
        type: "success",
        message: t("Query Saved"),
        description: t("Query has been saved successfully."),
      });

      setTimeout(() => {
        navigate("/analytics/queries");
      }, 1500);
    } catch (err) {
      console.error("Save query error:", err);
      setMessage({
        type: "error",
        message: t("Save Failed"),
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // Tag management
  // ------------------------------------------------------------
  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  // ------------------------------------------------------------
  // Insert parameter placeholder
  // ------------------------------------------------------------
  const handleInsertParameter = () => {
    const editor = editorRef.current;
    if (editor) {
      const position = editor.getPosition();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      editor.executeEdits("", [
        {
          range: range,
          text: "{{ parameter_name }}",
        },
      ]);

      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + 3,
      });
      editor.focus();
    }
  };

  // ------------------------------------------------------------
  // Format query
  // ------------------------------------------------------------
  const handleFormatQuery = () => {
    const formatted = form.sql_query
      .replace(/\bSELECT\b/gi, "\nSELECT")
      .replace(/\bFROM\b/gi, "\nFROM")
      .replace(/\bWHERE\b/gi, "\nWHERE")
      .replace(/\bJOIN\b/gi, "\nJOIN")
      .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
      .replace(/\bRIGHT JOIN\b/gi, "\nRIGHT JOIN")
      .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN")
      .replace(/\bORDER BY\b/gi, "\nORDER BY")
      .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
      .replace(/\bLIMIT\b/gi, "\nLIMIT")
      .trim();
    setForm({ ...form, sql_query: formatted });
  };

  // ------------------------------------------------------------
  // Toggle table expansion
  // ------------------------------------------------------------
  const toggleTable = (tableName) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  // ------------------------------------------------------------
  // Handle drag start for table names
  // ------------------------------------------------------------
  const handleDragStart = (e, text) => {
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.effectAllowed = "copy";
  };

  // ------------------------------------------------------------
  // Insert text at cursor position
  // ------------------------------------------------------------
  const insertTextAtCursor = (text) => {
    const editor = editorRef.current;
    if (editor) {
      const position = editor.getPosition();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      editor.executeEdits("", [
        {
          range: range,
          text: text,
        },
      ]);

      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + text.length,
      });
      editor.focus();
    }
  };

  const filteredSchema = schema.filter((table) =>
    table.name.toLowerCase().includes(schemaSearch.toLowerCase())
  );

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
  // Render results
  // ------------------------------------------------------------
  const renderResultsTable = () => {
    if (!queryResults || !queryResults.rows || queryResults.rows.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTable className="text-blue-400/60 text-2xl" />
          </div>
          <p className="text-blue-200/60">{t("No results to display.")}</p>
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
              {Math.min(
                currentPage * rowsPerPage,
                queryResults.rows.length
              )}{" "}
              {t("of")} {queryResults.rows.length} {t("rows")}
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
  return (
    <Protected role="route:analytics#queries-create">
      <PageLayout
        title={
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-blue-400 text-2xl font-semibold text-white focus:outline-none px-2 py-1 transition-colors"
              style={{ minWidth: "200px", maxWidth: "500px" }}
            />
            <div className="flex items-center gap-2 flex-wrap">
              {form.tags.map((tag) => (
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
            <SecondaryButton onClick={() => navigate(-1)} icon={FaTimes}>
              {t("Cancel")}
            </SecondaryButton>
          </div>
        }
        loading={loading}
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

        {/* Main layout - Increased sidebar to 420px */}
        <div className="flex gap-6">
          {/* Left Sidebar - Schema Browser - Increased width to 420px */}
          <div className="w-[420px] flex-shrink-0">
            <Card className="h-full">
              <div className="mb-4 pb-4 border-b border-white/10">
                <label className="block text-sm font-medium text-blue-200 mb-2 flex items-center gap-2">
                  <PostgresLogo />
                  {t("Datasource")}
                </label>
                <FormSelect
                  options={datasources}
                  value={selectedDatasource}
                  onChange={setSelectedDatasource}
                  placeholder={t("Select datasource...")}
                />
              </div>

              {/* Schema Search */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/50 text-xs" />
                    <input
                      type="text"
                      value={schemaSearch}
                      onChange={(e) => setSchemaSearch(e.target.value)}
                      placeholder={t("Search schema...")}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={() => fetchSchema(selectedDatasource?.value)}
                    disabled={loadingSchema}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50"
                    title={t("Refresh schema")}
                  >
                    <FaSync
                      className={`text-blue-300 ${
                        loadingSchema ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Schema Tree */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 400px)" }}
              >
                {loadingSchema ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="sm" />
                    <p className="text-blue-200/60 text-sm mt-2">
                      {t("Loading schema...")}
                    </p>
                  </div>
                ) : filteredSchema.length === 0 ? (
                  <div className="text-center py-8">
                    <FaTable className="text-blue-400/40 text-2xl mx-auto mb-2" />
                    <p className="text-blue-200/60 text-sm">
                      {t("No tables found")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredSchema.map((table) => (
                      <div key={table.name}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTable(table.name)}
                            className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded transition-colors text-left"
                          >
                            {expandedTables[table.name] ? (
                              <FaChevronDown className="text-blue-300 text-xs flex-shrink-0" />
                            ) : (
                              <FaChevronRight className="text-blue-300 text-xs flex-shrink-0" />
                            )}
                            <FaTable className="text-blue-400 text-xs flex-shrink-0" />
                            <span
                              className="text-sm text-white font-medium cursor-move truncate"
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, table.name)
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                insertTextAtCursor(table.name);
                              }}
                              title={table.name}
                            >
                              {table.name}
                            </span>
                          </button>
                        </div>

                        {expandedTables[table.name] && table.columns && (
                          <div className="ml-8 mt-1 space-y-1">
                            {table.columns.map((column) => (
                              <div
                                key={column.name}
                                className="flex items-center gap-2 px-3 py-1 text-xs text-blue-200/80 hover:bg-white/5 rounded cursor-move"
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(e, column.name)
                                }
                                onClick={() =>
                                  insertTextAtCursor(column.name)
                                }
                                title={`${column.name} (${column.type})`}
                              >
                                <FaColumns className="text-blue-400/60 flex-shrink-0" />
                                <span className="truncate flex-1">
                                  {column.name}
                                </span>
                                <span className="text-blue-300/50 text-[10px] flex-shrink-0">
                                  {column.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Side - Editor and Results */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* SQL Editor */}
            <Card>
              <div className="mb-4 pb-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaDatabase className="text-blue-400" />
                  {t("SQL Editor")}
                </h3>
              </div>

              <div ref={resizeRef} className="relative">
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <Editor
                    height={`${editorHeight}px`}
                    defaultLanguage="sql"
                    value={form.sql_query}
                    onChange={(value) =>
                      setForm({ ...form, sql_query: value || "" })
                    }
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>

                {/* Resize Handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
                  onMouseDown={() => setIsResizing(true)}
                />
              </div>

              {/* Editor Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleInsertParameter}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-blue-200 transition-colors"
                  >
                    <FaCog className="text-xs" />
                    {t("Parameters")}
                  </button>

                  <button
                    onClick={handleFormatQuery}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-blue-200 transition-colors"
                  >
                    <FaMagic className="text-xs" />
                    {t("Format")}
                  </button>

                  <FormCheckbox
                    label={`${t("Limit")} 1000`}
                    checked={form.limit}
                    onChange={(e) =>
                      setForm({ ...form, limit: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-center gap-3">
                  {executing ? (
                    <PrimaryButton disabled>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t("Executing...")}
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      onClick={handleExecuteQuery}
                      disabled={!selectedDatasource}
                      icon={FaPlay}
                    >
                      {t("Execute")}
                    </PrimaryButton>
                  )}

                  {saving ? (
                    <PrimaryButton disabled className="bg-green-600">
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t("Saving...")}
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      onClick={handleSaveQuery}
                      icon={FaSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {t("Save")}
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </Card>

            {/* Query Results */}
            {queryResults && (
              <Card>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <FaTable className="text-white text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {t("Query Results")}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-blue-200">
                    <span>
                      {queryResults.rows?.length || 0} {t("rows")}
                    </span>
                    {executionTime && (
                      <span className="text-blue-300/70">
                        • {executionTime}s
                      </span>
                    )}
                  </div>
                </div>

                {renderResultsTable()}
              </Card>
            )}
          </div>
        </div>
      </PageLayout>
    </Protected>
  );
};

export default QueriesCreate;