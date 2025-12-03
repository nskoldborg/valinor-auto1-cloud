import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaBriefcase,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUsers,
  FaExclamationCircle,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaTrash,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { PrimaryButton, SecondaryButton, DangerButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import Protected from "@/components/Protected";

const Positions = () => {
  const { t } = useTranslation();
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 25;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchPositions = () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    fetch("http://10.46.0.140:8650/positions/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || t("Failed to load positions"));
        }
        return res.json();
      })
      .then((data) => {
        const sorted = (data || []).sort((a, b) => a.id - b.id);
        setPositions(sorted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setMessage({ type: "error", message: err.message });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    let filtered = positions;

    // Apply status filter
    if (statusFilter === "enabled") {
      filtered = filtered.filter((p) => p.enabled);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter((p) => !p.enabled);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPositions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, positions]);

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

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/positions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to delete position"));
      }

      setMessage({
        type: "success",
        message: t("Position deleted successfully!"),
      });
      setDeleteTarget(null);
      fetchPositions(); // Refresh the list
    } catch (err) {
      setMessage({ type: "error", message: err.message });
      setDeleteTarget(null);
    }
  };

  // Calculate stats
  const totalPositions = positions.length;
  const enabledCount = positions.filter((p) => p.enabled).length;
  const disabledCount = positions.filter((p) => !p.enabled).length;
  const matrixIncludedCount = positions.filter((p) => !p.exclude_from_matrix).length;

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPositions = filteredPositions.slice(startIndex, endIndex);

  // Handle stat card click to filter
  const handleStatClick = (filter) => {
    setStatusFilter(filter);
  };

  return (
    <PageLayout
      title={t("Positions")}
      description={t("View and manage user positions, their matrix settings, and associated groups.")}
      actions={
        <Protected role="route:positions#create">
          <PrimaryButton
            onClick={() => navigate("/admin/user-positions/create")}
            icon={FaPlus}
          >
            {t("Create Position")}
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
            onClose={() => setMessage(null)}
          />
        </div>
      )}

      {/* Stats Summary - Clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleStatClick("all")} className="cursor-pointer">
          <StatCard
            title={t("Total Positions")}
            value={totalPositions}
            icon={FaBriefcase}
            color="blue"
            active={statusFilter === "all"}
          />
        </div>
        <div onClick={() => handleStatClick("enabled")} className="cursor-pointer">
          <StatCard
            title={t("Enabled")}
            value={enabledCount}
            icon={FaCheckCircle}
            color="green"
            active={statusFilter === "enabled"}
          />
        </div>
        <div onClick={() => handleStatClick("disabled")} className="cursor-pointer">
          <StatCard
            title={t("Disabled")}
            value={disabledCount}
            icon={FaTimesCircle}
            color="red"
            active={statusFilter === "disabled"}
          />
        </div>
        <div className="opacity-50 cursor-not-allowed">
          <StatCard
            title={t("Matrix Included")}
            value={matrixIncludedCount}
            icon={FaShieldAlt}
            color="purple"
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
            placeholder={t("Search positions by name or description...")}
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
                <TH width="180px">{t("Name")}</TH>
                <TH width="250px">{t("Description")}</TH>
                <TH width="180px">{t("Groups")}</TH>
                <TH width="100px">{t("Risk Level")}</TH>
                <TH width="120px">{t("Matrix")}</TH>
                <TH width="100px">{t("Status")}</TH>
                <TH width="160px">{t("Created At")}</TH>
                <TH width="120px">{t("Created By")}</TH>
                <TH width="140px" align="right">{t("Actions")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedPositions.length > 0 ? (
                paginatedPositions.map((p) => (
                  <TRow key={p.id}>
                    {/* ID */}
                    <TD>
                      <Badge variant="info">{p.id}</Badge>
                    </TD>

                    {/* Name */}
                    <TD className="font-semibold text-white">{p.name}</TD>

                    {/* Description */}
                    <TD className="text-blue-200/70 text-sm">
                      {p.description || <span className="text-blue-400/30">-</span>}
                    </TD>

                    {/* Groups */}
                    <TD>
                      {p.groups && p.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.groups.map((g) => (
                            <Badge key={g.id} variant="assigned_options" size="sm">
                              {g.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-400/30 text-sm">-</span>
                      )}
                    </TD>

                    {/* Risk Level */}
                    <TD>
                      {p.risk_level !== null && p.risk_level !== undefined ? (
                        <Badge variant="warning" icon={FaExclamationCircle}>
                          {p.risk_level}
                        </Badge>
                      ) : (
                        <span className="text-blue-400/30 text-sm">-</span>
                      )}
                    </TD>

                    {/* Matrix Inclusion */}
                    <TD>
                      {p.exclude_from_matrix ? (
                        <Badge variant="danger" icon={FaExclamationTriangle}>
                          {t("Excluded")}
                        </Badge>
                      ) : (
                        <Badge variant="success" icon={FaCheckCircle}>
                          {t("Included")}
                        </Badge>
                      )}
                    </TD>

                    {/* Status */}
                    <TD>
                      {p.enabled ? (
                        <Badge variant="success">
                          <FaCheckCircle className="mr-1" />
                          {t("Enabled")}
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <FaTimesCircle className="mr-1" />
                          {t("Disabled")}
                        </Badge>
                      )}
                    </TD>

                    {/* Created At */}
                    <TD className="text-blue-200/60 text-sm font-mono">
                      {formatDate(p.created_at)}
                    </TD>

                    {/* Created By */}
                    <TD className="text-blue-200/60 text-sm">
                      {p.created_by || <span className="text-blue-400/30">-</span>}
                    </TD>

                    {/* Actions */}
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Protected role="route:positions#edit">
                          <button
                            onClick={() => navigate(`/admin/user-positions/${p.id}/edit`)}
                            className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-all duration-200 border border-amber-500/30"
                            title={t("Edit")}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </Protected>
                        <Protected role="route:positions#delete">
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 border border-red-500/30"
                            title={t("Delete")}
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </Protected>
                      </div>
                    </TD>
                  </TRow>
                ))
              ) : (
                <TRow>
                  <TD colSpan="10" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaBriefcase className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">{t("No positions found")}</p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t("Create your first position to get started.")}
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
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredPositions.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredPositions.length}</span> {t("positions")}
        </p>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={t("Delete Position")}
          variant="danger"
          footer={
            <>
              <SecondaryButton onClick={() => setDeleteTarget(null)}>
                {t("Cancel")}
              </SecondaryButton>
              <DangerButton onClick={() => handleDelete(deleteTarget.id)}>
                {t("Delete")}
              </DangerButton>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-blue-200/90">
              {t("Are you sure you want to delete the position")}{" "}
              <strong className="text-white">{deleteTarget.name}</strong>?
            </p>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-200/90 flex items-start gap-2">
                <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                <span>
                  {t("This action cannot be undone. All users assigned to this position will lose their associated permissions.")}
                </span>
              </p>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Positions;