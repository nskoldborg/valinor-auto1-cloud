import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUsers,
  FaShieldAlt,
  FaInfoCircle,
  FaSave,
  FaArrowLeft,
  FaEdit,
  FaToggleOn,
  FaLayerGroup,
  FaCheckCircle,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormMultiSelect } from "@/components/ui/FormMultiSelect";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const Section = ({ title, description, icon: Icon, children }) => (
  <Card padding="none">
    <div className="bg-white/5 border-b border-white/10 px-6 py-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Icon className="text-white text-lg" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-blue-200/70 text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </Card>
);

const GroupsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: true,
    exclude_from_matrix: false,
    roles: [],
  });
  const [allRoles, setAllRoles] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: true, label: t("Enabled") },
    { value: false, label: t("Disabled") },
  ];

  const matrixOptions = [
    { value: false, label: t("Included in Matrix Updates") },
    { value: true, label: t("Excluded from Matrix Updates") },
  ];

  // Fetch group + roles
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`http://10.46.0.140:8650/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://10.46.0.140:8650/roles/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([groupRes, rolesRes]) => {
        if (!groupRes.ok) throw new Error(t("Failed to load group"));
        if (!rolesRes.ok) throw new Error(t("Failed to load roles"));

        const groupData = await groupRes.json();
        const rolesData = await rolesRes.json();

        setFormData({
          name: groupData.name,
          description: groupData.description || "",
          enabled: !!groupData.enabled,
          exclude_from_matrix: !!groupData.exclude_from_matrix,
          roles: groupData.roles ? groupData.roles.map((r) => r.id) : [],
        });

        setAllRoles(rolesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selected) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selected?.value ?? false,
    }));
  };

  const handleMultiSelect = (selected) => {
    setFormData((prev) => ({
      ...prev,
      roles: selected ? selected.map((s) => s.value) : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsUpdating(true);

    const payload = { ...formData, comment: comment || null };

    try {
      const res = await fetch(`http://10.46.0.140:8650/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to update group"));
      }

      setMessage({
        type: "success",
        message: t("Group updated successfully!"),
      });
      setTimeout(() => navigate("/admin/user-groups"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        message: err.message,
      });
      setIsUpdating(false);
    }
  };

  return (
    <PageLayout
      title={t("Edit Group")}
      description={t("Update group details, status, and role assignments.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/user-groups")}
          icon={FaArrowLeft}
        >
          {t("Back to Groups")}
        </SecondaryButton>
      }
      loading={loading}
      error={error}
    >
      {/* Feedback messages */}
      {message && (
        <div className="mb-6">
          <Alert
            type={message.type}
            message={message.message}
            icon={message.type === "success" ? <FaCheckCircle /> : undefined}
            onClose={() => setMessage(null)}
          />
        </div>
      )}

      {/* Form */}
      {formData && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Group Information */}
          <Section
            title={t("Group Details")}
            description={t("Modify the group's name, description, and configuration.")}
            icon={FaUsers}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Group Name */}
              <FormInput
                label={t("Group Name")}
                name="name"
                placeholder={t("e.g., Administrators")}
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isUpdating}
                helperText={t("A unique, descriptive name for this group")}
                icon={FaUsers}
              />

              {/* Description */}
              <FormInput
                label={t("Description")}
                name="description"
                placeholder={t("e.g., System administrators")}
                value={formData.description}
                onChange={handleChange}
                disabled={isUpdating}
                helperText={t("Brief description of the group's purpose")}
                icon={FaInfoCircle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <FormSelect
                label={t("Status")}
                options={statusOptions}
                value={statusOptions.find((s) => s.value === formData.enabled)}
                onChange={(selected) => handleSelectChange("enabled", selected)}
                placeholder={t("Select status...")}
                isDisabled={isUpdating}
                icon={FaToggleOn}
                helperText={t("Enable or disable this group")}
              />

              {/* Matrix Inclusion */}
              <FormSelect
                label={t("Matrix Inclusion")}
                options={matrixOptions}
                value={matrixOptions.find(
                  (m) => m.value === formData.exclude_from_matrix
                )}
                onChange={(selected) =>
                  handleSelectChange("exclude_from_matrix", selected)
                }
                placeholder={t("Select matrix behavior...")}
                isDisabled={isUpdating}
                icon={FaLayerGroup}
                helperText={t("Control matrix update behavior for this group")}
              />
            </div>
          </Section>

          {/* Role Assignment */}
          <Section
            title={t("Role Assignment")}
            description={t("Update which roles this group includes.")}
            icon={FaShieldAlt}
          >
            <FormMultiSelect
              label={t("Assigned Roles")}
              options={allRoles.map((r) => ({ value: r.id, label: r.name }))}
              value={allRoles
                .filter((r) => formData.roles.includes(r.id))
                .map((r) => ({ value: r.id, label: r.name }))}
              onChange={handleMultiSelect}
              placeholder={t("Select roles for this group...")}
              isDisabled={isUpdating}
              icon={FaShieldAlt}
              helperText={t("Select multiple roles to assign to this group")}
            />
          </Section>

          {/* Edit Comment */}
          <Section
            title={t("Change Log")}
            description={t("Document the reason for this update (optional).")}
            icon={FaEdit}
          >
            <FormTextarea
              label={t("Comment (Optional)")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={t("e.g., Updated roles to include new permissions")}
              disabled={isUpdating}
              helperText={t("This comment is for audit trail purposes only")}
              icon={FaInfoCircle}
            />
          </Section>

          {/* Info Card */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-400 text-xl mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  {t("Important Information")}
                </h4>
                <ul className="text-xs text-blue-200/70 space-y-1">
                  <li>• {t("Changes to group roles will affect all users in this group")}</li>
                  <li>• {t("Disabling a group will remove permissions from all members")}</li>
                  <li>• {t("Matrix exclusion prevents automatic permission updates")}</li>
                  <li>• {t("All changes are logged in the audit trail for compliance")}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <SecondaryButton
              type="button"
              onClick={() => navigate("/admin/user-groups")}
              disabled={isUpdating}
            >
              {t("Cancel")}
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={isUpdating}
              icon={!isUpdating && FaSave}
            >
              {isUpdating ? t("Saving...") : t("Save Changes")}
            </PrimaryButton>
          </div>
        </form>
      )}
    </PageLayout>
  );
};

export default GroupsEdit;