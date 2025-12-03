import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaLightbulb,
  FaPlus,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaCode,
  FaRocket,
  FaInfoCircle,
  FaExclamationCircle,
  FaDesktop,
  FaServer,
  FaDatabase,
  FaBug,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CreateFeatureModal from "@/components/modals/CreateFeatureModal";

const FeatureRequests = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  // ------------------------------------------------------------
  // Fetch current user roles
  // ------------------------------------------------------------
  const fetchUserRoles = async () => {
    try {
      const res = await fetch("http://10.46.0.140:8650/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const roles = data.roles?.map((r) =>
        typeof r === "string" ? r.toLowerCase() : r.name?.toLowerCase()
      );
      setUserRoles(roles || []);
    } catch (err) {
      console.error("Error loading user roles:", err);
    }
  };

  const hasAccess = (role) => {
    if (!role) return true;
    if (userRoles.includes("admin")) return true;
    return userRoles.includes(role.toLowerCase());
  };

  // ------------------------------------------------------------
  // Fetch feature requests
  // ------------------------------------------------------------
  const fetchRequests = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://10.46.0.140:8650/feature-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(t("Failed to load feature requests"));
      }

      const data = await res.json();

      // Exclude Released and Rejected by default
      const filtered = data.filter(
        (r) => r.status !== "Released" && r.status !== "Rejected"
      );

      setRequests(data);
      setFilteredRequests(filtered);
    } catch (err) {
      console.error("Error loading feature requests:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Features"),
        description: err.message || t("Failed to load feature requests."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Filter logic
  // ------------------------------------------------------------
  const statusOptions = [
    { value: "All", label: t("All"), icon: FaFilter },
    { value: "New", label: t("New"), icon: FaLightbulb },
    { value: "In Review", label: t("In Review"), icon: FaInfoCircle },
    { value: "Backlogg", label: t("Backlogg"), icon: FaClock },
    { value: "Rejected", label: t("Rejected"), icon: FaExclamationCircle },
    { value: "In Development", label: t("In Development"), icon: FaCode },
    { value: "Ready for Test", label: t("Ready for Test"), icon: FaCheckCircle },
    { value: "Pending Release", label: t("Pending Release"), icon: FaClock },
    { value: "Released", label: t("Released"), icon: FaRocket },
  ];

  useEffect(() => {
    if (!statusFilter || statusFilter.value === "All") {
      setFilteredRequests(
        requests.filter(
          (r) => r.status !== "Released" && r.status !== "Rejected"
        )
      );
    } else {
      setFilteredRequests(requests.filter((r) => r.status === statusFilter.value));
    }
  }, [statusFilter, requests]);

  // ------------------------------------------------------------
  // Stage Visualization
  // ------------------------------------------------------------
  const stages = [
    { name: "New", icon: FaLightbulb },
    { name: "In Review", icon: FaInfoCircle },
    { name: "In Development", icon: FaCode },
    { name: "Ready for Test", icon: FaCheckCircle },
    { name: "Pending Release", icon: FaClock },
    { name: "Released", icon: FaRocket },
  ];

  const getStageIndex = (status) =>
    stages.findIndex((s) => s.name === status);

  const renderStageBar = (currentStatus) => {
    const currentIndex = getStageIndex(currentStatus);
    return (
      <div className="flex items-center justify-between w-full max-w-[500px] mx-auto">
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

  // Get status badge variant
  const getStatusBadge = (status) => {
    const statusMap = {
      New: { variant: "info", icon: FaLightbulb },
      "In Review": { variant: "warning", icon: FaInfoCircle },
      "In Development": { variant: "default", icon: FaCode },
      "Ready for Test": { variant: "success", icon: FaCheckCircle },
      "Pending Release": { variant: "warning", icon: FaClock },
      Released: { variant: "success", icon: FaRocket },
      Rejected: { variant: "error", icon: FaExclamationCircle },
      Backlogg: { variant: "default", icon: FaClock },
    };

    const config = statusMap[status] || { variant: "default", icon: null };
    return (
      <Badge variant={config.variant} icon={config.icon}>
        {status}
      </Badge>
    );
  };

  // Get type badge variant
  const getTypeBadge = (type) => {
    const typeMap = {
      Frontend: { variant: "info", icon: FaDesktop },
      Backend: { variant: "default", icon: FaCode },
      Server: { variant: "success", icon: FaServer },
      Database: { variant: "default", icon: FaDatabase },
      Bugfix: { variant: "warning", icon: FaBug },
    };

    const config = typeMap[type] || { variant: "default", icon: null };
    return (
      <Badge variant={config.variant} icon={config.icon}>
        {type}
      </Badge>
    );
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <Protected role="route:product#features">
      <PageLayout
        title={t("Feature Requests")}
        description={t(
          "Manage and prioritize new feature requests, bug fixes, and improvements."
        )}
        actions={
          <Protected role="route:product#features-create">
            <PrimaryButton onClick={() => setShowModal(true)} icon={FaPlus}>
              {t("New Feature")}
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

        {/* Feature Requests Table */}
        <Card padding="none" className="overflow-hidden mb-6">
          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" />
              <p className="text-blue-200/60 mt-4 font-medium">
                {t("Loading feature requests...")}
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-blue-400/60 text-3xl" />
              </div>
              <p className="text-blue-200/60 font-medium mb-2">
                {t("No feature requests found.")}
              </p>
              <p className="text-blue-200/40 text-sm">
                {t("Try adjusting your filters or create a new feature request.")}
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
                      {t("Title")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Type")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Status")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Version")}
                    </th>
                    <th className="text-center py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Progress")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r, index) => (
                    <tr
                      key={r.feature_id}
                      className={`border-b border-white/5 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white/[0.02]" : ""
                      } ${
                        hasAccess("route:product#features-edit")
                          ? "hover:bg-white/10 cursor-pointer"
                          : ""
                      }`}
                      onClick={() =>
                        hasAccess("route:product#features-edit") &&
                        navigate(`/product/feature-requests/${r.feature_id}`)
                      }
                    >
                      <td className="py-3 px-4">
                        {hasAccess("route:product#features-edit") ? (
                          <span className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                            #{r.feature_id}
                          </span>
                        ) : (
                          <span className="text-white font-medium">
                            #{r.feature_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-blue-200/90 max-w-[400px] truncate">
                        {r.title}
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(r.type)}</td>
                      <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-3 px-4">
                        {r.version_target ? (
                          <Badge variant="default">v{r.version_target}</Badge>
                        ) : (
                          <span className="text-blue-200/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {renderStageBar(r.status)}
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

      {/* Create Feature Modal */}
      <CreateFeatureModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchRequests}
      />
    </Protected>
  );
};

export default FeatureRequests;