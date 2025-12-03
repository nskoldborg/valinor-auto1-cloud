import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaGlobe,
  FaCheckCircle,
  FaSave,
  FaArrowLeft,
  FaEdit,
  FaInfoCircle,
  FaToggleOn,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
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

const CountriesEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { value: true, label: t("Enabled") },
    { value: false, label: t("Disabled") },
  ];

  // Fetch country data
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`http://10.46.0.140:8650/countries/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((c) => c.id === Number(id));
        if (found) {
          setForm({
            name: found.name,
            code: found.code,
            enabled: found.enabled,
          });
        } else {
          setError(t("Country not found"));
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError(t("Failed to load country"));
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const payload = {
      name: form.name.trim(),
      code: form.code.toUpperCase().trim(),
      enabled: form.enabled,
      comment: comment || null,
    };

    fetch(`http://10.46.0.140:8650/countries/${id}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || t("Failed to update country"));
        }
        return res.json();
      })
      .then(() => {
        setMessage({
          type: "success",
          message: t("Country updated successfully!"),
        });
        setTimeout(() => navigate("/admin/countries"), 1200);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          message: err.message,
        });
        setIsSaving(false);
      });
  };

  return (
    <PageLayout
      title={t("Edit Country")}
      description={t("Update country details and status in the system.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/countries")}
          icon={FaArrowLeft}
        >
          {t("Back to Countries")}
        </SecondaryButton>
      }
      loading={isLoading}
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
          {/* Basic Country Information */}
          <Section
            title={t("Country Details")}
            description={t("Modify the country name, ISO code, and activation status.")}
            icon={FaGlobe}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Name */}
              <FormInput
                label={t("Country Name")}
                type="text"
                placeholder={t("e.g., Sweden")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={isSaving}
                helperText={t("Full name of the country")}
                icon={FaGlobe}
              />

              {/* Country Code */}
              <FormInput
                label={t("Country Code")}
                type="text"
                placeholder={t("e.g., SE")}
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
                maxLength={2}
                disabled={isSaving}
                className="font-mono font-bold uppercase"
                helperText={t("2-letter ISO code (e.g., SE, NO, DK)")}
                icon={FaInfoCircle}
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <FormSelect
                label={t("Status")}
                options={statusOptions}
                value={statusOptions.find((o) => o.value === form.enabled)}
                onChange={(selected) =>
                  setForm({ ...form, enabled: selected?.value ?? true })
                }
                placeholder={t("Select status...")}
                isDisabled={isSaving}
                icon={FaToggleOn}
                helperText={t("Enable or disable this country in the system")}
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
              placeholder={t("e.g., Updated country name to match official records")}
              disabled={isSaving}
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
                  <li>• {t("Changes to country codes may affect existing user records")}</li>
                  <li>• {t("Disabling a country will hide it from user-facing dropdowns")}</li>
                  <li>• {t("All changes are logged in the audit trail for compliance")}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <SecondaryButton
              type="button"
              onClick={() => navigate("/admin/countries")}
              disabled={isSaving}
            >
              {t("Cancel")}
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={isSaving}
              icon={!isSaving && FaSave}
            >
              {isSaving ? t("Saving...") : t("Save Changes")}
            </PrimaryButton>
          </div>
        </form>
      )}
    </PageLayout>
  );
};

export default CountriesEdit;