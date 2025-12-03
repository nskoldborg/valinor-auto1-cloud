import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaShieldAlt,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
  FaSearch,
  FaUser,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { PrimaryButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import Protected from "@/components/Protected";

const Roles = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetch("http://10.46.0.140:8650/roles/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || t("Failed to load roles"));
        }
        return res.json();
      })
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.id - b.id);
        setRoles(sorted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, t]);

  useEffect(() => {
    let filtered = roles;

    // Apply type filter
    if (typeFilter === "system") {
      filtered = filtered.filter(
        (r) => !r.created_by || r.created_by === "System Generated"
      );
    } else if (typeFilter === "custom") {
      filtered = filtered.filter(
        (r) => r.created_by && r.created_by !== "System Generated"
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, typeFilter, roles]);

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
  const totalRoles = roles.length;
  const systemRoles = roles.filter(
    (r) => !r.created_by || r.created_by === "System Generated"
  ).length;
  const customRoles = roles.filter(
    (r) => r.created_by && r.created_by !== "System Generated"
  ).length;
  const rolesWithDescription = roles.filter((r) => r.description).length;

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  // Handle stat card click to filter
  const handleStatClick = (filter) => {
    setTypeFilter(filter);
  };

  return (
    <PageLayout
      title={t("Roles")}
      description={t("Manage user roles and their descriptions across the system.")}
      actions={
        <Protected role="route:roles#create">
          <PrimaryButton
            onClick={() => navigate("/admin/user-roles/create")}
            icon={FaPlus}
          >
            {t("Create Role")}
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
            title={t("Total Roles")}
            value={totalRoles}
            icon={FaShieldAlt}
            color="blue"
            active={typeFilter === "all"}
          />
        </div>
        <div onClick={() => handleStatClick("system")} className="cursor-pointer">
          <StatCard
            title={t("System Roles")}
            value={systemRoles}
            icon={FaCheckCircle}
            color="green"
            active={typeFilter === "system"}
          />
        </div>
        <div onClick={() => handleStatClick("custom")} className="cursor-pointer">
          <StatCard
            title={t("Custom Roles")}
            value={customRoles}
            icon={FaUser}
            color="purple"
            active={typeFilter === "custom"}
          />
        </div>
        <div className="opacity-50 cursor-not-allowed">
          <StatCard
            title={t("With Description")}
            value={rolesWithDescription}
            icon={FaInfoCircle}
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
            placeholder={t("Search roles by name or description...")}
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
                <TH width="250px">{t("Name")}</TH>
                <TH width="350px">{t("Description")}</TH>
                <TH width="160px">{t("Created At")}</TH>
                <TH width="150px">{t("Created By")}</TH>
                <TH width="100px" align="right">{t("Actions")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedRoles.length > 0 ? (
                paginatedRoles.map((r) => (
                  <TRow key={r.id}>
                    {/* ID */}
                    <TD>
                      <Badge variant="tag_blue">{r.id}</Badge>
                    </TD>

                    {/* Name */}
                    <TD className="font-semibold text-white">{r.name}</TD>

                    {/* Description */}
                    <TD className="text-blue-200/70 text-sm">
                      {r.description || <span className="text-blue-400/30">-</span>}
                    </TD>

                    {/* Created At */}
                    <TD className="text-blue-200/60 text-sm font-mono">
                      {formatDate(r.created_at)}
                    </TD>

                    {/* Created By */}
                    <TD>
                      {r.created_by && r.created_by !== "System Generated" ? (
                        <Badge variant="tag_purple" size="sm">
                          {r.created_by}
                        </Badge>
                      ) : (
                        <Badge variant="tag_black" size="sm">
                          {t("System")}
                        </Badge>
                      )}
                    </TD>

                    {/* Actions */}
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Protected role="route:roles#edit">
                          <button
                            onClick={() => navigate(`/admin/user-roles/${r.id}/edit`)}
                            className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-all duration-200 border border-amber-500/30"
                            title={t("Edit")}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </Protected>
                      </div>
                    </TD>
                  </TRow>
                ))
              ) : (
                <TRow>
                  <TD colSpan="6" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaShieldAlt className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">{t("No roles found")}</p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || typeFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t("Create your first role to get started.")}
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
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredRoles.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredRoles.length}</span> {t("roles")}
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

export default Roles;