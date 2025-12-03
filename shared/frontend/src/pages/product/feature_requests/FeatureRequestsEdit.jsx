import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaRocket,
  FaUndo,
  FaComment,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaChartLine,
  FaLightbulb,
  FaCode,
  FaInfoCircle,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormInput } from "@/components/ui/FormInput";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ReleaseFeatureModal from "@/components/modals/ReleaseFeatureModal";
import "react-quill/dist/quill.snow.css";

const FeatureRequestsEdit = () => {
  const { t } = useTranslation();
  const { feature_id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  const [form, setForm] = useState({
    status: null,
    update_level: null,
    main_category: null,
    main_feature: null,
    version_target: "",
    assigned_to: null,
    impact: 0,
    confidence: 0,
    ease: 0,
  });

  // ------------------------------------------------------------
  // Helper: bump version
  // ------------------------------------------------------------
  const bumpSemver = (current, level) => {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current || "0.0.0");
    if (!m) return "0.0.1";
    let [, major, minor, patch] = m.map(Number);
    if (level === "major") return `${major + 1}.0.0`;
    if (level === "minor") return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  };

  // ------------------------------------------------------------
  // API helpers
  // ------------------------------------------------------------
  const fetchCurrentVersion = async (key) => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/releases/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return "0.0.0";
      const data = await res.json();
      return data.current_version || "0.0.0";
    } catch {
      return "0.0.0";
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

  const fetchFeature = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${feature_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Failed to fetch feature"));

      let detectedCategory = null;
      if (data.main_feature?.includes("frontend")) detectedCategory = "Frontend";
      else if (data.main_feature?.includes("backend")) detectedCategory = "Backend";

      setFeature(data);

      const assignedUserOption =
        users.find((u) => u.value === data.assigned_to) || null;

      setForm({
        status: data.status ? { value: data.status, label: data.status } : null,
        update_level: data.update_level
          ? { value: data.update_level, label: data.update_level }
          : null,
        main_category: detectedCategory
          ? { value: detectedCategory, label: detectedCategory }
          : null,
        main_feature:
          (detectedCategory &&
            mainFeatureGroups[detectedCategory]?.find(
              (m) => m.value === data.main_feature
            )) ||
          null,
        version_target: data.version_target || "",
        assigned_to: assignedUserOption,
        impact: data.impact || 0,
        confidence: data.confidence || 0,
        ease: data.ease || 0,
      });
    } catch (err) {
      console.error("Error loading feature:", err);
      setMessage({
        type: "error",
        message: t("Error Loading Feature"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUsers();
      await fetchFeature();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature_id]);

  // Auto version calc
  useEffect(() => {
    const autoCalcVersion = async () => {
      if (form.main_feature?.value && form.update_level?.value) {
        const currentVersion = await fetchCurrentVersion(form.main_feature.value);
        const next = bumpSemver(currentVersion, form.update_level.value);
        setForm((prev) => ({ ...prev, version_target: next }));
      }
    };
    autoCalcVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.main_feature, form.update_level]);

  // ------------------------------------------------------------
  // Save / Comments / Reopen
  // ------------------------------------------------------------
  const handleSave = async (overrideStatus = null) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        status: overrideStatus || form.status?.value,
        update_level: form.update_level?.value,
        main_feature: form.main_feature?.value || null,
        version_target: form.version_target || null,
        assigned_to: form.assigned_to?.value || null,
        impact: form.impact,
        confidence: form.confidence,
        ease: form.ease,
      };

      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${feature_id}/work`,
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
      if (!res.ok) throw new Error(data.detail || t("Update failed"));
      setMessage({
        type: "success",
        message: t("Changes Saved"),
        description: t("Feature request updated successfully."),
      });
      fetchFeature();
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

  const handleReopen = async () => {
    const reason = prompt(t("Enter a reason for reopening this feature:"), "");
    if (reason === null) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${feature_id}/reopen`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reason || t("No reason provided") }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Failed to reopen feature"));

      setMessage({
        type: "success",
        message: t("Feature Reopened"),
        description: `${t("New status")}: ${data.new_status}`,
      });

      await fetchFeature();
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Reopen Failed"),
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${feature_id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment_text: newComment }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Failed to add comment"));
      setNewComment("");
      fetchFeature();
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Comment Failed"),
        description: err.message,
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${feature_id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(t("Failed to delete comment"));
      setDeleteConfirmId(null);
      fetchFeature();
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Delete Failed"),
        description: err.message,
      });
    }
  };

  // ------------------------------------------------------------
  // Static options
  // ------------------------------------------------------------
  const mainFeatureGroups = {
    Frontend: [
      { value: "admin-countries-frontend", label: "Admin Countries" },
      { value: "admin-users-frontend", label: "Admin Users" },
      { value: "admin-user-positions-frontend", label: "Admin User Positions" },
      { value: "admin-user-groups-frontend", label: "Admin User Group" },
      { value: "admin-user-roles-frontend", label: "Admin User Roles" },
      { value: "admin-position-matrix-frontend", label: "Admin Position Matrix" },
      { value: "batch-uploader-frontend", label: "Batch Uploader" },
      { value: "feature-requests-frontend", label: "Feature Requests" },
      { value: "position-requests-frontend", label: "Position Requests" },
      { value: "backend-jobs-frontend", label: "Backend Jobs" },
      { value: "analytics-queries-frontend", label: "Queries" },
      { value: "analytics-unpublished-queries-frontend", label: "Unpublished Queries" },
      { value: "analytics-reportinator-v2-frontend", label: "Reportinator V2" },
      { value: "analytics-datasources-frontend", label: "Datasources" },
      { value: "employees-frontend", label: "Employees" },
      { value: "onboarding-frontend", label: "Onboarding" },
      { value: "offboarding-frontend", label: "Offboarding" },
      { value: "home-frontend", label: "Home" },
      { value: "support-widget-frontend", label: "Support" },
      { value: "about-frontend", label: "About" },
      { value: "schema-migration-widget-frontend", label: "Schema Migrator" },
    ],
    Backend: [
      { value: "admin-countries-backend", label: "Admin Countries" },
      { value: "admin-users-backend", label: "Admin Users" },
      { value: "admin-user-positions-backend", label: "Admin User Positions" },
      { value: "admin-user-groups-backend", label: "Admin User Group" },
      { value: "admin-user-roles-backend", label: "Admin User Roles" },
      { value: "admin-position-matrix-backend", label: "Admin Position Matrix" },
      { value: "batch-uploader-backend", label: "Batch Uploader" },
      { value: "feature-requests-backend", label: "Feature Requests" },
      { value: "position-requests-backend", label: "Position Requests" },
      { value: "backend-jobs-backend", label: "Backend Jobs" },
      { value: "analytics-queries-backend", label: "Queries" },
      { value: "analytics-unpublished-queries-backend", label: "Unpublished Queries" },
      { value: "analytics-reportinator-v2-backend", label: "Reportinator V2" },
      { value: "analytics-datasources-backend", label: "Datasources" },
      { value: "employees-backend", label: "Employees" },
      { value: "onboarding-backend", label: "Onboarding" },
      { value: "offboarding-backend", label: "Offboarding" },
      { value: "home-backend", label: "Home" },
      { value: "support-widget-backend", label: "Support" },
      { value: "about-backend", label: "About" },
      { value: "schema-migration-widget-backend", label: "Schema Migrator" },
    ],
  };

  const mainCategories = Object.keys(mainFeatureGroups).map((key) => ({
    value: key,
    label: key,
  }));

  const statusOptions = [
    { value: "New", label: "New" },
    { value: "In Review", label: "In Review" },
    { value: "On Hold", label: "On Hold" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
    { value: "Backlogg", label: "Backlogg" },
    { value: "In Development", label: "In Development" },
    { value: "Ready for Test", label: "Ready for Test" },
    { value: "Pending Release", label: "Pending Release" },
    { value: "Released", label: "Released" },
  ];

  const updateLevelOptions = [
    { value: "major", label: "Major (1.x.x)" },
    { value: "minor", label: "Minor (x.1.x)" },
    { value: "patch", label: "Patch (x.x.1)" },
  ];

  // ------------------------------------------------------------
  // Stage visualization
  // ------------------------------------------------------------
  const stages = [
    { name: "New", icon: FaLightbulb },
    { name: "In Review", icon: FaInfoCircle },
    { name: "In Development", icon: FaCode },
    { name: "Ready for Test", icon: FaCheckCircle },
    { name: "Pending Release", icon: FaClock },
    { name: "Released", icon: FaRocket },
  ];

  const renderStageBar = (status) => {
    const currentIndex = stages.findIndex((s) => s.name === status);
    return (
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center text-center flex-shrink-0">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 scale-110"
                        : "bg-gradient-to-br from-blue-600 to-blue-700 shadow-md"
                      : "bg-white/10 border border-white/20"
                  }`}
                >
                  <Icon
                    className={`text-lg ${
                      isActive ? "text-white" : "text-blue-200/40"
                    }`}
                  />
                </div>
                <div
                  className={`mt-2 text-xs font-medium w-[100px] transition-colors ${
                    isActive ? "text-white" : "text-blue-200/40"
                  }`}
                >
                  {stage.name}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`flex-1 h-[3px] mx-2 rounded-full transition-all duration-300 ${
                    i < currentIndex
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

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  const calculatedICE = ((form.impact + form.confidence + form.ease) / 3).toFixed(2);

  return (
    <Protected role="route:product#features-edit">
      <PageLayout
        title={
          <div className="space-y-3">
            <div>{feature ? `#${feature.feature_id} — ${feature.title}` : t("Loading...")}</div>
            {feature && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="info" icon={FaCode}>
                  {feature.main_feature || "—"}
                </Badge>
                <Badge variant="default">v{feature.version_target || "—"}</Badge>
                <Badge variant="warning">{feature.type}</Badge>
                <Badge variant="default" icon={FaClock}>
                  {new Date().toISOString().split('T')[0]}
                </Badge>
              </div>
            )}
          </div>
        }
        actions={
          feature ? (
            <div className="flex flex-wrap gap-3 items-center">
              {/* Action Buttons */}
              {feature.status === "Pending Release" && (
                <PrimaryButton
                  onClick={() => setShowReleaseModal(true)}
                  icon={FaRocket}
                >
                  {t("Release Feature")}
                </PrimaryButton>
              )}
              {feature.status === "Released" && (
                <SecondaryButton
                  onClick={handleReopen}
                  disabled={saving}
                  icon={FaUndo}
                >
                  {saving ? t("Reopening...") : t("Re-Open Feature")}
                </SecondaryButton>
              )}
              {feature.status !== "Released" &&
                feature.status !== "Pending Release" && (
                  <>
                    <SecondaryButton onClick={() => navigate(-1)} icon={FaTimes}>
                      {t("Cancel")}
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={() => handleSave()}
                      disabled={saving}
                      icon={FaSave}
                    >
                      {saving ? t("Saving...") : t("Save Changes")}
                    </PrimaryButton>
                  </>
                )}
            </div>
          ) : null
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

        {!loading && !feature && (
          <Card className="mb-6">
            <div className="text-center py-12">
              <p className="text-red-400 font-medium">
                {t("Feature not found or failed to load.")}
              </p>
              <SecondaryButton
                onClick={() => navigate(-1)}
                icon={FaTimes}
                className="mt-4"
              >
                {t("Go Back")}
              </SecondaryButton>
            </div>
          </Card>
        )}

        {!loading && feature && (
          <>
            {/* Feature Overview */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaLightbulb className="text-blue-400" />
                {t("Feature Overview")}
              </h3>
              <p className="text-blue-200/90 leading-relaxed">
                {feature.description || t("No description provided.")}
              </p>
            </Card>

            {/* Progress Stages */}
            <Card className="mb-6">
              <div className="py-8">{renderStageBar(feature.status)}</div>
            </Card>

            {/* Configuration */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FaEdit className="text-purple-400" />
                {t("Configuration")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  label={t("Status")}
                  options={statusOptions}
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  icon={FaCheckCircle}
                />

                <FormSelect
                  label={t("Update Level")}
                  options={updateLevelOptions}
                  value={form.update_level}
                  onChange={(v) => setForm({ ...form, update_level: v })}
                  icon={FaChartLine}
                />

                <div className="md:col-span-2 space-y-4">
                  <FormSelect
                    label={t("Main Category")}
                    options={mainCategories}
                    value={form.main_category}
                    onChange={(v) =>
                      setForm({ ...form, main_category: v, main_feature: null })
                    }
                    placeholder={t("Select category...")}
                    icon={FaCode}
                  />
                  {form.main_category && (
                    <FormSelect
                      label={t("Main Feature")}
                      options={mainFeatureGroups[form.main_category.value]}
                      value={form.main_feature}
                      onChange={(v) => setForm({ ...form, main_feature: v })}
                      placeholder={t("Select specific feature...")}
                      icon={FaCode}
                    />
                  )}
                </div>

                <FormInput
                  label={t("Version Target")}
                  type="text"
                  value={form.version_target}
                  onChange={(e) =>
                    setForm({ ...form, version_target: e.target.value })
                  }
                  icon={FaRocket}
                />

                <FormSelect
                  label={t("Assigned To")}
                  options={users}
                  value={form.assigned_to}
                  onChange={(v) => setForm({ ...form, assigned_to: v })}
                  placeholder={t("Select user...")}
                  icon={FaUser}
                />
              </div>
            </Card>

            {/* ICE Scoring */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FaChartLine className="text-green-400" />
                {t("ICE Scoring")}
              </h3>

              <div className="grid grid-cols-3 gap-6 mb-6">
                {["impact", "confidence", "ease"].map((field) => (
                  <FormInput
                    key={field}
                    label={t(field.charAt(0).toUpperCase() + field.slice(1))}
                    type="number"
                    min="0"
                    max="10"
                    value={form[field]}
                    onChange={(e) =>
                      setForm({ ...form, [field]: Number(e.target.value) })
                    }
                    icon={FaChartLine}
                  />
                ))}
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 font-medium">
                    {t("ICE Score")}:
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      calculatedICE >= 7
                        ? "text-green-400"
                        : calculatedICE >= 4
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {calculatedICE}
                  </span>
                </div>
              </div>
            </Card>

            {/* Comments */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FaComment className="text-cyan-400" />
                {t("Comments")} ({feature.comments?.length || 0})
              </h3>

              {feature.comments?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaComment className="text-blue-400/60 text-2xl" />
                  </div>
                  <p className="text-blue-200/60">{t("No comments yet.")}</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {feature.comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FaUser className="text-white text-xs" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {c.author}
                            </p>
                            <p className="text-xs text-blue-200/60">{c.created_at}</p>
                          </div>
                        </div>
                        <Protected role="route:product#features-comment-delete">
                          {deleteConfirmId === c.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-200/70">
                                {t("Delete?")}
                              </span>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-xs text-red-400 font-semibold hover:text-red-300"
                              >
                                {t("Yes")}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs text-blue-200/70 hover:text-white"
                              >
                                {t("No")}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(c.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title={t("Delete comment")}
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </Protected>
                      </div>
                      <div
                        className="text-sm text-blue-200/90 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: c.comment_text }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Protected role="route:product#features-comment">
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    placeholder={t("Add a comment...")}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <PrimaryButton
                      onClick={handleAddComment}
                      icon={FaComment}
                      disabled={!newComment.trim()}
                    >
                      {t("Post Comment")}
                    </PrimaryButton>
                  </div>
                </div>
              </Protected>
            </Card>
          </>
        )}
      </PageLayout>

      {/* Release Modal */}
      {feature && (
        <ReleaseFeatureModal
          open={showReleaseModal}
          onClose={() => setShowReleaseModal(false)}
          featureId={feature_id}
          token={token}
          onSuccess={fetchFeature}
        />
      )}
    </Protected>
  );
};

export default FeatureRequestsEdit;