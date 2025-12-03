import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { FormInput, FormTextarea, FormSelect } from "@/components/ui/FormInput";
import Select from "@/components/ui/Select";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const CreateTaskModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    start_at: "",
    end_at: "",
    assigned_to: null,
    source: "manual",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const priorityOptions = [
    { value: "low", label: t("Low") },
    { value: "normal", label: t("Normal") },
    { value: "high", label: t("High") },
  ];

  const taskTypeOptions = [
    { value: "manual", label: t("General Task") },
    { value: "onboarding", label: t("Onboarding Task") },
    { value: "offboarding", label: t("Offboarding Task") },
  ];

  // ─────────────────────────────────────────────
  // Reset form data
  // ─────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "normal",
      start_at: "",
      end_at: "",
      assigned_to: null,
      source: "manual",
    });
    setErrors({});
    setMessage(null);
  };

  // ─────────────────────────────────────────────
  // Load assignable users
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !token) return;

    fetch("http://10.46.0.140:8650/users/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setUsers(
          data.map((u) => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name}`,
          }))
        );
      })
      .catch(() => setUsers([]));
  }, [isOpen, token]);

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t("Title is required.");
    if (!formData.priority) newErrors.priority = t("Priority is required.");
    if (formData.start_at && formData.end_at && formData.start_at > formData.end_at) {
      newErrors.date = t("Start date cannot be after end date.");
    }
    if (!formData.assigned_to) newErrors.assigned_to = t("Please select an assignee.");
    return newErrors;
  };

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({
        type: "error",
        message: t("Please fix the errors before submitting."),
      });
      return;
    }

    setErrors({});
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("http://10.46.0.140:8650/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to create task"));
      }

      setMessage({ 
        type: "success", 
        message: t("Task created successfully!") 
      });
      
      onSuccess?.();

      setTimeout(() => {
        setMessage(null);
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", message: err.message });
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

  if (!isOpen) return null;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("Create New Task")}
      footer={
        <>
          <SecondaryButton onClick={handleClose} disabled={loading}>
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} loading={loading}>
            {t("Create Task")}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Feedback Message */}
        {message && (
          <Alert type={message.type} message={message.message} />
        )}

        {/* Title */}
        <FormInput
          label={t("Title")}
          name="title"
          placeholder={t("Task title")}
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          disabled={loading}
        />

        {/* Description */}
        <FormTextarea
          label={t("Description")}
          name="description"
          placeholder={t("Describe the task")}
          value={formData.description}
          onChange={handleChange}
          rows={4}
          disabled={loading}
        />

        {/* Task Type */}
        <FormSelect
          label={t("Task Type")}
          name="source"
          value={formData.source}
          onChange={handleChange}
          options={taskTypeOptions}
          disabled={loading}
        />

        {/* Priority */}
        <Select
          label={t("Priority")}
          options={priorityOptions}
          value={priorityOptions.find((p) => p.value === formData.priority)}
          onChange={(selected) => {
            setFormData((prev) => ({
              ...prev,
              priority: selected.value,
            }));
            if (errors.priority) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.priority;
                return newErrors;
              });
            }
          }}
          placeholder={t("Select priority")}
          isDisabled={loading}
          error={errors.priority}
          helperText={t("Set the urgency level for this task")}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t("Start At")}
            type="datetime-local"
            name="start_at"
            value={formData.start_at}
            onChange={handleChange}
            disabled={loading}
          />
          <FormInput
            label={t("End At")}
            type="datetime-local"
            name="end_at"
            value={formData.end_at}
            onChange={handleChange}
            error={errors.date}
            disabled={loading}
          />
        </div>

        {/* Assigned To */}
        <Select
          label={t("Assign To")}
          options={users}
          value={users.find((u) => u.value === formData.assigned_to) || null}
          onChange={(selected) => {
            setFormData((prev) => ({
              ...prev,
              assigned_to: selected?.value || null,
            }));
            if (errors.assigned_to) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.assigned_to;
                return newErrors;
              });
            }
          }}
          placeholder={t("Select assignee")}
          isDisabled={loading}
          error={errors.assigned_to}
          helperText={t("Choose who will be responsible for this task")}
        />
      </form>
    </Modal>
  );
};

CreateTaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CreateTaskModal;