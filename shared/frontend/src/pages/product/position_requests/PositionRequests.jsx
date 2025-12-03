import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUserTie,
  FaPlus,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CreatePositionRequestModal from "@/components/modals/CreatePositionRequestModal";

const PositionRequests = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ------------------------------------------------------------
  // Load current user's roles for RBAC
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const res = await fetch("http://10.46.0.140:8650/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.roles) {
          const normalized = data.roles.map((r) =>
            typeof r === "string" ? r.toLowerCase() : r.name.toLowerCase()
          );
          setUserRoles(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch user roles:", err);
      }
    };
    fetchUserRoles();
  }, [token]);

  const hasEditAccess = userRoles.includes("route:product#position-change-edit");

  // ------------------------------------------------------------
  // Fetch position requests + supporting data
  // ------------------------------------------------------------
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [reqRes, posRes, userRes] = await Promise.all([
        fetch("http://10.46.0.140:8650/position-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.46.0.140:8650/positions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.46.0.140:8650/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [reqData, posData, userData] = await Promise.all([
        reqRes.json(),
        posRes.json(),
        userRes.json(),
      ]);

      const posMap = Object.fromEntries(posData.map((p) => [p.id, p.name]));
      const userMap = Object.fromEntries(
        userData.map((u) => [
          u.id,
          `${u.first_name || ""} ${u.last_name || ""}`.trim(),
        ])
      );

      const enriched = reqData.map((r) => ({
        ...r,
        position_name: posMap[r.position_id] || `#${r.position_id}`,
        requested_by_name: userMap[r.requested_by] || "Unknown",
      }));

      const filtered = enriched.filter(
        (r) => r.status !== "Completed" && r.status !== "Rejected"
      );

      setRequests(enriched);
      setFilteredRequests(filtered);
    } catch (err) {
      console.error("Error loading position requests:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Requests"),
        description: t("Failed to load position update requests."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Filter logic (same as FeatureRequests)
  // ------------------------------------------------------------
  const statusOptions = [
    { value: "All", label: t("All"), icon: FaFilter },
    { value: "Created", label: t("Created"), icon: FaPlus },
    { value: "Pending Approval", label: t("Pending Approval"), icon: FaClock },
    { value: "Approved", label: t("Approved"), icon: FaCheckCircle },
    { value: "Rejected", label: t("Rejected"), icon: FaTimesCircle },
    { value: "In Progress", label: t("In Progress"), icon: FaHourglassHalf },
    { value: "Work in Progress", label: t("Work in Progress"), icon: FaHourglassHalf },
    { value: "Completed", label: t("Completed"), icon: FaCheckCircle },
  ];

  useEffect(() => {
    if (!statusFilter || statusFilter.value === "All") {
      setFilteredRequests(
        requests.filter(
          (r) => r.status !== "Completed" && r.status !== "Rejected"
        )
      );
    } else {
      setFilteredRequests(
        requests.filter((r) => r.status === statusFilter.value)
      );
    }
  }, [statusFilter, requests]);

  // ------------------------------------------------------------
  // Stage Visualization (same as FeatureRequests)
  // ------------------------------------------------------------
  const statusStages = [
    { name: "Created", icon: FaPlus },
    { name: "Pending Approval", icon: FaClock },
    { name: "Approved", icon: FaCheckCircle },
    { name: "Work in Progress", icon: FaHourglassHalf },
    { name: "Completed", icon: FaCheckCircle },
  ];

  const approvalStages = [
    { name: "Created", icon: FaPlus },
    { name: "Pending", icon: FaClock },
    { name: "Approved", icon: FaCheckCircle },
  ];

  const getStageIndex = (stages, status) =>
    stages.findIndex((s) => s.name === status);

  const renderStageBar = (stages, currentStatus) => {
    const currentIndex = getStageIndex(stages, currentStatus);
    return (
      <div className="flex items-center justify-between w-full max-w-[400px] mx-auto">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                    isActive
                      ? isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 scale-110"
                        : "bg-gradient-to-br from-blue-600 to-blue-700"
                      : "bg-white/10 border border-white/20"
                  }`}
                >
                  <Icon
                    className={`text-xs ${
                      isActive ? "text-white" : "text-blue-200/40"
                    }`}
                  />
                </div>
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1 rounded-full transition-all duration-300 ${
                    idx < currentIndex
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "bg-white/10"
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const resolveApprovalStatus = (request) => {
    if (request.approval_status) return request.approval_status;
    if (request.status === "Pending Approval") return "Pending";
    if (request.status === "Approved") return "Approved";
    return "Created";
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      Created: { variant: "info", icon: FaPlus },
      "Pending Approval": { variant: "warning", icon: FaClock },
      Approved: { variant: "success", icon: FaCheckCircle },
      Rejected: { variant: "error", icon: FaTimesCircle },
      "In Progress": { variant: "default", icon: FaHourglassHalf },
      "Work in Progress": { variant: "default", icon: FaHourglassHalf },
      Completed: { variant: "success", icon: FaCheckCircle },
    };

    const config = statusMap[status] || { variant: "default", icon: null };
    return (
      <Badge variant={config.variant} icon={config.icon}>
        {status}
      </Badge>
    );
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <Protected role="route:product#position-change">
      <PageLayout
        title={t("Position Update Requests")}
        description={t(
          "Manage and approve requests to update position details, groups, or matrix configurations."
        )}
        actions={
          <Protected role="route:product#position-change-create">
            <PrimaryButton onClick={() => setShowModal(true)} icon={FaPlus}>
              {t("New Request")}
            </PrimaryButton>
          </Protected>
        }
        loading={loading}
      >
        {/* Message Alert */}
        {message && (
          <Alert
            type={message.type}
            message={message.message}
            description={message.description}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Filter Bar */}
        <Card className="mb-6">
          <div className="relative max-w-md">
            <FormSelect
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder={t("Filter by status...")}
              icon={FaFilter}
            />
          </div>
        </Card>

        {/* Position Requests Table */}
        <Card padding="none" className="overflow-hidden mb-6">
          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" />
              <p className="text-blue-200/60 mt-4 font-medium">
                {t("Loading position update requests...")}
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-blue-400/60 text-3xl" />
              </div>
              <p className="text-blue-200/60 font-medium mb-2">
                {t("No position requests found.")}
              </p>
              <p className="text-blue-200/40 text-sm">
                {t(
                  "Try adjusting your filters or create a new position request."
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("ID")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Position")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Requested By")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Status")}
                    </th>
                    <th className="text-center py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Progress")}
                    </th>
                    <th className="text-center py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Approval")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r, index) => (
                    <tr
                      key={r.request_id}
                      className={`border-b border-white/5 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white/[0.02]" : ""
                      } ${
                        hasEditAccess
                          ? "hover:bg-white/10 cursor-pointer"
                          : ""
                      }`}
                      onClick={() =>
                        hasEditAccess &&
                        navigate(`/product/position-requests/${r.request_id}`)
                      }
                    >
                      <td className="py-3 px-4">
                        {hasEditAccess ? (
                          <span className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                            #{r.request_id}
                          </span>
                        ) : (
                          <span className="text-white font-medium">
                            #{r.request_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-blue-200/90 max-w-[300px] truncate">
                        {r.position_name}
                      </td>
                      <td className="py-3 px-4 text-blue-200/90">
                        {r.requested_by_name}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(r.status || "Created")}
                      </td>
                      <td className="py-3 px-4">
                        {renderStageBar(statusStages, r.status || "Created")}
                      </td>
                      <td className="py-3 px-4">
                        {renderStageBar(approvalStages, resolveApprovalStatus(r))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-200/60">
            {t("Showing")}{" "}
            <span className="font-semibold text-blue-100">
              {filteredRequests.length}
            </span>{" "}
            {t("requests")}
          </p>
        </div>
      </PageLayout>

      {/* Create Position Request Modal */}
      <CreatePositionRequestModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchRequests}
      />
    </Protected>
  );
};

export default PositionRequests;