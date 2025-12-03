import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaTrash,
  FaPlus,
  FaGripVertical,
  FaChevronDown,
  FaChevronUp,
  FaSave,
  FaTimes,
  FaCog,
  FaInfoCircle,
  FaListOl,
  FaNetworkWired,
  FaCode,
  FaDatabase,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { PrimaryButton, SecondaryButton, DangerButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";

const stepTypeOptions = [
  { value: "rest", label: "REST Call", icon: <FaNetworkWired /> },
  { value: "code", label: "Custom Code", icon: <FaCode /> },
  { value: "sql", label: "SQL Query", icon: <FaDatabase /> },
];

const methodOptions = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];

const statusOptions = [
  { value: true, label: "🟢 Enabled" },
  { value: false, label: "🔴 Disabled" },
];

const WorkflowsEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [message, setMessage] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch workflow details
  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    fetch(`http://10.46.0.140:8650/workflows/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) =>
        res.ok ? res.json() : Promise.reject("Failed to load workflow")
      )
      .then((data) => {
        setWorkflow(data);
        setSteps(data.steps || []);
        setLoading(false);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          message: t("Error Loading Workflow"),
          description: err,
        });
        setLoading(false);
      });
  }, [id, token, t]);

  // Handle updates to basic info
  const handleWorkflowChange = (e) => {
    const { name, value } = e.target;
    setWorkflow((prev) => ({ ...prev, [name]: value }));
  };

  // Add new step
  const addStep = (type = "rest") => {
    const newStep = {
      id: Date.now(),
      type,
      name: "",
      config: {},
    };
    setSteps((prev) => [...prev, newStep]);
    setExpandedStep(newStep.id); // Auto-expand new step
  };

  // Delete step
  const deleteStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (expandedStep === id) setExpandedStep(null);
  };

  // Move step up/down
  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const [moved] = newSteps.splice(index, 1);
    newSteps.splice(index + direction, 0, moved);
    setSteps(newSteps);
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...workflow, steps };
    try {
      const res = await fetch(`http://10.46.0.140:8650/workflows/${id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save workflow");
      setMessage({
        type: "success",
        message: t("Success"),
        description: t("Workflow saved successfully!"),
      });
      setTimeout(() => navigate("/admin/workflows"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Save Failed"),
        description: err.message,
      });
    }
  };

  // Update step details
  const updateStep = (index, updates) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    setSteps(updated);
  };

  // Render step config by type
  const renderStepConfig = (step, index) => {
    switch (step.type) {
      case "rest":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label={t("HTTP Method")}
                options={methodOptions}
                value={methodOptions.find((m) => m.value === step.config.method)}
                onChange={(s) =>
                  updateStep(index, {
                    config: { ...step.config, method: s.value },
                  })
                }
                icon={FaNetworkWired}
              />
              <FormInput
                label={t("Save response as")}
                value={step.config.output_var || ""}
                onChange={(e) =>
                  updateStep(index, {
                    config: { ...step.config, output_var: e.target.value },
                  })
                }
                placeholder={t("e.g. response_data")}
              />
            </div>
            <FormInput
              label={t("Request URL")}
              value={step.config.url || ""}
              onChange={(e) =>
                updateStep(index, {
                  config: { ...step.config, url: e.target.value },
                })
              }
              placeholder={t("https://api.example.com/endpoint")}
              icon={FaNetworkWired}
            />
            <FormTextarea
              label={t("Request Body (optional)")}
              rows={3}
              placeholder={t("JSON request body...")}
              value={step.config.body || ""}
              onChange={(e) =>
                updateStep(index, {
                  config: { ...step.config, body: e.target.value },
                })
              }
            />
          </div>
        );

      case "code":
        return (
          <div className="space-y-4">
            <FormSelect
              label={t("Language")}
              options={[
                { value: "python", label: "Python" },
                { value: "javascript", label: "JavaScript" },
              ]}
              value={{
                value: step.config.language || "python",
                label:
                  step.config.language === "javascript" ? "JavaScript" : "Python",
              }}
              onChange={(s) =>
                updateStep(index, {
                  config: { ...step.config, language: s.value },
                })
              }
              icon={FaCode}
            />
            <FormTextarea
              label={t("Code")}
              rows={8}
              placeholder={t(
                `Write your ${step.config.language || "python"} code here...`
              )}
              value={step.config.code || ""}
              onChange={(e) =>
                updateStep(index, {
                  config: { ...step.config, code: e.target.value },
                })
              }
            />
          </div>
        );

      case "sql":
        return (
          <div className="space-y-4">
            <FormInput
              label={t("Connection")}
              placeholder={t("e.g. main_database")}
              value={step.config.connection || ""}
              onChange={(e) =>
                updateStep(index, {
                  config: { ...step.config, connection: e.target.value },
                })
              }
              icon={FaDatabase}
            />
            <FormTextarea
              label={t("SQL Query")}
              rows={5}
              placeholder={t("SELECT * FROM table WHERE...")}
              value={step.config.sql || ""}
              onChange={(e) =>
                updateStep(index, {
                  config: { ...step.config, sql: e.target.value },
                })
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Get step type badge
  const getStepTypeBadge = (type) => {
    const typeMap = {
      rest: { variant: "info", icon: <FaNetworkWired />, label: "REST Call" },
      code: { variant: "success", icon: <FaCode />, label: "Custom Code" },
      sql: { variant: "warning", icon: <FaDatabase />, label: "SQL Query" },
    };

    const config = typeMap[type] || { variant: "default", icon: null, label: type };
    return (
      <Badge variant={config.variant} icon={config.icon}>
        {config.label}
      </Badge>
    );
  };

  if (loading || !workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d2847] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-blue-200/60 mt-4 font-medium">
            {t("Loading workflow...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d2847] to-[#0f3460]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom py-8">
        {/* Page Header */}
        <PageHeader
          title={`${t("Edit Workflow")} — ${workflow.name}`}
          description={t("Define workflow steps, schedule, and automation logic.")}
          icon={FaCog}
          actions={
            <SecondaryButton
              onClick={() => navigate("/admin/workflows")}
              icon={FaTimes}
            >
              {t("Cancel")}
            </SecondaryButton>
          }
        />

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Message Alert */}
          {message && (
            <Alert
              type={message.type}
              message={message.message}
              description={message.description}
              onClose={() => setMessage(null)}
            />
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FaInfoCircle className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t("Basic Information")}
                </h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label={t("Workflow Name")}
                    name="name"
                    value={workflow.name}
                    onChange={handleWorkflowChange}
                    icon={FaCog}
                  />
                  <FormSelect
                    label={t("Status")}
                    options={statusOptions}
                    value={statusOptions.find((s) => s.value === workflow.enabled)}
                    onChange={(s) =>
                      setWorkflow((p) => ({ ...p, enabled: s.value }))
                    }
                    icon={FaCog}
                  />
                </div>

                <FormTextarea
                  label={t("Description")}
                  name="description"
                  value={workflow.description}
                  onChange={handleWorkflowChange}
                  rows={3}
                  placeholder={t("Describe the workflow purpose...")}
                />

                <FormInput
                  label={t("Schedule (CRON)")}
                  name="schedule"
                  value={workflow.schedule || ""}
                  onChange={handleWorkflowChange}
                  placeholder={t("e.g. 0 * * * * (every hour)")}
                  icon={FaCog}
                  helperText={t(
                    "Use CRON syntax to define when this workflow should run"
                  )}
                />
              </div>
            </Card>

            {/* Workflow Steps */}
            <Card>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <FaListOl className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t("Workflow Steps")}
                    </h3>
                    <p className="text-blue-200/60 text-sm">
                      {steps.length} {t("step(s)")}
                    </p>
                  </div>
                </div>

                <SecondaryButton
                  type="button"
                  onClick={() => addStep()}
                  icon={FaPlus}
                >
                  {t("Add Step")}
                </SecondaryButton>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaListOl className="text-blue-400 text-2xl" />
                  </div>
                  <p className="text-blue-200/60 font-medium">
                    {t("No steps yet.")}
                  </p>
                  <p className="text-blue-200/40 text-sm mt-2">
                    {t('Click "Add Step" to start building your workflow.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaGripVertical className="text-blue-400/40 cursor-move" />
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-semibold">
                              {index + 1}
                            </span>
                            {getStepTypeBadge(step.type)}
                            {step.name && (
                              <span className="text-white font-medium">
                                — {step.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveStep(index, -1)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-blue-200 transition-all duration-200"
                              title={t("Move Up")}
                            >
                              <FaArrowUp className="text-xs" />
                            </button>
                          )}
                          {index < steps.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveStep(index, 1)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-blue-200 transition-all duration-200"
                              title={t("Move Down")}
                            >
                              <FaArrowDown className="text-xs" />
                            </button>
                          )}
                          <SecondaryButton
                            type="button"
                            onClick={() =>
                              setExpandedStep(
                                expandedStep === step.id ? null : step.id
                              )
                            }
                            icon={
                              expandedStep === step.id ? (
                                <FaChevronUp />
                              ) : (
                                <FaChevronDown />
                              )
                            }
                          >
                            {expandedStep === step.id
                              ? t("Collapse")
                              : t("Expand")}
                          </SecondaryButton>
                          <DangerButton
                            type="button"
                            onClick={() => deleteStep(step.id)}
                            icon={FaTrash}
                          >
                            {t("Delete")}
                          </DangerButton>
                        </div>
                      </div>

                      {expandedStep === step.id && (
                        <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="space-y-4">
                            <FormSelect
                              label={t("Step Type")}
                              options={stepTypeOptions}
                              value={stepTypeOptions.find(
                                (t) => t.value === step.type
                              )}
                              onChange={(s) =>
                                updateStep(index, { type: s.value })
                              }
                            />
                            <FormInput
                              label={t("Step Name")}
                              value={step.name || ""}
                              onChange={(e) =>
                                updateStep(index, { name: e.target.value })
                              }
                              placeholder={t("Enter step name...")}
                            />
                            <div className="pt-2">
                              {renderStepConfig(step, index)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <SecondaryButton
                type="button"
                onClick={() => navigate("/admin/workflows")}
                icon={FaTimes}
              >
                {t("Cancel")}
              </SecondaryButton>
              <PrimaryButton type="submit" icon={FaSave}>
                {t("Save Workflow")}
              </PrimaryButton>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 mt-8">
          <p className="text-blue-200/40 text-sm">
            © {new Date().getFullYear()} {t("Valinor Application")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsEdit;