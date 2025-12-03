import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaUsers,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaEye,
  FaTrash,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { PrimaryButton } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import Protected from "@/components/Protected";

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch("http://10.46.0.140:8650/users/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.id - b.id);
        setUsers(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    let filtered = users;

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => u.status);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((u) => !u.status);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, users]);

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status).length;
  const inactiveUsers = users.filter((u) => !u.status).length;
  const usersWithGroups = users.filter((u) => u.groups?.length > 0).length;

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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

  // Handle stat card click to filter
  const handleStatClick = (filter) => {
    setStatusFilter(filter);
  };

  return (
    <PageLayout
      title={t("Users")}
      description={t("Manage system users and their access groups.")}
      actions={
        <Protected role="route:users#create">
          <PrimaryButton
            onClick={() => navigate("/admin/users/create")}
            icon={FaPlus}
          >
            {t("Create User")}
          </PrimaryButton>
        </Protected>
      }
      loading={loading}
    >
      {/* Stats Summary - Clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleStatClick("all")} className="cursor-pointer">
          <StatCard
            title={t("Total Users")}
            value={totalUsers}
            icon={FaUsers}
            color="blue"
            active={statusFilter === "all"}
          />
        </div>
        <div onClick={() => handleStatClick("active")} className="cursor-pointer">
          <StatCard
            title={t("Active Users")}
            value={activeUsers}
            icon={FaCheckCircle}
            color="green"
            active={statusFilter === "active"}
          />
        </div>
        <div onClick={() => handleStatClick("inactive")} className="cursor-pointer">
          <StatCard
            title={t("Inactive Users")}
            value={inactiveUsers}
            icon={FaTimesCircle}
            color="red"
            active={statusFilter === "inactive"}
          />
        </div>
        <div className="opacity-50 cursor-not-allowed">
          <StatCard
            title={t("With Groups")}
            value={usersWithGroups}
            icon={FaUsers}
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
            placeholder={t("Search by name...")}
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
                <TH width="150px">{t("Position")}</TH>
                <TH width="200px">{t("Email")}</TH>
                <TH width="100px">{t("Status")}</TH>
                <TH width="100px">{t("Country")}</TH>
                <TH width="200px">{t("Groups")}</TH>
                <TH width="160px">{t("Created At")}</TH>
                <TH width="120px">{t("Created By")}</TH>
                <TH width="120px" align="right">{t("Actions")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <TRow key={u.id}>
                    <TD>
                      <Badge variant="info">{u.id}</Badge>
                    </TD>

                    <TD>
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}/view`)}
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 hover:underline text-left"
                      >
                        {u.first_name} {u.last_name}
                      </button>
                    </TD>

                    <TD className="text-blue-200/70 text-sm">
                      {u.user_positions?.length
                        ? u.user_positions.map((p) => p.name).join(", ")
                        : <span className="text-blue-400/30">-</span>}
                    </TD>

                    <TD className="text-blue-200/70 text-sm">
                      {u.email || <span className="text-blue-400/30">-</span>}
                    </TD>

                    <TD>
                      {u.status ? (
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

                    <TD className="text-blue-200/70 text-sm">
                      {u.country || <span className="text-blue-400/30">-</span>}
                    </TD>

                    <TD>
                      {u.groups?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {u.groups.map((g) => (
                            <Badge key={g.id} variant="assigned_options" size="sm">
                              {g.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-400/30 text-sm">-</span>
                      )}
                    </TD>

                    <TD className="text-blue-200/60 text-sm">
                      {formatDate(u.created_at)}
                    </TD>

                    <TD className="text-blue-200/60 text-sm">
                      {u.created_by || <span className="text-blue-400/30">-</span>}
                    </TD>

                    <TD>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}/view`)}
                          className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 border border-blue-500/30"
                          title={t("View")}
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <Protected role="route:users#edit">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                            className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-all duration-200 border border-amber-500/30"
                            title={t("Edit")}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </Protected>
                        <Protected role="route:users#delete">
                          <button
                            onClick={() => console.log("Delete", u.id)}
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
                      <FaUsers className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">{t("No users found")}</p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t("Create your first user to get started.")}
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
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredUsers.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredUsers.length}</span> {t("users")}
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

export default Users;