import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaHistory,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaFileUpload,
  FaClock,
  FaDatabase,
  FaSearch,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SecondaryButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Pagination } from "@/components/ui/Pagination";

/* ----------------------------------------------------------
   SKELETON LOADER (Shown instantly on first mount)
---------------------------------------------------------- */
const HistorySkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-xl h-24" />
        ))}
      </div>

      <Card className="p-4 animate-pulse">
        <div className="h-10 bg-white/5 rounded-lg" />
      </Card>

      <Card className="p-6 animate-pulse">
        <div className="h-40 bg-white/5 rounded-lg" />
      </Card>
    </div>
  );
};

/* ----------------------------------------------------------
   MAIN CONTENT (Rendered after logs are ready)
---------------------------------------------------------- */
const HistoryContent = ({
  logs,
  filteredLogs,
  paginatedLogs,
  searchTerm,
  statusFilter,
  setStatusFilter,
  setSearchTerm,
  formatDate,
  t,
  totalUploads,
  successfulUploads,
  failedUploads,
  totalInserted,
  totalUpdated,
  currentPage,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  fetchLogs,
  loading,
}) => {
  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div onClick={() => setStatusFilter("all")} className="cursor-pointer">
          <StatCard
            title={t("Total Uploads")}
            value={totalUploads}
            icon={FaFileUpload}
            color="blue"
            active={statusFilter === "all"}
          />
        </div>
        <div
          onClick={() => setStatusFilter("success")}
          className="cursor-pointer"
        >
          <StatCard
            title={t("Successful")}
            value={successfulUploads}
            icon={FaCheckCircle}
            color="green"
            active={statusFilter === "success"}
          />
        </div>
        <div
          onClick={() => setStatusFilter("failed")}
          className="cursor-pointer"
        >
          <StatCard
            title={t("Failed")}
            value={failedUploads}
            icon={FaTimesCircle}
            color="red"
            active={statusFilter === "failed"}
          />
        </div>
        <div className="opacity-50 cursor-not-allowed">
          <StatCard
            title={t("Total Inserted")}
            value={totalInserted}
            icon={FaDatabase}
            color="purple"
          />
        </div>
        <div className="opacity-50 cursor-not-allowed">
          <StatCard
            title={t("Total Updated")}
            value={totalUpdated}
            icon={FaDatabase}
            color="orange"
          />
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-blue-400/50" />
          </div>
          <input
            type="text"
            placeholder={t(
              "Search by uploader, file name, or message..."
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH width="60px">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    {t("ID")}
                  </div>
                </TH>
                <TH width="150px">{t("Uploader")}</TH>
                <TH width="200px">{t("File Name")}</TH>
                <TH width="80px" align="center">
                  {t("Inserted")}
                </TH>
                <TH width="80px" align="center">
                  {t("Updated")}
                </TH>
                <TH width="80px" align="center">
                  {t("Rows")}
                </TH>
                <TH width="100px" align="center">
                  {t("Duration")}
                </TH>
                <TH width="100px" align="center">
                  {t("Status")}
                </TH>
                <TH width="250px">{t("Message")}</TH>
                <TH width="160px">{t("Created At")}</TH>
              </tr>
            </THead>

            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TRow key={log.id}>
                    <TD>
                      <Badge variant="info">{log.id}</Badge>
                    </TD>
                    <TD className="font-semibold text-white">
                      {log.uploader_name}
                    </TD>
                    <TD className="text-blue-200/70 text-sm" title={log.file_name}>
                      <div className="truncate max-w-[200px]">{log.file_name}</div>
                    </TD>
                    <TD align="center">
                      <Badge variant="success" size="sm">
                        {log.inserted_count ?? 0}
                      </Badge>
                    </TD>
                    <TD align="center">
                      <Badge variant="warning" size="sm">
                        {log.updated_count ?? 0}
                      </Badge>
                    </TD>
                    <TD align="center" className="text-blue-200/70 text-sm">
                      {log.row_count ?? "-"}
                    </TD>
                    <TD align="center">
                      <div className="flex items-center justify-center gap-1 text-blue-200/70 text-sm">
                        <FaClock className="text-xs" />
                        <span>{log.duration_seconds ?? "-"}s</span>
                      </div>
                    </TD>
                    <TD align="center">
                      {log.status === "success" ? (
                        <Badge variant="success" icon={FaCheckCircle}>
                          {t("Success")}
                        </Badge>
                      ) : (
                        <Badge variant="danger" icon={FaTimesCircle}>
                          {t("Failed")}
                        </Badge>
                      )}
                    </TD>
                    <TD className="text-blue-200/70 text-sm" title={log.message}>
                      <div className="truncate max-w-[250px]">
                        {log.message || (
                          <span className="text-blue-400/30">-</span>
                        )}
                      </div>
                    </TD>
                    <TD className="text-blue-200/60 text-sm font-mono">
                      {formatDate(log.created_at)}
                    </TD>
                  </TRow>
                ))
              ) : (
                <TRow>
                  <TD colSpan="10" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaHistory className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">
                        {t("No upload history found")}
                      </p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t(
                              "Upload history will appear here after your first batch upload."
                            )}
                      </p>
                    </div>
                  </TD>
                </TRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-200/60">
          {t("Showing")}{" "}
          <span className="font-semibold text-blue-100">{startIndex + 1}</span>{" "}
          {t("to")}{" "}
          <span className="font-semibold text-blue-100">
            {Math.min(endIndex, filteredLogs.length)}
          </span>{" "}
          {t("of")}{" "}
          <span className="font-semibold text-blue-100">
            {filteredLogs.length}
          </span>{" "}
          {t("uploads")}
        </p>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </>
  );
};

