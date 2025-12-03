import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaLightbulb,
  FaDesktop,
  FaServer,
  FaDatabase,
  FaBug,
  FaCode,
} from "react-icons/fa";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { Alert } from "@/components/ui/Alert";

const CreateFeatureModal = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: null,
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const typeOptions = [
    { value: "Frontend", label: t("Frontend"), icon: FaDesktop },
    { value: "Backend", label: t("Backend"), icon: FaCode },
    { value: "Server", label: t("Server"), icon: FaServer },
    { value: "Database", label: t("Database"), icon: FaDatabase },
    { value: "Bugfix", label: t("Bugfix"), icon: FaBug },
  ];

  const typeHelpText = {
    Frontend: t(
      "Use for UI / UX changes that affect layout, design, or page structure."
    ),
    Backend: t(
      "Use for logic, integrations, or API-level improvements to business processes."
    ),
    Server: t(
      "Use for infrastructure, deployment, or service configuration updates."
    ),
    Database: t(
      "Use for schema changes, migrations, performance tuning, or data integrity fixes."
    ),
    Bugfix: t(
      "Use for correcting existing functionality issues or minor regressions."
    ),
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = t("Title is required");
    }
    if (!form.description.trim()) {
      newErrors.description = t("Description is required");
    }
    if (!form.type) {
      newErrors.type = t("Type is required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    setMessage(null);

    if (!validateForm()) {
      setMessage({
        type: "error",
        message: t("Validation Error"),
        description: t("Please fill in all required fields."),
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type.value,
      };

      const res = await fetch("http://10.46.0.140:8650/feature-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || t("Failed to create request"));

      setMessage({
        type: "success",
        message: t("Feature Request Created"),
        description: t("Your feature request has been submitted successfully."),
      });

      setForm({ title: "", description: "", type: null });
      setErrors({});
      onCreated?.();

      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Creation Failed"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({ title: "", description: "", type: null });
      setMessage(null);
      setErrors({});
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={t("New Feature Request")}
      icon={FaLightbulb}
      footer={
        <div className="flex items-center justify-end gap-3">
          <SecondaryButton onClick={handleClose} disabled={loading}>
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton onClick={handleCreate} loading={loading}>
            {t("Create Request")}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Feedback message */}
        {message && (
          <Alert
            type={message.type}
            message={message.message}
            description={message.description}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Title */}
        <FormInput
          label={t("Title")}
          placeholder={t("Brief summary of your request...")}
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          icon={FaLightbulb}
          error={errors.title}
          required
          disabled={loading}
        />

        {/* Type */}
        <FormSelect
          label={t("Type")}
          options={typeOptions}
          value={form.type}
          onChange={(v) => handleChange("type", v)}
          placeholder={t("Select request type...")}
          error={errors.type}
          helperText={
            form.type
              ? typeHelpText[form.type.value]
              : t("Choose the category that best fits this request")
          }
          required
          disabled={loading}
        />

        {/* Description */}
        <FormTextarea
          label={t("Description")}
          placeholder={t(
            "Provide detailed information about your feature request or issue..."
          )}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={6}
          error={errors.description}
          helperText={t("Be as specific as possible to help us understand your needs")}
          required
          disabled={loading}
        />

        {/* Info box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <FaLightbulb className="text-blue-400 text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-blue-200 text-sm font-medium mb-1">
                {t("Submission Tips")}
              </p>
              <ul className="text-blue-200/70 text-xs space-y-1 list-disc list-inside">
                <li>{t("Use a clear and descriptive title")}</li>
                <li>{t("Explain the problem or improvement you're suggesting")}</li>
                <li>{t("Include any relevant context or use cases")}</li>
                <li>{t("Select the most appropriate category")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateFeatureModal;