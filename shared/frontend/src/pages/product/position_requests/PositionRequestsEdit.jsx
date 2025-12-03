import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaSave,
  FaInfoCircle,
  FaUsers,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton, DangerButton } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormInput } from "@/components/ui/FormInput";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { FormCheckbox } from "@/components/ui/FormCheckbox";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import StatusProgressBar from "@/components/ui/StatusProgressBar";

const PositionRequestEdit = () => {
  const { t } = useTranslation();
  const { request_id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state (separate from request data)
  const [form, setForm] = useState({
    assigned_to: null,
    groups: [],
    exclude_from_matrix: false,
    change_comment: "",
    approval_comment: "",
  });

  // ------------------------------------------------------------
  // Fetch helpers
  // ------------------------------------------------------------
  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/position-requests/${request_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch request");
      
      console.log("Fetched request data:", data);
      setRequest(data);

      // Map the data to form state
      const assignedUser = users.find((u) => u.value === data.assigned_to);
      
      const mappedGroups = data.groups
        ? groups.filter((g) =>
            data.groups.some((rg) => 
              (typeof rg === 'object' ? rg.id : rg) === g.value
            )
          )
        : [];

      setForm({
        assigned_to: assignedUser || null,
        groups: mappedGroups,
        exclude_from_matrix: data.exclude_from_matrix || false,
        change_comment: data.change_comment || "",
        approval_comment: data.approval_comment || "",
      });
    } catch (err) {
      console.error("Error fetching request:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Request"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://10.46.0.140:8650/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(
        data.map((u) => ({
          value: u.id,
          label:
            `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            u.email ||
            "Unknown",
        }))
      );
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("http://10.46.0.140:8650/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGroups(data.map((g) => ({ value: g.id, label: g.name })));
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchUsers(), fetchGroups()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch request after users and groups are loaded
  useEffect(() => {
    if (users.length > 0 && groups.length > 0) {
      fetchRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request_id, users.length, groups.length]);

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleApprovalAction = async (status) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        approval_status: status,
        approval_comment: form.approval_comment,
      };
      const res = await fetch(
        `http://10.46.0.140:8650/position-requests/${request_id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Approval failed");
      setMessage({
        type: "success",
        message: t("Success"),
        description: t("Request approved successfully."),
      });
      await fetchRequest();
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Approval Failed"),
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        assigned_to: form.assigned_to?.value || null,
        groups: form.groups?.map((g) => g.value) || [],
        exclude_from_matrix: form.exclude_from_matrix || false,
        change_comment: form.change_comment || "",
      };
      
      console.log("Saving configuration:", payload);
      
      const res = await fetch(
        `http://10.46.0.140:8650/position-requests/${request_id}/work`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      setMessage({
        type: "success",
        message: t("Success"),
        description: t("Changes saved successfully."),
      });
      await fetchRequest();
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Save Failed"),
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // Rendering helpers
  // ------------------------------------------------------------
  const statusStages = [
    "Created",
    "Pending Approval",
    "Approved",
    "Work in Progress",
    "Completed",
  ];

  const currentGroups =
    request?.current_groups?.length > 0
      ? request.current_groups.map((g) => (typeof g === 'object' ? g.name : g))
      : [];
      
  const requestedGroups =
    request?.requested_groups?.length > 0
      ? request.requested_groups.map((g) => (typeof g === 'object' ? g.name : g))
      : request?.groups?.map((g) => (typeof g === 'object' ? g.name : g)) || [];

  const isApproved = request?.approval_status === "Approved";
  const isPending =
    request?.approval_status === "Pending" || !request?.approval_status;

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      Created: { variant: "info", icon: FaInfoCircle },
      "Pending Approval": { variant: "warning", icon: FaExclamationTriangle },
      Approved: { variant: "success", icon: FaCheckCircle },
      "Work in Progress": { variant: "default", icon: FaUsers },
      Completed: { variant: "success", icon: FaCheckCircle },
      Rejected: { variant: "error", icon: FaTimesCircle },
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
  if (loading || !request) {
    return (
      <Protected role="route:product#position-changes">
        <PageLayout
          title={t("Loading...")}
          description={t("Loading request details...")}
          loading={true}
        />
      </Protected>
    );
  }

  return (
    <Protected role="route:product#position-changes">
      <PageLayout
        title={`${request.request_id || "—"} — ${
          request.position_name || t("Unnamed Position")
        }`}
        description={`${t("Position")}: ${request.position_name || "—"} | ${t(
          "Requested by"
        )}: ${request.requested_by_name || "—"}`}
        actions={
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status || "Created")}
            <SecondaryButton
              onClick={() => navigate("/product/position-requests")}
              icon={FaArrowLeft}
            >
              {t("Back to Requests")}
            </SecondaryButton>
          </div>
        }
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

        {/* Request Overview */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t("Request Overview")}
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-2">
                {t("Description")}
              </label>
              <p className="text-blue-100 bg-white/5 rounded-lg p-4 border border-white/10">
                {request.description || t("No description provided.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Groups */}
              <div>
                <label className="block text-sm font-medium text-blue-200/80 mb-2">
                  {t("Current Groups")}
                </label>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[100px]">
                  {currentGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentGroups.map((g, idx) => (
                        <Badge key={idx} variant="default">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 italic text-sm">
                      {t("None")}
                    </p>
                  )}
                </div>
              </div>

              {/* Requested Groups */}
              <div>
                <label className="block text-sm font-medium text-blue-200/80 mb-2">
                  {t("Requested Groups")}
                </label>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[100px]">
                  {requestedGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {requestedGroups.map((g, idx) => (
                        <Badge key={idx} variant="info">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 italic text-sm">
                      {t("None")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-6">
          <div className="flex items-center justify-center py-6">
            <StatusProgressBar
              stages={statusStages}
              currentStatus={request.status || "Created"}
            />
          </div>
        </Card>

        {/* Approval Flow */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <FaCheckCircle className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t("Approval Flow")}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label={t("Approval Status")}
                value={request.approval_status || "Pending Approval"}
                readOnly
                icon={FaInfoCircle}
              />
              <FormInput
                label={t("Approver Name")}
                value={request.approved_by_name || "—"}
                readOnly
                icon={FaUserTie}
              />
            </div>

            <FormTextarea
              label={t("Approval Comment")}
              value={form.approval_comment}
              onChange={(e) =>
                setForm({ ...form, approval_comment: e.target.value })
              }
              disabled={!isPending}
              rows={3}
              placeholder={t("Add approval comment...")}
            />

            {isPending && (
              <div className="flex justify-end gap-3 pt-4">
                <PrimaryButton
                  onClick={() => handleApprovalAction("Approved")}
                  disabled={saving}
                  icon={FaCheckCircle}
                >
                  {t("Approve")}
                </PrimaryButton>
                <DangerButton
                  onClick={() => handleApprovalAction("Rejected")}
                  disabled={saving}
                  icon={FaTimesCircle}
                >
                  {t("Reject")}
                </DangerButton>
              </div>
            )}
          </div>
        </Card>

        {/* Configuration (only if approved) */}
        {isApproved && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FaUsers className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Position Configuration")}
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label={t("Position Name")}
                  value={request.position_name || "—"}
                  readOnly
                  icon={FaUserTie}
                />

                <FormSelect
                  label={t("Assigned To")}
                  options={users}
                  value={form.assigned_to}
                  onChange={(v) => setForm({ ...form, assigned_to: v })}
                  placeholder={t("Select user...")}
                  icon={FaUserTie}
                />

                <div className="md:col-span-2">
                  <FormSelect
                    label={t("Groups")}
                    options={groups}
                    isMulti
                    value={form.groups}
                    onChange={(v) => setForm({ ...form, groups: v })}
                    placeholder={t("Select groups...")}
                    icon={FaUsers}
                  />
                </div>

                <FormCheckbox
                  label={t("Exclude from Matrix")}
                  checked={form.exclude_from_matrix}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      exclude_from_matrix: e.target.checked,
                    })
                  }
                />
              </div>

              <FormTextarea
                label={t("Changelog Comment")}
                value={form.change_comment}
                onChange={(e) =>
                  setForm({ ...form, change_comment: e.target.value })
                }
                rows={3}
                placeholder={t("Describe the changes made...")}
              />

              <div className="flex justify-end pt-4">
                <PrimaryButton
                  onClick={handleSaveConfiguration}
                  disabled={saving}
                  icon={FaSave}
                >
                  {saving ? t("Saving...") : t("Save Configuration")}
                </PrimaryButton>
              </div>
            </div>
          </Card>
        )}
      </PageLayout>
    </Protected>
  );
};

export default PositionRequestEdit;