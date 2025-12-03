import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUserTag,
  FaUsers,
  FaPlus,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";
import { Modal } from "@/components/ui/Modal";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormMultiSelect } from "@/components/ui/FormMultiSelect";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormTextarea } from "@/components/ui/FormInput";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";

const CreatePositionRequestModal = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [currentGroups, setCurrentGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // ─────────────────────────────────────────────
  // Reset form
  // ─────────────────────────────────────────────
  const resetForm = () => {
    setSelectedPosition(null);
    setSelectedGroups([]);
    setCurrentGroups([]);
    setDescription("");
    setMessage(null);
    setErrors({});
  };

  // ─────────────────────────────────────────────
  // Fetch positions and all groups
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!open || !token) return;
    setMessage(null);
    setInitialLoading(true);

    Promise.all([
      fetch("http://10.46.0.140:8650/positions/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://10.46.0.140:8650/groups/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([posRes, grpRes]) => {
        if (!posRes.ok || !grpRes.ok) {
          throw new Error(t("Failed to load data"));
        }
        const posData = await posRes.json();
        const grpData = await grpRes.json();

        setPositions(
          posData.map((p) => ({
            value: p.id,
            label: p.name,
            icon: FaUserTag,
          }))
        );
        setAllGroups(
          grpData.map((g) => ({
            value: g.id,
            label: g.name,
            description: g.description || "",
            icon: FaUsers,
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to load positions or groups:", err);
        setMessage({
          type: "error",
          message: t("Loading Failed"),
          description: t("Failed to load positions or groups. Please try again."),
        });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [open, token, t]);

  // ─────────────────────────────────────────────
  // Fetch current groups for selected position
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedPosition || !token) return;

    fetch(`http://10.46.0.140:8650/positions/${selectedPosition.value}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || t("Failed to load position details"));
        }
        return res.json();
      })
      .then((data) => {
        setCurrentGroups(
          data.groups?.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description || "",
          })) || []
        );
      })
      .catch((err) => {
        console.error("Error fetching position details:", err);
        setCurrentGroups([]);
      });
  }, [selectedPosition, token, t]);

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};

    if (!selectedPosition) {
      newErrors.position = t("Position is required");
    }
    if (selectedGroups.length === 0) {
      newErrors.groups = t("At least one group must be selected");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────────────
  // Create request
  // ─────────────────────────────────────────────
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

    const payload = {
      position_id: selectedPosition.value,
      description: description.trim(),
      groups_to_add: selectedGroups.map((g) => g.value),
    };

    try {
      const res = await fetch("http://10.46.0.140:8650/position-requests/", {
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
        message: t("Request Created"),
        description: t("Position update request created successfully!"),
      });

      setTimeout(() => {
        resetForm();
        onCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
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
      resetForm();
      onClose();
    }
  };

  const handleChange = (field, value) => {
    if (field === "position") {
      setSelectedPosition(value);
    } else if (field === "groups") {
      setSelectedGroups(value);
    } else if (field === "description") {
      setDescription(value);
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={t("New Position Update Request")}
      icon={FaUserTag}
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
      {initialLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-blue-200/60 mt-4 font-medium">
            {t("Loading positions and groups...")}
          </p>
        </div>
      ) : (
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

          {/* Select Position */}
          <FormSelect
            label={t("Position")}
            options={positions}
            value={selectedPosition}
            onChange={(v) => handleChange("position", v)}
            placeholder={t("Select a position...")}
            error={errors.position}
            helperText={t("Choose the position you want to update")}
            required
            disabled={loading}
          />

          {/* Current Groups */}
          {selectedPosition && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-blue-400 text-sm" />
                </div>
                <h4 className="text-sm font-semibold text-blue-200">
                  {t("Current Groups")}
                </h4>
              </div>

              {currentGroups.length > 0 ? (
                <div className="space-y-2">
                  {currentGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                        <FaUsers className="text-blue-400 text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">
                          {g.name}
                        </p>
                        {g.description && (
                          <p className="text-blue-200/60 text-xs mt-0.5">
                            {g.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaInfoCircle className="text-blue-400/60 text-lg" />
                  </div>
                  <p className="text-blue-200/60 text-sm">
                    {t("This position has no assigned groups.")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Groups to Add */}
          <FormMultiSelect
            label={t("Groups to Add")}
            options={allGroups}
            value={selectedGroups}
            onChange={(v) => handleChange("groups", v)}
            placeholder={t("Select groups to add...")}
            error={errors.groups}
            helperText={t("Select one or more groups to add to this position")}
            required
            disabled={loading}
          />

          {/* Selected Groups Preview */}
          {selectedGroups.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaPlus className="text-green-400 text-sm" />
                <h4 className="text-sm font-semibold text-green-200">
                  {t("Groups to be Added")} ({selectedGroups.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedGroups.map((group) => (
                  <Badge key={group.value} variant="success" icon={FaUsers}>
                    {group.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <FormTextarea
            label={t("Request Description")}
            placeholder={t(
              "Provide context for this request, explain why these groups should be added..."
            )}
            value={description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            helperText={t("Optional: Add any additional context or justification")}
            disabled={loading}
          />

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaInfoCircle className="text-blue-400 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-blue-200 text-sm font-medium mb-1">
                  {t("Request Information")}
                </p>
                <ul className="text-blue-200/70 text-xs space-y-1 list-disc list-inside">
                  <li>{t("This request will be reviewed by an administrator")}</li>
                  <li>{t("You'll be notified once the request is processed")}</li>
                  <li>{t("Only new groups will be added, existing ones remain unchanged")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreatePositionRequestModal;