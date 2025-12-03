import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBriefcase,
  FaUsers,
  FaInfoCircle,
  FaPlus,
  FaArrowLeft,
  FaExclamationTriangle,
  FaToggleOn,
  FaLayerGroup,
  FaCheckCircle,
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

const PositionsCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: true,
    exclude_from_matrix: false,
    risk_level: "Low",
    groups: [],
  });

  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const statusOptions = [
    { value: true, label: t("Enabled") },
    { value: false, label: t("Disabled") },
  ];

  const matrixOptions = [
    { value: false, label: t("Included in Matrix Updates") },
    { value: true, label: t("Excluded from Matrix Updates") },
  ];

  const riskLevelOptions = [
    { value: "Low", label: t("Low") },
    { value: "Medium", label: t("Medium") },
    { value: "High", label: t("High") },
  ];

  // Fetch groups for assignment
  useEffect(() => {
    if (!token) return;

    setLoadingGroups(true);
    fetch("http://10.46.0.140:8650/groups/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setGroups(data || []);
        setLoadingGroups(false);
      })
      .catch(() => {
        setGroups([]);
        setLoadingGroups(false);
      });
  }, [token]);

  // Handle input and select changes
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
      [name]: selected ? selected.value : null,
    }));
  };

  const handleGroupSelect = (selected) => {
    setFormData((prev) => ({
      ...prev,
      groups: selected ? selected.map((s) => s.value) : [],
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const payload = { ...formData };

      const res = await fetch("http://10.46.0.140:8650/positions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to create position"));
      }

      setMessage({
        type: "success",
        message: t("Position created successfully!"),
      });
      setTimeout(() => navigate("/admin/user-positions"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        message: err.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title={t("Create Position")}
      description={t("Add a new user position with groups and risk assessment.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/user-positions")}
          icon={FaArrowLeft}
        >
          {t("Back to Positions")}
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
        {/* Basic Position Information */}
        <Section
          title={t("Position Details")}
          description={t("Define the position name, description, and configuration.")}
          icon={FaBriefcase}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("Position Name")}
              name="name"
              placeholder={t("e.g., Chief Financial Officer")}
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              helperText={t("A unique, descriptive name for this position")}
              icon={FaBriefcase}
            />
            <FormInput
              label={t("Description")}
              name="description"
              placeholder={t("e.g., Oversees financial operations")}
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              helperText={t("Brief description of the position's purpose")}
              icon={FaInfoCircle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <FormSelect
              label={t("Status")}
              options={statusOptions}
              value={statusOptions.find((s) => s.value === formData.enabled)}
              onChange={(selected) => handleSelectChange("enabled", selected)}
              placeholder={t("Select status...")}
              isDisabled={isSubmitting}
              icon={FaToggleOn}
              helperText={t("Enable or disable this position")}
            />

            {/* Matrix Inclusion */}
            <FormSelect
              label={t("Matrix Inclusion")}
              options={matrixOptions}
              value={matrixOptions.find(
                (s) => s.value === formData.exclude_from_matrix
              )}
              onChange={(selected) =>
                handleSelectChange("exclude_from_matrix", selected)
              }
              placeholder={t("Select matrix behavior...")}
              isDisabled={isSubmitting}
              icon={FaLayerGroup}
              helperText={t("Control matrix update behavior")}
            />

            {/* Risk Level */}
            <FormSelect
              label={t("Risk Level")}
              options={riskLevelOptions}
              value={riskLevelOptions.find(
                (s) => s.value === formData.risk_level
              )}
              onChange={(selected) =>
                handleSelectChange("risk_level", selected)
              }
              placeholder={t("Select risk level...")}
              isDisabled={isSubmitting}
              icon={FaExclamationTriangle}
              helperText={t("Assign a risk level to this position")}
            />
          </div>
        </Section>

        {/* Group Assignment */}
        <Section
          title={t("Group Assignment")}
          description={t("Assign this position to one or more user groups.")}
          icon={FaUsers}
        >
          <FormMultiSelect
            label={t("Assigned Groups")}
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            value={groups
              .filter((g) => formData.groups.includes(g.id))
              .map((g) => ({ value: g.id, label: g.name }))}
            onChange={handleGroupSelect}
            placeholder={
              loadingGroups
                ? t("Loading groups...")
                : t("Select groups for this position...")
            }
            isDisabled={isSubmitting || loadingGroups}
            icon={FaUsers}
            helperText={t("Select multiple groups to assign to this position")}
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
                <li>• {t("Position names must be unique across the system")}</li>
                <li>• {t("Users assigned to this position will inherit all group permissions")}</li>
                <li>• {t("Risk levels help identify positions requiring additional oversight")}</li>
                <li>• {t("Matrix exclusion prevents automatic permission updates")}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <SecondaryButton
            type="button"
            onClick={() => navigate("/admin/user-positions")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            icon={!isSubmitting && FaPlus}
          >
            {isSubmitting ? t("Creating...") : t("Create Position")}
          </PrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
};

export default PositionsCreate;