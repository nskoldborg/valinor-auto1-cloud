import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaShieldAlt,
  FaInfoCircle,
  FaPlus,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
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

const RolesCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      const res = await fetch("http://10.46.0.140:8650/roles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to create role"));
      }

      setMessage({
        type: "success",
        message: t("Role created successfully!"),
      });
      setTimeout(() => navigate("/admin/user-roles"), 1200);
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
      title={t("Create Role")}
      description={t("Add a new role to define access permissions for users and groups.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/user-roles")}
          icon={FaArrowLeft}
          disabled={isSubmitting}
        >
          {t("Back to Roles")}
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
        {/* Role Details */}
        <Section
          title={t("Role Details")}
          description={t("Define the name and description for this role.")}
          icon={FaShieldAlt}
        >
          <div className="space-y-6">
            {/* Role Name */}
            <FormInput
              label={t("Role Name")}
              name="name"
              placeholder={t("e.g., System Administrator")}
              value={form.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              helperText={t("A unique, descriptive name for this role")}
              icon={FaShieldAlt}
            />

            {/* Description */}
            <FormTextarea
              label={t("Description")}
              name="description"
              placeholder={t("e.g., Full system access with administrative privileges")}
              value={form.description}
              onChange={handleChange}
              rows={4}
              disabled={isSubmitting}
              helperText={t("Provide a brief description of what this role is for")}
              icon={FaInfoCircle}
            />
          </div>
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
                <li>• {t("Role names must be unique across the system")}</li>
                <li>• {t("Roles can be assigned to users through groups")}</li>
                <li>• {t("After creation, you can assign permissions to this role")}</li>
                <li>• {t("Role changes affect all users and groups assigned to it")}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <SecondaryButton
            type="button"
            onClick={() => navigate("/admin/user-roles")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            icon={!isSubmitting && FaPlus}
          >
            {isSubmitting ? t("Creating...") : t("Create Role")}
          </PrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
};

export default RolesCreate;