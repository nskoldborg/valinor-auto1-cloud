import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUpload,
  FaCheckCircle,
  FaHistory,
  FaFileUpload,
  FaTable,
  FaInfoCircle,
  FaDownload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";   // <-- ADD THIS
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSelect } from "@/components/ui/FormSelect";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const BatchUploader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // <-- ADD THIS

  const [selectedUploader, setSelectedUploader] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const token = localStorage.getItem("token");

  const uploaderOptions = [
    { value: "workday", label: t("Workday Data Uploader") },
  ];

  const handleFileSelect = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMessage({
        type: "info",
        message: t("File Selected"),
        description: `${selected.name} (${(selected.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedUploader || !file) {
      setMessage({
        type: "error",
        message: t("Missing Information"),
        description: t("Please select an uploader and file first."),
      });
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: 100 });
    setMessage({
      type: "info",
      message: t("Uploading File"),
      description: t("Please wait while we process your file..."),
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `http://10.46.0.140:8650/batch-upload/${selectedUploader.value}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Upload failed"));

      let prog = 0;
      const interval = setInterval(() => {
        prog += 20;
        setProgress({ current: Math.min(prog, 100), total: 100 });
        if (prog >= 100) {
          clearInterval(interval);
          setIsUploading(false);
        }
      }, 150);

      setMessage({
        type: "success",
        message: t("Upload Successful"),
        description: t("Inserted: {{inserted}}, Updated: {{updated}}", {
          inserted: data.inserted,
          updated: data.updated,
        }),
      });
      setFile(null);
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Upload Failed"),
        description: err.message,
      });
      setIsUploading(false);
      setProgress(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedUploader || !file) {
      setMessage({
        type: "error",
        message: t("Missing Information"),
        description: t("Please select an uploader and file first."),
      });
      return;
    }

    setIsUploading(true);
    setMessage({
      type: "info",
      message: t("Validating File"),
      description: t("Dry run in progress - no data will be saved."),
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `http://10.46.0.140:8650/batch-upload/${selectedUploader.value}/validate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("Validation failed"));

      setMessage({
        type: "success",
        message: t("Validation Passed"),
        description: data.message || t("No issues detected."),
      });
    } catch (err) {
      setMessage({
        type: "error",
        message: t("Validation Failed"),
        description: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  /* -------------------------------------------------------
     ⛳ FIXED: INSTANT ROUTER NAVIGATION
     replaces: window.location.href = "/other/batch-uploader/history";
  -------------------------------------------------------- */
  const handleHistory = () => {
    navigate("/other/batch-uploader/history");
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "country",
      "work_location",
      "full_name",
      "work_email",
      "department",
      "sub_department",
      "sub_team",
      "management_level",
      "business_title",
      "tech_position",
      "direct_supervisor",
      "cost_center",
      "start_date",
      "probation_start_date",
      "probation_end_date",
      "onboarding_status",
      "contract_end_date",
      "exit_date",
      "offboarding_status",
      "employee_active",
      "hiring_company",
      "workday_id",
      "termination_type",
      "employee_type",
    ];

    const exampleRow = [
      "SE",
      "Stockholm HQ",
      "Jane Doe",
      "jane.doe@auto1.com",
      "Operations",
      "Onboarding",
      "Team North",
      "Manager",
      "Onboarding Lead",
      "N/A",
      "John Smith",
      "1001",
      "2023-01-10",
      "2023-01-10",
      "2023-07-10",
      "In Progress",
      "2025-12-31",
      "",
      "",
      "TRUE",
      "Auto1 Group",
      "WD12345",
      "",
      "Full-time",
    ];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "workday_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const headers = [
    "country",
    "work_location",
    "full_name",
    "work_email",
    "department",
    "sub_department",
    "sub_team",
    "management_level",
    "business_title",
    "tech_position",
    "direct_supervisor",
    "cost_center",
    "start_date",
    "probation_start_date",
    "probation_end_date",
    "onboarding_status",
    "contract_end_date",
    "exit_date",
    "offboarding_status",
    "employee_active",
    "hiring_company",
    "workday_id",
    "termination_type",
    "employee_type",
  ];

  const exampleData = [
    [
      "SE",
      "Stockholm HQ",
      "Jane Doe",
      "jane.doe@auto1.com",
      "Operations",
      "Onboarding",
      "Team North",
      "Manager",
      "Onboarding Lead",
      "N/A",
      "John Smith",
      "1001",
      "2023-01-10",
      "2023-01-10",
      "2023-07-10",
      "In Progress",
      "2025-12-31",
      "",
      "",
      "TRUE",
      "Auto1 Group",
      "WD12345",
      "",
      "Full-time",
    ],
  ];

  return (
    <Protected role="route:batch-uploader">
      <PageLayout
        title={t("Batch Uploader")}
        description={t("Upload and synchronize data files for automated updates.")}
        actions={
          <Protected role="route:batch-uploader#history">
            <SecondaryButton
              onClick={handleHistory}
              icon={FaHistory}
              disabled={isUploading}
            >
              {t("View History")}
            </SecondaryButton>
          </Protected>
        }
      >
        {/* STATUS + REST OF PAGE UNCHANGED */}
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

        {progress && (
          <Card className="mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm font-medium text-white">
                    {t("Processing...")}
                  </span>
                </div>
                <span className="text-sm text-blue-200/70 font-mono">
                  {progress.current}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FaFileUpload className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t("Select Uploader")}
            </h3>
          </div>

          <Protected role="route:batch-uploader#workday-uploader">
            <div className="max-w-md">
              <FormSelect
                label={t("Uploader Type")}
                options={uploaderOptions}
                value={selectedUploader}
                onChange={setSelectedUploader}
                placeholder={t("Choose uploader...")}
                isClearable={true}
                icon={FaUpload}
                helperText={t("Select the type of data you want to upload")}
              />
            </div>
          </Protected>
        </Card>

        {selectedUploader && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <FaFileUpload className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t("Upload File")}
              </h3>
            </div>

            {file && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-400 text-xl" />
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-blue-200/60">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                onClick={() => document.getElementById("fileInput").click()}
                icon={FaUpload}
                disabled={isUploading}
              >
                {file ? t("Change File") : t("Select File")}
              </PrimaryButton>

              {file && (
                <>
                  <SecondaryButton
                    onClick={handleValidate}
                    icon={FaCheckCircle}
                    disabled={isUploading}
                  >
                    {t("Validate")}
                  </SecondaryButton>

                  <PrimaryButton
                    onClick={handleUpload}
                    icon={FaUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? t("Uploading...") : t("Confirm Upload")}
                  </PrimaryButton>
                </>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </Card>
        )}

        {selectedUploader?.value === "workday" && (
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <FaTable className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t("Workday CSV Example Format")}
                </h3>
              </div>
              <SecondaryButton
                onClick={handleDownloadTemplate}
                icon={FaDownload}
                size="sm"
              >
                {t("Download Template")}
              </SecondaryButton>
            </div>

            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <FaInfoCircle className="text-blue-400 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  {t("CSV Format Requirements")}
                </p>
                <p className="text-xs text-blue-200/70">
                  {t(
                    "Your CSV file must include all columns shown below in the exact order. Empty values are allowed for optional fields."
                  )}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-blue-200 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exampleData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {row.map((val, j) => (
                        <td
                          key={j}
                          className="px-4 py-3 text-white/90 whitespace-nowrap font-mono text-xs"
                        >
                          {val || <span className="text-white/30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </PageLayout>
    </Protected>
  );
};

export default BatchUploader;