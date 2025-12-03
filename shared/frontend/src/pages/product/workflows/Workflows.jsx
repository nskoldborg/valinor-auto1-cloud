import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaPlay,
  FaHistory,
  FaPlus,
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationCircle,
  FaUser,
  FaCalendar,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton, SuccessButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Workflows = () => {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch workflows
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetch("http://10.46.0.140:8650/workflows/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load workflows");
        }
        return res.json();
      })
      .then((data) => {
        const sorted = (data || []).sort((a, b) => a.id - b.id);
        setWorkflows(sorted);
        setLoading(false);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          message: t("Error Loading Workflows"),
          description: err.message,
        });
        setLoading(false);
      });
  }, [token, t]);

  // Run workflow manually
  const handleRunNow = async (workflowId) => {
    if (!token) return;
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/workflows/${workflowId}/run`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to run workflow");
      setMessage({
        type: "success",
        message: t("Success"),
        description: t(`Workflow #${workflowId} executed successfully.`),
      });
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Execution Failed"),
        description: err.message,
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status, enabled) => {
    if (!enabled) {
      return (
        <Badge variant="default" icon={FaTimesCircle}>
          {t("Disabled")}
        </Badge>
      );
    }

    const statusMap = {
      active: { variant: "success", icon: <FaCheckCircle />, label: t("Active") },
      disabled: { variant: "default", icon: <FaTimesCircle />, label: t("Disabled") },
      pending: { variant: "warning", icon: <FaClock />, label: t("Pending") },
    };

    const config = statusMap[status] || {
      variant: "info",
      icon: <FaCog />,
      label: status || t("Unknown"),
    };

    return (
      <Badge variant={config.variant} icon={config.icon}>
        {config.label}
      </Badge>
    );
  };

  // Get result badge
  const getResultBadge = (result) => {
    if (!result) {
      return <span className="text-blue-200/40">—</span>;
    }

    const resultMap = {
      success: {
        variant: "success",
        icon: <FaCheckCircle />,
        label: t("Success"),
      },
      failed: {
        variant: "error",
        icon: <FaTimesCircle />,
        label: t("Failed"),
      },
    };

    const config = resultMap[result] || {
      variant: "default",
      icon: null,
      label: result,
    };

    return (
      <Badge variant={config.variant} icon={config.icon}>
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d2847] to-[#0f3460]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom py-8">
        {/* Page Header */}
        <PageHeader
          title={t("Workflows")}
          description={t(
            "Manage backend automation workflows, schedules, and execution history."
          )}
          icon={FaCog}
          actions={
            <Protected role="route:workflows#create">
              <PrimaryButton
                onClick={() => navigate("/product/workflows/create")}
                icon={FaPlus}
              >
                {t("Create Workflow")}
              </PrimaryButton>
            </Protected>
          }
        />

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Message Alert */}
          {message && (
            <Alert
              type={message.type}
              message={message.message}
              description={message.description}
              onClose={() => setMessage(null)}
            />
          )}

          {/* Workflows Table */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FaCog className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Workflows")} ({workflows.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <LoadingSpinner size="lg" />
                <p className="text-blue-200/60 mt-4 font-medium">
                  {t("Loading workflows...")}
                </p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationCircle className="text-blue-400 text-3xl" />
                </div>
                <p className="text-blue-200/60 font-medium">
                  {t("No workflows found.")}
                </p>
                <p className="text-blue-200/40 text-sm mt-2">
                  {t("Create your first workflow to get started.")}
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
                        {t("Name")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Description")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Schedule")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Last Execution")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Result")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Status")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Created By")}
                      </th>
                      <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Created At")}
                      </th>
                      <th className="text-center py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                        {t("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((wf, index) => (
                      <tr
                        key={wf.id}
                        className={`border-b border-white/5 transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="text-blue-400 font-semibold">
                            {wf.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                wf.status === "active"
                                  ? "bg-green-500 shadow-lg shadow-green-500/50"
                                  : wf.status === "disabled"
                                  ? "bg-gray-400"
                                  : "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                              }`}
                            ></div>
                            <span className="text-white font-medium">
                              {wf.name || t("Unnamed Workflow")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-blue-200/90 max-w-[260px] truncate">
                          {wf.description || (
                            <span className="text-blue-200/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {wf.schedule ? (
                            <div className="flex items-center gap-2 text-blue-200/90">
                              <FaClock className="text-blue-400/60" />
                              <span className="font-mono text-xs">
                                {wf.schedule}
                              </span>
                            </div>
                          ) : (
                            <span className="text-blue-200/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {wf.last_execution ? (
                            <div className="flex items-center gap-2 text-blue-200/90 text-xs">
                              <FaCalendar className="text-blue-400/60" />
                              {formatDate(wf.last_execution)}
                            </div>
                          ) : (
                            <span className="text-blue-200/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getResultBadge(wf.last_result)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(wf.status, wf.enabled)}
                        </td>
                        <td className="py-3 px-4">
                          {wf.created_by_name || wf.created_by ? (
                            <div className="flex items-center gap-2 text-blue-200/90">
                              <FaUser className="text-blue-400/60" />
                              <span className="text-xs">
                                {wf.created_by_name || wf.created_by}
                              </span>
                            </div>
                          ) : (
                            <span className="text-blue-200/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-blue-200/90 text-xs">
                          {formatDate(wf.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Protected role="route:workflows#edit">
                              <button
                                onClick={() =>
                                  navigate(`/admin/workflows/${wf.id}/edit`)
                                }
                                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-xs text-blue-200 font-medium transition-all duration-200 border border-white/10 hover:border-blue-400/50"
                                title={t("Edit")}
                              >
                                <FaEdit className="text-xs" />
                                <span>{t("Edit")}</span>
                              </button>
                            </Protected>
                            <Protected role="route:workflows#run">
                              <button
                                onClick={() => handleRunNow(wf.id)}
                                className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 rounded-lg px-3 py-1.5 text-xs text-green-400 font-medium transition-all duration-200 border border-green-500/20 hover:border-green-400/50"
                                title={t("Run Now")}
                              >
                                <FaPlay className="text-xs" />
                                <span>{t("Run")}</span>
                              </button>
                            </Protected>
                            <Protected role="route:workflows#logs">
                              <button
                                onClick={() =>
                                  navigate(`/admin/workflows/${wf.id}/logs`)
                                }
                                className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-400 font-medium transition-all duration-200 border border-blue-500/20 hover:border-blue-400/50"
                                title={t("View Logs")}
                              >
                                <FaHistory className="text-xs" />
                                <span>{t("Logs")}</span>
                              </button>
                            </Protected>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 mt-8">
          <p className="text-blue-200/40 text-sm">
            © {new Date().getFullYear()} {t("Valinor Application")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Workflows;