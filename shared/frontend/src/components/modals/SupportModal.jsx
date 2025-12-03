import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import Select from "@/components/ui/Select";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const SupportModal = ({ isOpen, onClose, currentUser }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: currentUser?.fullName || "",
    email: currentUser?.email || "",
    subject: "",
    description: "",
    category: null,
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    { value: "it_support", label: t("IT Support") },
    { value: "software", label: t("Software") },
    { value: "hr", label: t("HR / People") },
    { value: "facilities", label: t("Facilities") },
    { value: "other", label: t("Other") },
  ];

  const categoryDescriptions = {
    it_support: t("Hardware, network, or technical infrastructure issues"),
    software: t("Application bugs, feature requests, or software problems"),
    hr: t("Human resources, benefits, or people-related questions"),
    facilities: t("Office space, equipment, or building-related requests"),
    other: t("General inquiries or issues not covered by other categories"),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (!form.email || !form.subject || !form.description) {
      setMessage({
        type: "error",
        message: t("Please fill in all required fields."),
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category?.value || "other",
      };

      const res = await fetch("http://10.46.0.140:8650/support/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || t("Failed to submit ticket"));
      }

      setMessage({
        type: "success",
        message: t("Ticket submitted successfully! Support will contact you shortly."),
      });

      // Auto close after 1.5 seconds
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: currentUser?.fullName || "",
      email: currentUser?.email || "",
      subject: "",
      description: "",
      category: null,
    });
    setMessage(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("Contact Support")}
      footer={
        <>
          <SecondaryButton onClick={handleClose} disabled={loading}>
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} loading={loading}>
            {t("Submit Ticket")}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Feedback message */}
        {message && (
          <Alert type={message.type} message={message.message} />
        )}

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-200/90 leading-relaxed">
            {t("Our support team typically responds within 24 hours. For urgent issues, please contact your manager directly.")}
          </p>
        </div>

        {/* Name */}
        <FormInput
          label={t("Full Name")}
          name="name"
          placeholder={t("Your name")}
          value={form.name}
          onChange={handleChange}
          disabled={loading}
          helperText={t("Optional: Help us identify you")}
        />

        {/* Email */}
        <FormInput
          label={t("Email")}
          name="email"
          type="email"
          placeholder={t("Your email address")}
          value={form.email}
          onChange={handleChange}
          required
          disabled={loading}
          helperText={t("We'll use this to respond to your ticket")}
        />

        {/* Subject */}
        <FormInput
          label={t("Subject")}
          name="subject"
          placeholder={t("Brief summary of your issue")}
          value={form.subject}
          onChange={handleChange}
          required
          disabled={loading}
          helperText={t("A clear, concise title for your request")}
        />

        {/* Category */}
        <Select
          label={t("Category")}
          options={categoryOptions}
          value={form.category}
          onChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          placeholder={t("Select category")}
          isDisabled={loading}
          helperText={
            form.category
              ? categoryDescriptions[form.category.value]
              : t("Choose the category that best fits your request")
          }
        />

        {/* Description */}
        <FormTextarea
          label={t("Description")}
          placeholder={t("Describe your issue or request in detail...")}
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={6}
          required
          disabled={loading}
          helperText={t("Include as much detail as possible to help us assist you better")}
        />
      </div>
    </Modal>
  );
};

export default SupportModal;