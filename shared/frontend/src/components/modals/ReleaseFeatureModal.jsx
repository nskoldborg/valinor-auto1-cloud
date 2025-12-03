import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { Alert } from "@/components/ui/Alert";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/ReleaseFeatureModal.css"; // ✅ Using @ alias

const ReleaseFeatureModal = ({ open, onClose, featureId, token, onSuccess }) => {
  const { t } = useTranslation();

  const [email, setEmail] = useState({ to: "", cc: "", bcc: "" });
  const [body, setBody] = useState(
    "<p><strong>" +
      t("This release contains the following updates:") +
      "</strong></p><ul><li>• </li></ul>"
  );
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  // ─────────────────────────────────────────────
  // Reset modal state
  // ─────────────────────────────────────────────
  const resetForm = () => {
    setEmail({ to: "", cc: "", bcc: "" });
    setBody(
      "<p><strong>" +
        t("This release contains the following updates:") +
        "</strong></p><ul><li>• </li></ul>"
    );
    setMessage(null);
  };

  // ─────────────────────────────────────────────
  // Send release email
  // ─────────────────────────────────────────────
  const handleSend = async () => {
    if (!email.to.trim()) {
      setMessage({
        type: "error",
        message: t("Please enter at least one recipient (To)."),
      });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const payload = {
        release_notes: body,
        email: {
          to: email.to,
          cc: email.cc || "",
          bcc: email.bcc || "",
        },
      };

      const res = await fetch(
        `http://10.46.0.140:8650/feature-requests/${featureId}/release`,
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
      if (!res.ok)
        throw new Error(data.detail || t("Failed to send release email"));

      setMessage({
        type: "success",
        message: t("Release email sent successfully!"),
      });

      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", message: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      resetForm();
      onClose();
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={t("Release Feature")}
      footer={
        <>
          <SecondaryButton onClick={handleClose} disabled={sending}>
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton onClick={handleSend} loading={sending}>
            {t("Send Release Email")}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Feedback Message */}
        {message && (
          <Alert type={message.type} message={message.message} />
        )}

        {/* Email Fields */}
        <FormInput
          label={t("To")}
          placeholder={t("Enter recipient emails (comma-separated)")}
          value={email.to}
          onChange={(e) => setEmail({ ...email, to: e.target.value })}
          required
          disabled={sending}
          helperText={t("Required: Primary recipients of the release email")}
        />

        <FormInput
          label={t("CC")}
          placeholder={t("Enter CC emails (comma-separated)")}
          value={email.cc}
          onChange={(e) => setEmail({ ...email, cc: e.target.value })}
          disabled={sending}
          helperText={t("Optional: Carbon copy recipients")}
        />

        <FormInput
          label={t("BCC")}
          placeholder={t("Enter BCC emails (comma-separated)")}
          value={email.bcc}
          onChange={(e) => setEmail({ ...email, bcc: e.target.value })}
          disabled={sending}
          helperText={t("Optional: Blind carbon copy recipients")}
        />

        {/* Quill Editor */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-blue-200">
            {t("Release Notes")} <span className="text-red-400">*</span>
          </label>
          <div
            className="rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 bg-[#0a1929]/50 overflow-hidden transition-all dark-quill-editor"
          >
            <ReactQuill
              theme="snow"
              value={body}
              onChange={setBody}
              placeholder={t("Write your release notes...")}
              readOnly={sending}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ color: [] }, { background: [] }],
                  ["link", "blockquote", "code-block"],
                  ["clean"],
                ],
              }}
              formats={[
                "header",
                "bold",
                "italic",
                "underline",
                "strike",
                "list",
                "bullet",
                "color",
                "background",
                "link",
                "blockquote",
                "code-block",
              ]}
            />
          </div>
          <p className="text-xs text-blue-400/50 mt-2 italic">
            {t("Format your release notes with rich text formatting")}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ReleaseFeatureModal;