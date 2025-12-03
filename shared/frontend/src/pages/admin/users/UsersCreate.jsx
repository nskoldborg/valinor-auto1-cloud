import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUser,
  FaLock,
  FaShieldAlt,
  FaGlobe,
  FaUsers,
  FaBriefcase,
  FaCommentAlt,
  FaSave,
  FaArrowLeft,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAssignableOptions } from "@/hooks/useAssignableOptions";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormMultiSelect } from "@/components/ui/FormMultiSelect";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const statusOptions = [
  { value: true, label: "🟢 Enabled" },
  { value: false, label: "🔴 Disabled" },
];

const localeOptions = [
  { value: "en", label: "English" },
  { value: "sv", label: "Swedish" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

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

const UsersCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  const [groups, setGroups] = useState([]);
  const [positions, setPositions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    locale: "en",
    password: "",
    repeatPassword: "",
    status: true,
    country: "",
    user_countries: [],
    groups: [],
    positions: [],
    access_groups: [],
    access_positions: [],
    access_countries: [],
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

  // Fetch current logged-in user
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`http://10.46.0.140:8650/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, [token, userId]);

  // Fetch dropdown data
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("http://10.46.0.140:8650/groups/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://10.46.0.140:8650/countries/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://10.46.0.140:8650/positions/", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([g, c, p]) => {
        const groupsData = await g.json();
        const countriesData = await c.json();
        const positionsData = await p.json();

        setGroups(groupsData.map((g) => ({ value: g.id, label: g.name })));
        setCountries(
          countriesData.map((c) => ({
            value: c.code,
            id: c.id,
            label: c.name,
          }))
        );
        setPositions(
          positionsData.map((p) => ({
            value: p.id,
            label: p.name,
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dropdown data", err);
        setLoading(false);
      });
  }, [token]);

  // RBAC Filtering
  const { groupOptions, positionOptions } = useAssignableOptions(
    currentUser,
    groups,
    [],
    positions
  );

  const allowedGroups = currentUser?.assignable_groups?.map((g) => g.id) || [];
  const allowedPositions =
    currentUser?.assignable_positions?.map((p) => p.id) || [];
  const allowedCountries =
    currentUser?.assignable_countries?.map((c) => c.id) || [];

  const assignableGroups = groups.filter((g) => allowedGroups.includes(g.value));
  const assignablePositions = positions.filter((p) =>
    allowedPositions.includes(p.value)
  );
  const assignableCountries = countries.filter((c) =>
    allowedCountries.includes(c.id)
  );

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password" || name === "repeatPassword") {
      setPasswordMatch(
        name === "password"
          ? value === formData.repeatPassword
          : formData.password === value
      );
      if (name === "password") {
        const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
        setPasswordValid(isValid);
      }
    }
  };

  const handleMultiSelect = (field, selected) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selected ? selected.map((s) => s.id || s.value) : [],
    }));
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!passwordMatch || !passwordValid) {
      setError(
        t("Password must be at least 8 characters long and include 1 uppercase, 1 lowercase, and 1 digit.")
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      first_name: formData.firstname,
      last_name: formData.lastname,
      email: formData.email,
      locale: formData.locale,
      password: formData.password,
      status: formData.status,
      country: formData.country || null,
      countries: formData.user_countries,
      groups: formData.groups,
      user_positions: formData.positions,
      assignable_groups: formData.access_groups,
      assignable_user_positions: formData.access_positions,
      assignable_countries: formData.access_countries,
      comment,
    };

    fetch("http://10.46.0.140:8650/users/create", {
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
          throw new Error(data.detail || t("Failed to create user"));
        }
        return res.json();
      })
      .then(() => {
        setSuccess(t("User created successfully!"));
        setTimeout(() => navigate("/admin/users"), 1200);
      })
      .catch((err) => {
        setError(err.message);
        setIsSubmitting(false);
      });
  };

  return (
    <PageLayout
      title={t("Create User")}
      description={t("Add a new user and configure their access permissions.")}
      actions={
        <SecondaryButton
          onClick={() => navigate("/admin/users")}
          icon={FaArrowLeft}
          disabled={isSubmitting}
        >
          {t("Back to Users")}
        </SecondaryButton>
      }
      loading={loading}
    >
      {/* Feedback messages */}
      {success && (
        <div className="mb-6">
          <Alert type="success" message={success} />
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic User Information */}
        <Section
          title={t("Basic User Information")}
          description={t("Enter the user's personal details, locale, and status.")}
          icon={FaUser}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("First Name")}
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              icon={FaUser}
            />
            <FormInput
              label={t("Last Name")}
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              icon={FaUser}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("Email Address")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              icon={FaEnvelope}
            />
            <FormSelect
              label={t("Position")}
              options={positions}
              value={positions.find((p) => formData.positions.includes(p.value))}
              onChange={(s) =>
                setFormData((p) => ({ ...p, positions: s ? [s.value] : [] }))
              }
              placeholder={t("Select Position")}
              disabled={isSubmitting}
              icon={FaBriefcase}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label={t("Sitting Country")}
              options={countries}
              value={countries.find((c) => c.value === formData.country)}
              onChange={(s) => setFormData((p) => ({ ...p, country: s?.value }))}
              disabled={isSubmitting}
              icon={FaGlobe}
            />
            <FormSelect
              label={t("Locale")}
              options={localeOptions}
              value={localeOptions.find((l) => l.value === formData.locale)}
              onChange={(s) => setFormData((p) => ({ ...p, locale: s?.value }))}
              disabled={isSubmitting}
              icon={FaGlobe}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label={t("Status")}
              options={statusOptions}
              value={statusOptions.find((s) => s.value === formData.status)}
              onChange={(s) => setFormData((p) => ({ ...p, status: s.value }))}
              disabled={isSubmitting}
              icon={FaCheckCircle}
            />
          </div>
        </Section>

        {/* Password Section */}
        <Section
          title={t("Password")}
          description={t("Set a secure password for the user account.")}
          icon={FaLock}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("Password")}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              icon={FaLock}
              error={!passwordValid && formData.password ? t("Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit") : null}
            />
            <FormInput
              label={t("Repeat Password")}
              name="repeatPassword"
              type="password"
              value={formData.repeatPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              icon={FaLock}
              error={!passwordMatch && formData.repeatPassword ? t("Passwords do not match") : null}
            />
          </div>

          {/* Password requirements */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-blue-400 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-200 mb-2">
                  {t("Password Requirements")}
                </h4>
                <ul className="text-xs text-blue-200/70 space-y-1">
                  <li>• {t("At least 8 characters long")}</li>
                  <li>• {t("At least 1 uppercase letter")}</li>
                  <li>• {t("At least 1 lowercase letter")}</li>
                  <li>• {t("At least 1 digit")}</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Access Rights */}
        <Section
          title={t("Access Rights")}
          description={t("Assign groups, positions, and countries to the new user.")}
          icon={FaShieldAlt}
        >
          <FormMultiSelect
            label={t("Assigned Countries")}
            options={countries}
            value={countries.filter((c) => formData.user_countries.includes(c.id))}
            onChange={(s) => handleMultiSelect("user_countries", s)}
            disabled={isSubmitting}
            icon={FaGlobe}
          />
          <FormMultiSelect
            label={t("Assigned Groups")}
            options={groupOptions}
            value={groupOptions.filter((g) => formData.groups.includes(g.value))}
            onChange={(s) => handleMultiSelect("groups", s)}
            disabled={isSubmitting}
            icon={FaUsers}
          />
          <FormMultiSelect
            label={t("Assigned Datasources")}
            options={[]}
            value={[]}
            onChange={() => {}}
            placeholder={t("No datasources assigned")}
            disabled={true}
            icon={FaBriefcase}
          />
        </Section>

        {/* Can Assign Rights */}
        <Section
          title={t("Can Assign Rights to Other Users")}
          description={t("Define which access this user can grant to others.")}
          icon={FaShieldAlt}
        >
          <Protected role="route:users#can-assign-countries">
            <FormMultiSelect
              label={t("Can Assign Countries")}
              options={assignableCountries}
              value={assignableCountries.filter((c) =>
                formData.access_countries.includes(c.id)
              )}
              onChange={(s) => handleMultiSelect("access_countries", s)}
              disabled={isSubmitting}
              icon={FaGlobe}
            />
          </Protected>
          <Protected role="route:users#can-assign-groups">
            <FormMultiSelect
              label={t("Can Assign Groups")}
              options={assignableGroups}
              value={assignableGroups.filter((g) =>
                formData.access_groups.includes(g.value)
              )}
              onChange={(s) => handleMultiSelect("access_groups", s)}
              disabled={isSubmitting}
              icon={FaUsers}
            />
          </Protected>
          <Protected role="route:users#can-assign-positions">
            <FormMultiSelect
              label={t("Can Assign Positions")}
              options={assignablePositions}
              value={assignablePositions.filter((p) =>
                formData.access_positions.includes(p.value)
              )}
              onChange={(s) => handleMultiSelect("access_positions", s)}
              disabled={isSubmitting}
              icon={FaBriefcase}
            />
          </Protected>
        </Section>

        {/* Comment Section */}
        <Section
          title={t("Creation Comment")}
          description={t("Optional note for audit trail or changelog reference.")}
          icon={FaCommentAlt}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
              {t("Comment")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder={t("Comment (optional)")}
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <SecondaryButton
            type="button"
            onClick={() => navigate("/admin/users")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            disabled={!passwordMatch || !passwordValid}
            icon={FaSave}
          >
            {t("Create User")}
          </PrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
};

export default UsersCreate;