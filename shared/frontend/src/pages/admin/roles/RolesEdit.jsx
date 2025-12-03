import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaShieldAlt,
  FaInfoCircle,
  FaSave,
  FaArrowLeft,
  FaEdit,
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

const RolesEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch role details
  useEffect(() => {
    if (!token || !id) return;

    setLoading(true);
    setError(null);

    fetch(`http://10.46.0.140:8650/roles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || t("Failed to load role"));
        }
        return res.json();
      })
      .then((data) => {
        setForm({
          name: data.name || "",
          description: data.description || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        comment: comment || null,
      };

      const res = await fetch(`http://10.46.0.140:8650/roles/${id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to update role"));
      }

      setMessage({
        type: "success",
        message: t("Role updated successfully!"),
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
      title={t("Edit Role")}
      description={t("Update the role's name and description.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/user-roles")}
          icon={FaArrowLeft}
          disabled={isSubmitting}
        >
          {t("Back to Roles")}
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
      {form && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Role Information */}
          <Section
            title={t("Role Details")}
            description={t("Modify the role's name and description.")}
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
              placeholder={t("e.g., Updated description to reflect new responsibilities")}
              disabled={isSubmitting}
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
                  <li>• {t("Changes to role details will affect all users and groups assigned to this role")}</li>
                  <li>• {t("Role name changes may impact integrations and reports")}</li>
                  <li>• {t("All changes are logged in the audit trail for compliance")}</li>
                  <li>• {t("Consider notifying affected users of significant role changes")}</li>
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
              icon={!isSubmitting && FaSave}
            >
              {isSubmitting ? t("Saving...") : t("Save Changes")}
            </PrimaryButton>
          </div>
        </form>
      )}
    </PageLayout>
  );
};

export default RolesEdit;