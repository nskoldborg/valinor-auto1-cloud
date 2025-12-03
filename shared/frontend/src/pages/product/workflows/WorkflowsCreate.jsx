import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaCog,
  FaCode,
  FaDatabase,
  FaNetworkWired,
  FaInfoCircle,
  FaPalette,
  FaEdit,
} from "react-icons/fa";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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

const WorkflowsCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [workflow, setWorkflow] = useState({
    name: "",
    description: "",
    enabled: true,
    schedule: "",
  });
  const [message, setMessage] = useState(null);

  // ─────────── React Flow Setup ───────────
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "input",
      data: { label: "Start Trigger" },
      position: { x: 100, y: 200 },
      style: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "2px solid #667eea",
        borderRadius: "12px",
        padding: "12px 20px",
        fontSize: "14px",
        fontWeight: "600",
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#667eea", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const addNode = (type) => {
    const nodeStyles = {
      rest: {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        border: "2px solid #3b82f6",
      },
      code: {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        border: "2px solid #10b981",
      },
      sql: {
        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        border: "2px solid #f59e0b",
      },
    };

    const newNode = {
      id: String(Date.now()),
      type: "default",
      data: {
        label:
          type === "rest"
            ? "REST Call"
            : type === "code"
            ? "Code Step"
            : "SQL Query",
      },
      position: { x: 300 + Math.random() * 150, y: 100 + Math.random() * 150 },
      style: {
        ...nodeStyles[type],
        color: "white",
        borderRadius: "12px",
        padding: "12px 20px",
        fontSize: "14px",
        fontWeight: "600",
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleWorkflowChange = (e) => {
    const { name, value } = e.target;
    setWorkflow((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...workflow, nodes, edges };

    try {
      const res = await fetch("http://10.46.0.140:8650/workflows/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      setMessage({
        type: "success",
        message: t("Success"),
        description: t("Workflow created successfully!"),
      });
      setTimeout(() => navigate("/admin/workflows"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Creation Failed"),
        description: err.message,
      });
    }
  };

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
          title={t("Create Workflow")}
          description={t(
            "Define a new backend automation workflow with REST calls, custom code, or SQL logic."
          )}
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
                    required
                    icon={FaCog}
                    placeholder={t("Enter workflow name...")}
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
                  value={workflow.schedule}
                  onChange={handleWorkflowChange}
                  placeholder={t("e.g. 0 * * * * (every hour)")}
                  icon={FaCog}
                  helperText={t(
                    "Use CRON syntax to define when this workflow should run"
                  )}
                />
              </div>
            </Card>

            {/* Workflow Designer Canvas */}
            <Card>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <FaPalette className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {t("Workflow Designer (Visual)")}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <SecondaryButton
                    onClick={() => addNode("rest")}
                    type="button"
                    icon={FaNetworkWired}
                  >
                    {t("REST Call")}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => addNode("code")}
                    type="button"
                    icon={FaCode}
                  >
                    {t("Code Step")}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => addNode("sql")}
                    type="button"
                    icon={FaDatabase}
                  >
                    {t("SQL Step")}
                  </SecondaryButton>
                </div>
              </div>

              <div className="h-[60vh] bg-[#0a1929] border border-white/10 rounded-lg shadow-inner overflow-hidden">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                  onNodeClick={(_, node) => setSelectedNode(node)}
                  style={{
                    background: "linear-gradient(135deg, #0a1929 0%, #0d2847 100%)",
                  }}
                >
                  <MiniMap
                    style={{
                      background: "#0a1929",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    maskColor="rgba(10, 25, 41, 0.6)"
                  />
                  <Controls
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Background
                    color="rgba(255,255,255,0.05)"
                    gap={16}
                    style={{ background: "transparent" }}
                  />
                </ReactFlow>
              </div>

              {/* Inline Node Editor */}
              {selectedNode && (
                <div className="mt-6 bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                      <FaEdit className="text-white text-sm" />
                    </div>
                    <h4 className="text-white font-semibold">
                      {t("Edit Node")}: {selectedNode.data.label}
                    </h4>
                  </div>

                  <FormInput
                    label={t("Node Name")}
                    value={selectedNode.data.label}
                    onChange={(e) =>
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, label: e.target.value } }
                            : n
                        )
                      )
                    }
                    icon={FaEdit}
                  />
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
                {t("Create Workflow")}
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

export default WorkflowsCreate;