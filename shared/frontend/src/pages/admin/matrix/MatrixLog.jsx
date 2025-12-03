import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaHistory,
  FaSync,
  FaCheckCircle,
  FaUser,
  FaClock,
  FaExchangeAlt,
  FaSearch,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { PrimaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import Protected from "@/components/Protected";

const MatrixLog = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const token = localStorage.getItem("token");

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://10.46.0.140:8650/system/matrix-log", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to load matrix log"));
      }
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      setError(err.message);
      setMessage({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual matrix sync
  const triggerSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("http://10.46.0.140:8650/system/matrix-sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Matrix sync failed"));

      setMessage({
        type: "success",
        message: `${data.message} (${data.timestamp})`,
      });
      fetchLogs(); // refresh log list after sync
    } catch (err) {
      setMessage({ type: "error", message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.object_id?.toString().includes(searchTerm) ||
          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, logs]);

  // Format date to Stockholm time
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

  // Calculate stats
  const totalChanges = logs.length;
  const usersAffected = new Set(logs.map((l) => l.object_id)).size;
  const lastSync = logs.length > 0 ? formatDate(logs[0].created_at) : "-";

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <PageLayout
      title={t("Matrix Log")}
      description={t("Shows the latest updates automatically applied via the Position Matrix Sync.")}
      actions={
        <Protected role="route:matrix#manual-trigger">
          <PrimaryButton
            onClick={triggerSync}
            loading={syncing}
            icon={!syncing && FaSync}
          >
            {t("Run Matrix Sync Now")}
          </PrimaryButton>
        </Protected>
      }
      loading={loading}
      error={error}
    >
      {/* Feedback messages */}
      {message && message.type !== "error" && (
        <div className="mb-6">
          <Alert
            type={message.type}
            message={message.message}
            icon={message.type === "success" ? <FaCheckCircle /> : undefined}
          />
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t("Total Changes")}
          value={totalChanges}
          icon={FaHistory}
          color="blue"
        />
        <StatCard
          title={t("Users Affected")}
          value={usersAffected}
          icon={FaUser}
          color="green"
        />
        <StatCard
          title={t("Last Sync")}
          value={lastSync}
          icon={FaClock}
          color="purple"
          valueClassName="text-sm"
        />
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-blue-400/50" />
          </div>
          <input
            type="text"
            placeholder={t("Search by user, action, or comment...")}
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
                <TH width="150px">{t("User")}</TH>
                <TH width="120px">{t("Action")}</TH>
                <TH width="200px">{t("Old Groups")}</TH>
                <TH width="200px">{t("New Groups")}</TH>
                <TH width="250px">{t("Comment")}</TH>
                <TH width="160px">{t("Timestamp")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TRow key={log.id}>
                    {/* ID */}
                    <TD>
                      <Badge variant="info">{log.id}</Badge>
                    </TD>

                    {/* User */}
                    <TD className="font-semibold text-white">
                      {log.user_name || (
                        <span className="text-blue-400/30">#{log.object_id}</span>
                      )}
                    </TD>

                    {/* Action */}
                    <TD>
                      <Badge variant="info" icon={FaExchangeAlt}>
                        {log.action}
                      </Badge>
                    </TD>

                    {/* Old Groups */}
                    <TD>
                      {log.old_value ? (
                        <div className="flex flex-wrap gap-1">
                          {log.old_value.split(",").map((group, i) => (
                            <Badge key={i} variant="danger" size="sm">
                              {group.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-400/30 text-sm">-</span>
                      )}
                    </TD>

                    {/* New Groups */}
                    <TD>
                      {log.new_value ? (
                        <div className="flex flex-wrap gap-1">
                          {log.new_value.split(",").map((group, i) => (
                            <Badge key={i} variant="success" size="sm">
                              {group.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-400/30 text-sm">-</span>
                      )}
                    </TD>

                    {/* Comment */}
                    <TD className="text-blue-200/70 text-sm">
                      {log.comment || <span className="text-blue-400/30">-</span>}
                    </TD>

                    {/* Timestamp */}
                    <TD className="text-blue-200/60 text-sm font-mono">
                      {formatDate(log.created_at)}
                    </TD>
                  </TRow>
                ))
              ) : (
                <TRow>
                  <TD colSpan="7" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaHistory className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">
                        {t("No matrix sync changes found")}
                      </p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm
                          ? t("Try adjusting your search criteria.")
                          : t("Changes will appear here after the first sync.")}
                      </p>
                    </div>
                  </TD>
                </TRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Results count and Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-200/60">
          {t("Showing")} <span className="font-semibold text-blue-100">{startIndex + 1}</span> {t("to")}{" "}
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredLogs.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredLogs.length}</span> {t("changes")}
        </p>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default MatrixLog;