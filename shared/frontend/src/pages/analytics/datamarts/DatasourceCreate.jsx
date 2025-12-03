import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FaCheckCircle,
  FaPlug,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Protected from "@/components/Protected";

const DatasourceCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    type: null,
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    max_connections: "10",
    enabled: true,
  });

  const [message, setMessage] = useState(null);
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
    if (!formData.password.trim()) {
      newErrors.password = t("Password is required");
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
        password: formData.password,
        max_connections: parseInt(formData.max_connections),
        enabled: formData.enabled,
      };

      const res = await fetch("http://10.46.0.140:8650/analytics/resources/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          message: t("Connection Successful"),
          description: data.message || t("Successfully connected to the database."),
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
        password: formData.password, // Backend will hash this
        max_connections: parseInt(formData.max_connections),
        enabled: formData.enabled,
      };

      const res = await fetch("http://10.46.0.140:8650/analytics/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || t("Failed to create datasource"));
      }

      setMessage({
        type: "success",
        message: t("Datasource Created"),
        description: t("The datasource has been created successfully."),
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/analytics/datasources");
      }, 2000);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Creation Failed"),
        description: err.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Protected role="route:analytics#resources-create">
      <PageLayout
        title={t("Create Datasource")}
        description={t("Add a new database connection for analytics queries.")}
        actions={
          <SecondaryButton
            onClick={() => navigate("/analytics/datasources")}
            icon={FaTimes}
            disabled={isSubmitting || isTesting}
          >
            {t("Cancel")}
          </SecondaryButton>
        }
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FaDatabase className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Basic Information")}
              </h3>
            </div>

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
          </Card>

          {/* Connection Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <FaServer className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Connection Settings")}
              </h3>
            </div>

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
          </Card>

          {/* Authentication */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FaLock className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Authentication")}
              </h3>
            </div>

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
                placeholder={t("Database password")}
                icon={FaLock}
                error={errors.password}
                helperText={t("Password will be encrypted")}
                required
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
          </Card>

          {/* Status */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ${
                    formData.enabled
                      ? "from-green-500 to-green-600 shadow-green-500/30"
                      : "from-gray-500 to-gray-600 shadow-gray-500/30"
                  }`}
                >
                  {formData.enabled ? (
                    <FaToggleOn className="text-white text-lg" />
                  ) : (
                    <FaToggleOff className="text-white text-lg" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {t("Datasource Status")}
                  </h3>
                  <p className="text-blue-200/60 text-sm">
                    {formData.enabled
                      ? t("Datasource is enabled and ready to use")
                      : t("Datasource is disabled")}
                  </p>
                </div>
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
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3">
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
                  <span>{t("Creating...")}</span>
                </div>
              ) : (
                t("Create Datasource")
              )}
            </PrimaryButton>
          </div>
        </form>
      </PageLayout>
    </Protected>
  );
};

export default DatasourceCreate;