/* ----------------------------------------------------------
   PAGE WRAPPER (Renders instantly with skeleton)
---------------------------------------------------------- */
const BatchUploaderHistory = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const token = localStorage.getItem("token");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "http://10.46.0.140:8650/batch-upload/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Failed to fetch history"));
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ---------- Memoized Filtering ----------
  const filteredLogs = useMemo(() => {
    let f = logs;

    if (statusFilter === "success") {
      f = f.filter((l) => l.status === "success");
    } else if (statusFilter === "failed") {
      f = f.filter((l) => l.status !== "success");
    }

    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      f = f.filter(
        (log) =>
          log.uploader_name?.toLowerCase().includes(st) ||
          log.file_name?.toLowerCase().includes(st) ||
          log.message?.toLowerCase().includes(st)
      );
    }

    return f;
  }, [logs, searchTerm, statusFilter]);

  // ---------- Memoized Stats ----------
  const {
    totalUploads,
    successfulUploads,
    failedUploads,
    totalInserted,
    totalUpdated,
  } = useMemo(() => {
    return {
      totalUploads: logs.length,
      successfulUploads: logs.filter((l) => l.status === "success").length,
      failedUploads: logs.filter((l) => l.status !== "success").length,
      totalInserted: logs.reduce(
        (s, l) => s + (l.inserted_count || 0),
        0
      ),
      totalUpdated: logs.reduce(
        (s, l) => s + (l.updated_count || 0),
        0
      ),
    };
  }, [logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Stockholm",
    }).format(date);
  };

  return (
    <Protected role="route:batch-uploader#history">
      <PageLayout
        title={t("Batch Upload History")}
        description={t(
          "View details about previous batch uploads and their outcomes."
        )}
        actions={
          <SecondaryButton
            onClick={fetchLogs}
            disabled={loading}
            icon={FaSync}
          >
            {t("Refresh")}
          </SecondaryButton>
        }
        error={error}
      >
        {loading && logs.length === 0 ? (
          <HistorySkeleton />
        ) : (
          <HistoryContent
            logs={logs}
            filteredLogs={filteredLogs}
            paginatedLogs={paginatedLogs}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setSearchTerm={setSearchTerm}
            formatDate={formatDate}
            t={t}
            totalUploads={totalUploads}
            successfulUploads={successfulUploads}
            failedUploads={failedUploads}
            totalInserted={totalInserted}
            totalUpdated={totalUpdated}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            fetchLogs={fetchLogs}
            loading={loading}
          />
        )}
      </PageLayout>
    </Protected>
  );
};

export default BatchUploaderHistory;