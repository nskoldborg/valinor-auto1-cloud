import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUsers,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaPlus,
  FaArrowLeft,
  FaToggleOn,
  FaLayerGroup,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
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

const GroupsCreate = () => {
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

  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const statusOptions = [
    { value: true, label: t("Enabled") },
    { value: false, label: t("Disabled") },
  ];

  const matrixOptions = [
    { value: false, label: t("Included in Matrix Updates") },
    { value: true, label: t("Excluded from Matrix Updates") },
  ];

  // Fetch roles for dropdown
  useEffect(() => {
    if (!token) return;

    setLoadingRoles(true);
    fetch("http://10.46.0.140:8650/roles/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRoles(data || []);
        setLoadingRoles(false);
      })
      .catch(() => {
        setRoles([]);
        setLoadingRoles(false);
      });
  }, [token]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, selected) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selected?.value ?? false,
    }));
  };

  const handleRoleSelect = (selected) => {
    setFormData((prev) => ({
      ...prev,
      roles: selected ? selected.map((s) => s.value) : [],
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsCreating(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        exclude_from_matrix: formData.exclude_from_matrix,
        roles: formData.roles,
      };

      const res = await fetch("http://10.46.0.140:8650/groups/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to create group"));
      }

      setMessage({
        type: "success",
        message: t("Group created successfully!"),
      });
      setTimeout(() => navigate("/admin/user-groups"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        message: err.message,
      });
      setIsCreating(false);
    }
  };

  return (
    <PageLayout
      title={t("Create Group")}
      description={t("Add a new user group with roles and permissions.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/user-groups")}
          icon={FaArrowLeft}
        >
          {t("Back to Groups")}
        </SecondaryButton>
      }
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Group Information */}
        <Section
          title={t("Group Details")}
          description={t("Define the group name, description, and configuration.")}
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
              disabled={isCreating}
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
              disabled={isCreating}
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
              isDisabled={isCreating}
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
              isDisabled={isCreating}
              icon={FaLayerGroup}
              helperText={t("Control matrix update behavior for this group")}
            />
          </div>
        </Section>

        {/* Role Assignment */}
        <Section
          title={t("Role Assignment")}
          description={t("Assign one or more roles to define group permissions.")}
          icon={FaShieldAlt}
        >
          <FormMultiSelect
            label={t("Assigned Roles")}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={roles
              .filter((r) => formData.roles.includes(r.id))
              .map((r) => ({ value: r.id, label: r.name }))}
            onChange={handleRoleSelect}
            placeholder={
              loadingRoles
                ? t("Loading roles...")
                : t("Select roles for this group...")
            }
            isDisabled={isCreating || loadingRoles}
            icon={FaShieldAlt}
            helperText={t("Select multiple roles to assign to this group")}
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
                <li>• {t("Group names must be unique across the system")}</li>
                <li>• {t("Users assigned to this group will inherit all selected roles")}</li>
                <li>• {t("Matrix exclusion prevents automatic permission updates")}</li>
                <li>• {t("Disabled groups will not grant permissions to members")}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <SecondaryButton
            type="button"
            onClick={() => navigate("/admin/user-groups")}
            disabled={isCreating}
          >
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={isCreating}
            icon={!isCreating && FaPlus}
          >
            {isCreating ? t("Creating...") : t("Create Group")}
          </PrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
};

export default GroupsCreate;