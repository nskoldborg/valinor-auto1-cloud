import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserShield,
  FaSearch,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { PrimaryButton, DangerButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Pagination } from "@/components/ui/Pagination";

const Groups = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const itemsPerPage = 25;

  const token = localStorage.getItem("token");

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("http://10.46.0.140:8650/groups/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || t("Failed to load groups"));

        // Sort by ID
        const sorted = [...data].sort((a, b) => a.id - b.id);
        setGroups(sorted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [token, t]);

  useEffect(() => {
    let filtered = groups;

    // Apply status filter
    if (statusFilter === "enabled") {
      filtered = filtered.filter((g) => g.enabled);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter((g) => !g.enabled);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredGroups(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, groups]);

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to delete group"));
      }

      setGroups((prev) => prev.filter((g) => g.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle expanded roles for a group
  const toggleRolesExpansion = (groupId, e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

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
  const totalGroups = groups.length;
  const enabledCount = groups.filter((g) => g.enabled).length;
  const disabledCount = groups.filter((g) => !g.enabled).length;
  const withRolesCount = groups.filter((g) => g.roles?.length > 0).length;

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // Handle stat card click to filter
  const handleStatClick = (filter) => {
    setStatusFilter(filter);
  };

  return (
    <PageLayout
      title={t("Groups")}
      description={t("View and manage user groups and their associated roles.")}
      actions={
        <Protected role="route:groups#create">
          <PrimaryButton
            onClick={() => navigate("/admin/user-groups/create")}
            icon={FaPlus}
          >
            {t("Add Group")}
          </PrimaryButton>
        </Protected>
      }
      loading={loading}
      error={error}
    >
      {/* Stats Summary - Clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleStatClick("all")} className="cursor-pointer">
          <StatCard
            title={t("Total Groups")}
            value={totalGroups}
            icon={FaUsers}
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
            title={t("With Roles")}
            value={withRolesCount}
            icon={FaShieldAlt}
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
            placeholder={t("Search groups by name or description...")}
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
                <TH width="200px">{t("Roles")}</TH>
                <TH width="100px">{t("Status")}</TH>
                <TH width="160px">{t("Created At")}</TH>
                <TH width="120px">{t("Created By")}</TH>
                <TH width="100px" align="right">{t("Actions")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((g) => {
                  const isExpanded = expandedRoles.has(g.id);
                  const hasMoreRoles = g.roles?.length > 3;

                  return (
                    <TRow key={g.id}>
                      {/* ID */}
                      <TD>
                        <Badge variant="info">{g.id}</Badge>
                      </TD>

                      {/* Name */}
                      <TD className="font-semibold text-white">{g.name}</TD>

                      {/* Description */}
                      <TD className="text-blue-200/70 text-sm">
                        {g.description || <span className="text-blue-400/30">-</span>}
                      </TD>

                      {/* Roles */}
                      <TD>
                        {g.roles?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {/* Show first 3 roles or all if expanded */}
                            {(isExpanded ? g.roles : g.roles.slice(0, 3)).map((r) => (
                              <Badge key={r.id} variant="assigned_options" size="sm">
                                {r.name}
                              </Badge>
                            ))}
                            {/* Show counter or collapse button */}
                            {hasMoreRoles && (
                              <Badge
                                variant="neutral"
                                size="sm"
                                className="cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={(e) => toggleRolesExpansion(g.id, e)}
                                title={isExpanded ? t("Click to collapse") : t("Click to show all roles")}
                              >
                                {isExpanded ? t("Show less") : `+${g.roles.length - 3}`}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-blue-400/30 text-sm">-</span>
                        )}
                      </TD>

                      {/* Status */}
                      <TD>
                        {g.enabled ? (
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
                        {formatDate(g.created_at)}
                      </TD>

                      {/* Created By */}
                      <TD className="text-blue-200/60 text-sm">
                        {g.created_by || <span className="text-blue-400/30">-</span>}
                      </TD>

                      {/* Actions */}
                      <TD>
                        <div className="flex justify-end gap-2">
                          <Protected role="route:groups#edit">
                            <button
                              onClick={() => navigate(`/admin/user-groups/${g.id}/edit`)}
                              className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-all duration-200 border border-amber-500/30"
                              title={t("Edit")}
                            >
                              <FaEdit className="text-sm" />
                            </button>
                          </Protected>
                          <Protected role="route:groups#delete">
                            <button
                              onClick={() => setDeleteTarget(g)}
                              className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 border border-red-500/30"
                              title={t("Delete")}
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </Protected>
                        </div>
                      </TD>
                    </TRow>
                  );
                })
              ) : (
                <TRow>
                  <TD colSpan="8" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaUsers className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">{t("No groups found")}</p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t("Create your first group to get started.")}
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
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredGroups.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredGroups.length}</span> {t("groups")}
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
          title={t("Delete Group")}
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
            <Alert
              type="warning"
              message={
                <>
                  {t("Are you sure you want to delete")}{" "}
                  <span className="font-bold">{deleteTarget.name}</span>?
                </>
              }
            />
            <p className="text-sm text-blue-200/70">
              {t("This action cannot be undone.")}
            </p>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Groups;