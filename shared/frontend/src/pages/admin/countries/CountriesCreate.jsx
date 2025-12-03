import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaGlobe,
  FaCheckCircle,
  FaPlus,
  FaArrowLeft,
  FaInfoCircle,
  FaToggleOn,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
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

const CountriesCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    code: "",
    enabled: true,
  });

  const [message, setMessage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const statusOptions = [
    { value: true, label: t("Enabled") },
    { value: false, label: t("Disabled") },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    setIsCreating(true);

    const payload = {
      name: form.name.trim(),
      code: form.code.toUpperCase().trim(),
      enabled: form.enabled,
    };

    fetch("http://10.46.0.140:8650/countries/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || t("Failed to create country"));
        }
        return res.json();
      })
      .then(() => {
        setMessage({
          type: "success",
          message: t("Country created successfully!"),
        });
        setTimeout(() => navigate("/admin/countries"), 1200);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          message: err.message,
        });
        setIsCreating(false);
      });
  };

  return (
    <PageLayout
      title={t("Create Country")}
      description={t("Add a new country to the system with its details and status.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/countries")}
          icon={FaArrowLeft}
        >
          {t("Back to Countries")}
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
        {/* Basic Country Information */}
        <Section
          title={t("Country Details")}
          description={t("Enter the country name, ISO code, and activation status.")}
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
              disabled={isCreating}
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
              disabled={isCreating}
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
              isDisabled={isCreating}
              helperText={t("Enable or disable this country in the system")}
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
                <li>• {t("Country codes must be unique and follow ISO 3166-1 alpha-2 standard")}</li>
                <li>• {t("Country names should be in English for consistency")}</li>
                <li>• {t("Disabled countries will not appear in user-facing dropdowns")}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <SecondaryButton
            type="button"
            onClick={() => navigate("/admin/countries")}
            disabled={isCreating}
          >
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={isCreating}
            icon={!isCreating && FaPlus}
          >
            {isCreating ? t("Creating...") : t("Create Country")}
          </PrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
};

export default CountriesCreate;