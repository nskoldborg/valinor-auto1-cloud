import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaDatabase,
  FaEdit,
  FaPlus,
  FaServer,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaCalendar,
  FaExclamationCircle,
  FaPlug,
  FaTrash,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  PrimaryButton,
  DangerButton,
  SecondaryButton,
} from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import Protected from "@/components/Protected";

const AnalyticsDatasources = () => {
  const { t } = useTranslation();
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchDatasources = () => {
    if (!token) return;
    setLoading(true);

    fetch("http://10.46.0.140:8650/analytics/resources", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load datasources");
        }
        return res.json();
      })
      .then((data) => {
        setDatasources((data || []).sort((a, b) => a.id - b.id));
        setLoading(false);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          message: t("Error Loading Datasources"),
          description: err.message,
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDatasources();
  }, [token]);

  // Test connection for an existing datasource (uses backend-stored, encrypted password)
  const handleTestConnection = async (datasource) => {
    setTestingId(datasource.id);
    setMessage(null);

    try {
      const url = `http://10.46.0.140:8650/analytics/resources/${datasource.id}/test`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage({
          type: "success",
          message: t("Connection Successful"),
          description: data.version
            ? `${t("Successfully connected to")} ${datasource.name} (${data.version})`
            : data.message ||
              `${t("Successfully connected to")} ${datasource.name}`,
        });
      } else {
        setMessage({
          type: "error",
          message: t("Connection Failed"),
          description:
            data.detail ||
            `${t("Could not connect to")} ${datasource.name}`,
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Connection Test Failed"),
        description: err.message,
      });
    } finally {
      setTestingId(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `http://10.46.0.140:8650/analytics/resources/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to delete datasource"));
      }

      setMessage({
        type: "success",
        message: t("Datasource Deleted"),
        description: t("The datasource has been deleted successfully."),
      });

      // Refresh the list
      setDatasources((prev) =>
        prev.filter((ds) => ds.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Delete Failed"),
        description: err.message,
      });
    }
  };

  // Get database type badge
  const getTypeBadge = (type) => {
    const typeMap = {
      postgresql: { variant: "info", label: "PostgreSQL" },
      mysql: { variant: "warning", label: "MySQL" },
      mongodb: { variant: "success", label: "MongoDB" },
      mssql: { variant: "error", label: "MS SQL" },
      oracle: { variant: "default", label: "Oracle" },
    };

    const config =
      typeMap[type?.toLowerCase()] || {
        variant: "default",
        label: type || "Unknown",
      };

    return (
      <Badge variant={config.variant} icon={FaDatabase}>
        {config.label}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (enabled) => {
    return enabled ? (
      <Badge variant="success" icon={FaCheckCircle}>
        {t("Active")}
      </Badge>
    ) : (
      <Badge variant="error" icon={FaTimesCircle}>
        {t("Disabled")}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toISOString().replace("T", " ").split(".")[0];
    } catch {
      return dateString;
    }
  };

  return (
    <Protected role="route:analytics#resources">
      <PageLayout
        title={t("Database Datasources")}
        description={t(
          "Manage connected data sources for analytics queries."
        )}
        actions={
          <Protected role="route:analytics#resources-create">
            <PrimaryButton
              onClick={() => navigate("/analytics/datasources/create")}
              icon={FaPlus}
            >
              {t("Add Datasource")}
            </PrimaryButton>
          </Protected>
        }
      >
        {/* Message Alert */}
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

        {/* Datasources Table */}
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FaDatabase className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {t("Datasources")}
              </h3>
              <p className="text-blue-200/60 text-sm">
                {datasources.length} {t("datasources configured")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" />
              <p className="text-blue-200/60 mt-4 font-medium">
                {t("Loading datasources...")}
              </p>
            </div>
          ) : datasources.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-blue-400 text-3xl" />
              </div>
              <p className="text-blue-200/60 font-medium">
                {t("No datasources found.")}
              </p>
              <p className="text-blue-200/40 text-sm mt-2">
                {t("Add your first datasource to get started.")}
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
                      {t("Type")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Host")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Port")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Database")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Created By")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Created At")}
                    </th>
                    <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Status")}
                    </th>
                    <th className="text-center py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datasources.map((ds, index) => (
                    <tr
                      key={ds.id}
                      className={`border-b border-white/5 transition-all duration-200 hover:bg-white/5 ${
                        index % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-blue-400 font-semibold">
                          {ds.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                            <FaDatabase className="text-blue-400 text-sm" />
                          </div>
                          <span className="text-white font-medium">
                            {ds.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(ds.type)}</td>
                      <td className="py-3 px-4">
                        {ds.host ? (
                          <div className="flex items-center gap-2 text-blue-200/90">
                            <FaServer className="text-blue-400/60" />
                            <span className="text-sm">{ds.host}</span>
                          </div>
                        ) : (
                          <span className="text-blue-200/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ds.port ? (
                          <span className="text-blue-200/90 text-sm">
                            {ds.port}
                          </span>
                        ) : (
                          <span className="text-blue-200/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ds.database ? (
                          <div className="flex items-center gap-2 text-blue-200/90">
                            <FaDatabase className="text-blue-400/60 text-xs" />
                            <span className="text-sm">{ds.database}</span>
                          </div>
                        ) : (
                          <span className="text-blue-200/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ds.created_by_name || ds.created_by ? (
                          <div className="flex items-center gap-2 text-blue-200/90">
                            <FaUser className="text-blue-400/60" />
                            <span className="text-sm">
                              {ds.created_by_name || ds.created_by}
                            </span>
                          </div>
                        ) : (
                          <span className="text-blue-200/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ds.created_at ? (
                          <div className="flex items-center gap-2 text-blue-200/90 text-sm">
                            <FaCalendar className="text-blue-400/60" />
                            {formatDate(ds.created_at)}
                          </div>
                        ) : (
                          <span className="text-blue-200/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(ds.enabled)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Test Connection */}
                          <button
                            onClick={() => handleTestConnection(ds)}
                            disabled={testingId === ds.id}
                            className="w-8 h-8 bg-white/10 hover:bg-cyan-500/20 rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-cyan-400/50 group disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t("Test Connection")}
                          >
                            {testingId === ds.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <FaPlug className="text-cyan-400 text-sm group-hover:scale-110 transition-transform" />
                            )}
                          </button>

                          {/* Edit */}
                          <Protected role="route:analytics#resources-edit">
                            <button
                              onClick={() =>
                                navigate(`/analytics/datasources/${ds.id}/edit`)
                              }
                              className="w-8 h-8 bg-white/10 hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-blue-400/50 group"
                              title={t("Edit")}
                            >
                              <FaEdit className="text-blue-400 text-sm group-hover:scale-110 transition-transform" />
                            </button>
                          </Protected>

                          {/* Delete */}
                          <Protected role="route:analytics#delete-datasource">
                            <button
                              onClick={() => setDeleteTarget(ds)}
                              className="w-8 h-8 bg-white/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-red-400/50 group"
                              title={t("Delete")}
                            >
                              <FaTrash className="text-red-400 text-sm group-hover:scale-110 transition-transform" />
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

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title={t("Delete Datasource")}
            variant="danger"
            footer={
              <>
                <SecondaryButton onClick={() => setDeleteTarget(null)}>
                  {t("Cancel")}
                </SecondaryButton>
                <DangerButton onClick={handleDelete}>
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
                {t(
                  "This action cannot be undone. All queries using this datasource will fail."
                )}
              </p>
            </div>
          </Modal>
        )}
      </PageLayout>
    </Protected>
  );
};

export default AnalyticsDatasources;