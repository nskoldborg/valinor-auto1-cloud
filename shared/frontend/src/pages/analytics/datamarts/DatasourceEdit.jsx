import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaDatabase,
  FaServer,
  FaUser,
  FaLock,
  FaNetworkWired,
  FaToggleOn,
  FaToggleOff,
  FaSave,
  FaTimes,
  FaPlug,
  FaArrowLeft,
  FaEdit,
  FaInfoCircle,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Protected from "@/components/Protected";

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

const DatasourcesEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState({});

  // Database type options
  const databaseTypes = [
    { value: "postgresql", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
    { value: "mssql", label: "MS SQL Server" },
    { value: "oracle", label: "Oracle" },
    { value: "mongodb", label: "MongoDB" },
  ];

  // Default ports for database types
  const defaultPorts = {
    postgresql: "5432",
    mysql: "3306",
    mssql: "1433",
    oracle: "1521",
    mongodb: "27017",
  };

  // Fetch datasource details
  useEffect(() => {
    if (!token || !id) return;

    setLoading(true);
    setError(null);

    fetch(`http://10.46.0.140:8650/analytics/resources/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || t("Failed to load datasource"));
        }
        return res.json();
      })
      .then((data) => {
        // Find the matching database type option
        const typeOption = databaseTypes.find(
          (type) => type.value === data.type
        );

        setFormData({
          name: data.name || "",
          type: typeOption || null,
          host: data.host || "",
          port: data.port?.toString() || "",
          database: data.database || "",
          username: data.username || "",
          password: "", // Don't populate password for security
          max_connections: data.max_connections?.toString() || "10",
          enabled: data.enabled ?? true,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle database type change and auto-fill port
  const handleTypeChange = (selectedType) => {
    setFormData((prev) => ({
      ...prev,
      type: selectedType,
      port: selectedType ? defaultPorts[selectedType.value] || "" : "",
    }));
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("Name is required");
    }
    if (!formData.type) {
      newErrors.type = t("Database type is required");
    }
    if (!formData.host.trim()) {
      newErrors.host = t("Host is required");
    }
    if (!formData.port.trim()) {
      newErrors.port = t("Port is required");
    } else if (isNaN(formData.port) || parseInt(formData.port) <= 0) {
      newErrors.port = t("Port must be a valid number");
    }
    if (!formData.database.trim()) {
      newErrors.database = t("Database name is required");
    }
    if (!formData.username.trim()) {
      newErrors.username = t("Username is required");
    }
    if (!formData.max_connections.trim()) {
      newErrors.max_connections = t("Max connections is required");
    } else if (
      isNaN(formData.max_connections) ||
      parseInt(formData.max_connections) <= 0
    ) {
      newErrors.max_connections = t("Max connections must be a valid number");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!validateForm()) {
      setMessage({
        type: "error",
        message: t("Validation Error"),
        description: t("Please fix the errors in the form before testing."),
      });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type.value,
        host: formData.host.trim(),
        port: parseInt(formData.port),
        database: formData.database.trim(),
        username: formData.username.trim(),
        password: formData.password || undefined, // Only send if changed
        max_connections: parseInt(formData.max_connections),
        enabled: formData.enabled,
      };

      const res = await fetch(
        "http://10.46.0.140:8650/analytics/resources/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          message: t("Connection Successful"),
          description:
            data.message || t("Successfully connected to the database."),
        });
      } else {
        setMessage({
          type: "error",
          message: t("Connection Failed"),
          description: data.detail || t("Could not connect to the database."),
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Connection Test Failed"),
        description: err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({
        type: "error",
        message: t("Validation Error"),
        description: t("Please fix the errors in the form."),
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type.value,
        host: formData.host.trim(),
        port: parseInt(formData.port),
        database: formData.database.trim(),
        username: formData.username.trim(),
        max_connections: parseInt(formData.max_connections),
        enabled: formData.enabled,
        comment: comment.trim() || null,
      };

      // Only include password if it was changed
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const res = await fetch(
        `http://10.46.0.140:8650/analytics/resources/${id}`,
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

      if (!res.ok) {
        throw new Error(data.detail || t("Failed to update datasource"));
      }

      setMessage({
        type: "success",
        message: t("Datasource Updated"),
        description: t("The datasource has been updated successfully."),
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/analytics/datasources");
      }, 2000);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Update Failed"),
        description: err.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Protected role="route:analytics#resources-edit">
      <PageLayout
        title={t("Edit Datasource")}
        description={t("Update database connection settings.")}
        actions={
          <SecondaryButton
            onClick={() => navigate("/analytics/datasources")}
            icon={FaArrowLeft}
            disabled={isSubmitting || isTesting}
          >
            {t("Back to Datasources")}
          </SecondaryButton>
        }
        loading={loading}
        error={error}
      >
        {/* Message Alert */}
        {message && (
          <div className="mb-6">
            <Alert
              type={message.type}
              message={message.message}
              description={message.description}
              onClose={() => setMessage(null)}
            />
          </div>
        )}

        {/* Form */}
        {formData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Section
              title={t("Basic Information")}
              description={t("Update the datasource name and type.")}
              icon={FaDatabase}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label={t("Datasource Name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={t("e.g., Production Database")}
                  icon={FaDatabase}
                  error={errors.name}
                  required
                  disabled={isSubmitting || isTesting}
                />

                <FormSelect
                  label={t("Database Type")}
                  options={databaseTypes}
                  value={formData.type}
                  onChange={handleTypeChange}
                  placeholder={t("Select database type...")}
                  icon={FaDatabase}
                  error={errors.type}
                  required
                  disabled={isSubmitting || isTesting}
                />
              </div>
            </Section>

            {/* Connection Settings */}
            <Section
              title={t("Connection Settings")}
              description={t("Update host, port, and database details.")}
              icon={FaServer}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label={t("Host")}
                  value={formData.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  placeholder={t("e.g., localhost or 10.0.0.1")}
                  icon={FaServer}
                  error={errors.host}
                  required
                  disabled={isSubmitting || isTesting}
                />

                <FormInput
                  label={t("Port")}
                  value={formData.port}
                  onChange={(e) => handleChange("port", e.target.value)}
                  placeholder={t("e.g., 5432")}
                  icon={FaNetworkWired}
                  error={errors.port}
                  required
                  disabled={isSubmitting || isTesting}
                />

                <FormInput
                  label={t("Database Name")}
                  value={formData.database}
                  onChange={(e) => handleChange("database", e.target.value)}
                  placeholder={t("e.g., production_db")}
                  icon={FaDatabase}
                  error={errors.database}
                  required
                  disabled={isSubmitting || isTesting}
                />

                <FormInput
                  label={t("Max Connections")}
                  value={formData.max_connections}
                  onChange={(e) =>
                    handleChange("max_connections", e.target.value)
                  }
                  placeholder={t("e.g., 10")}
                  icon={FaNetworkWired}
                  error={errors.max_connections}
                  helperText={t("Maximum number of concurrent connections")}
                  required
                  disabled={isSubmitting || isTesting}
                />
              </div>
            </Section>

            {/* Authentication */}
            <Section
              title={t("Authentication")}
              description={t("Update database credentials.")}
              icon={FaLock}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label={t("Username")}
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder={t("Database username")}
                  icon={FaUser}
                  error={errors.username}
                  required
                  disabled={isSubmitting || isTesting}
                />

                <FormInput
                  label={t("Password")}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={t("Leave blank to keep current password")}
                  icon={FaLock}
                  error={errors.password}
                  helperText={t("Only enter if you want to change the password")}
                  disabled={isSubmitting || isTesting}
                />
              </div>

              {/* Test Connection Button */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <SecondaryButton
                  type="button"
                  onClick={handleTestConnection}
                  icon={isTesting ? null : FaPlug}
                  disabled={isSubmitting || isTesting}
                  className="w-full md:w-auto"
                >
                  {isTesting ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>{t("Testing Connection...")}</span>
                    </div>
                  ) : (
                    t("Test Connection")
                  )}
                </SecondaryButton>
              </div>
            </Section>

            {/* Status */}
            <Section
              title={t("Datasource Status")}
              description={t("Enable or disable this datasource.")}
              icon={formData.enabled ? FaToggleOn : FaToggleOff}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200/90 text-sm">
                    {formData.enabled
                      ? t("Datasource is enabled and ready to use")
                      : t("Datasource is disabled")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("enabled", !formData.enabled)}
                  disabled={isSubmitting || isTesting}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    formData.enabled
                      ? "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                      : "bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
                  } ${
                    isSubmitting || isTesting
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {formData.enabled ? t("Enabled") : t("Disabled")}
                </button>
              </div>
            </Section>

            {/* Change Log */}
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
                placeholder={t("e.g., Updated connection pool size for better performance")}
                disabled={isSubmitting || isTesting}
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
                    <li>
                      • {t("Changes will affect all queries using this datasource")}
                    </li>
                    <li>
                      • {t("Test the connection before saving to ensure it works")}
                    </li>
                    <li>
                      • {t("Password changes are encrypted and cannot be retrieved")}
                    </li>
                    <li>
                      • {t("All changes are logged in the audit trail")}
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <SecondaryButton
                type="button"
                onClick={() => navigate("/analytics/datasources")}
                icon={FaTimes}
                disabled={isSubmitting || isTesting}
              >
                {t("Cancel")}
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                icon={isSubmitting ? null : FaSave}
                disabled={isSubmitting || isTesting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>{t("Saving...")}</span>
                  </div>
                ) : (
                  t("Save Changes")
                )}
              </PrimaryButton>
            </div>
          </form>
        )}
      </PageLayout>
    </Protected>
  );
};

export default DatasourcesEdit;