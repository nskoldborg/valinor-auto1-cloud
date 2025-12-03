import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPlus,
  FaEdit,
  FaKey,
  FaUser,
  FaEnvelope,
  FaGlobe,
  FaUsers,
  FaBriefcase,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaInfoCircle,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 10;

const humanize = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const Arrow = () => <span aria-hidden className="text-blue-400"> → </span>;

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && (
      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="text-blue-400 text-sm" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-blue-200/60 font-medium mb-0.5">{label}</p>
      <div className="text-sm text-white font-medium break-words">{value || "—"}</div>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
      {Icon && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Icon className="text-white text-sm" />
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const ChangeRow = ({ entry, navigate }) => {
  const { t } = useTranslation();
  const field = entry.field ?? entry.section;
  const objectType = entry.object_type ?? null;
  const objectId = entry.object_id ?? null;
  const legacyTarget = entry.target;
  const objectName = entry.object_name ?? entry.target_name ?? null;

  const rawTimestamp = entry.timestamp;
  const actor = entry.actor ?? entry.created_by_name ?? entry.created_by ?? "Unknown";
  const actorId = entry.actor_id ?? entry.created_by ?? null;

  const comment = entry.comment ?? entry.message;
  const oldValue = entry.old_value ?? entry.previous_value ?? null;
  const newValue = entry.new_value ?? null;
  const action = entry.action ?? "update";

  // Format timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return "[Unknown date]";
    const d = new Date(ts);
    const weekday = d.toLocaleString("en-GB", { weekday: "short" });
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `[${weekday} ${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}]`;
  };

  // Clickable target label
  const Target = () => {
    if (objectType && objectId) {
      const base = `${humanize(objectType)} ${objectId}`;
      const label = objectName ? `${base} - ${objectName}` : base;
      if (objectType.toLowerCase() === "user") {
        return (
          <Protected role="route:users#view">
            <span
              className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
              onClick={() => navigate(`/admin/users/${objectId}/view`)}
            >
              {label}
            </span>
          </Protected>
        );
      }
      return <span className="text-blue-200">{label}</span>;
    }
    return <span className="text-blue-200">{legacyTarget}</span>;
  };

  // Action phrasing
  const actionPhrase = (() => {
    const lower = String(action).toLowerCase();
    const quoted = action.match(/"(.*?)"/)?.[1] ?? "";
    if (lower.includes("added item")) return `adding item ${quoted || ""}`.trim();
    if (lower.includes("removed item")) return `removing item ${quoted || ""}`.trim();
    if (lower.includes("create")) return "creating record";
    if (lower.includes("delete")) return "deleting record";
    if (lower === "update" && newValue && oldValue && newValue !== oldValue)
      return `changed value`;
    return "updating record";
  })();

  return (
    <li className="border-b border-white/5 pb-3 last:border-none hover:bg-white/5 rounded-lg px-3 py-2 transition-all duration-200">
      <div className="flex items-start gap-2">
        <FaClock className="text-blue-400 text-xs mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-200/80 leading-relaxed">
            <span className="text-blue-300 font-mono">{formatTimestamp(rawTimestamp)}</span>{" "}
            <Protected role="route:users#view">
              <span
                className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                onClick={() => actorId && navigate(`/admin/users/${actorId}/view`)}
              >
                {actor}
              </span>
            </Protected>{" "}
            updated <strong className="text-white">"{humanize(field)}"</strong> on <Target />
            {objectName ? (
              <span className="text-blue-200/70"> - {objectName}: {actionPhrase}</span>
            ) : (
              <span className="text-blue-200/70"> - {actionPhrase}</span>
            )}
          </p>

          {(oldValue || newValue) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <code className="bg-red-500/10 text-red-300 px-2 py-1 rounded border border-red-500/20">
                {oldValue || "∅"}
              </code>
              <Arrow />
              <code className="bg-green-500/10 text-green-300 px-2 py-1 rounded border border-green-500/20">
                {newValue || "∅"}
              </code>
            </div>
          )}

          {comment && (
            <p className="italic text-blue-200/60 text-xs mt-2 pl-3 border-l-2 border-blue-500/30">
              {comment}
            </p>
          )}
        </div>
      </div>
    </li>
  );
};

const Pagination = ({ page, total, onPageChange }) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex justify-between items-center pt-4 border-t border-white/10">
      <SecondaryButton
        disabled={page === 1}
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        icon={FaChevronLeft}
        size="sm"
      >
        {t("Previous")}
      </SecondaryButton>
      <span className="text-sm text-blue-200/70 font-medium">
        {t("Page")} {page} {t("of")} {totalPages}
      </span>
      <SecondaryButton
        disabled={page * PAGE_SIZE >= total}
        onClick={() => onPageChange((p) => (p * PAGE_SIZE >= total ? p : p + 1))}
        icon={FaChevronRight}
        iconPosition="right"
        size="sm"
      >
        {t("Next")}
      </SecondaryButton>
    </div>
  );
};

const UsersView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Auth / impersonation context
  const {
    user: authUser,
    isImpersonating,
    impersonationMeta,
    startImpersonation,
    stopImpersonation,
  } = useAuth();

  const [user, setUser] = useState(null); // viewed user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [changelogTo, setChangelogTo] = useState([]);
  const [changelogBy, setChangelogBy] = useState([]);
  const [pageLeft, setPageLeft] = useState(1);
  const [pageRight, setPageRight] = useState(1);

  const isViewingCurrentImpersonatedUser =
    isImpersonating && authUser && user && authUser.id === user.id;

  // Load user details
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`http://10.46.0.140:8650/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("Failed to fetch user"));
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Load API Keys
  useEffect(() => {
    if (!token || !id) return;
    fetch(`http://10.46.0.140:8650/api-keys/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setApiKeys(data || []))
      .catch(() => setApiKeys([]));
  }, [id, token]);

  // Load both changelog directions
  useEffect(() => {
    if (!token || !id) return;

    // Left: Changes TO this user
    fetch(`http://10.46.0.140:8650/changelog/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setChangelogTo(sorted);
      })
      .catch(() => setChangelogTo([]));

    // Right: Changes BY this user
    fetch(`http://10.46.0.140:8650/changelog/actor/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setChangelogBy(sorted);
      })
      .catch(() => setChangelogBy([]));
  }, [id, token]);

  const paginate = (data, page) =>
    data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const leftLogs = paginate(changelogTo, pageLeft);
  const rightLogs = paginate(changelogBy, pageRight);

  // ---- Impersonation handlers ----
  const handleImpersonate = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(
        `http://10.46.0.140:8650/auth/impersonate/${user.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to impersonate:", res.status, text);
        alert(t("Failed to start impersonation"));
        return;
      }

      const data = await res.json();
      startImpersonation(data); // swaps token + reloads
    } catch (err) {
      console.error("Impersonation error:", err);
      alert(t("Failed to start impersonation"));
    }
  };

  return (
    <PageLayout
      title={user ? `${user.first_name} ${user.last_name}` : t("User Details")}
      description={t("Detailed information, permissions, and activity log.")}
      actions={
        <div className="flex gap-2">
          <SecondaryButton
            onClick={() => navigate("/admin/users")}
            icon={FaArrowLeft}
          >
            {t("Back to Users")}
          </SecondaryButton>

          <Protected role="route:users#create">
            <PrimaryButton
              onClick={() => navigate("/admin/users/create")}
              icon={FaPlus}
              variant="success"
            >
              {t("Create User")}
            </PrimaryButton>
          </Protected>

          {user && (
            <Protected role="route:users#edit">
              <PrimaryButton
                onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                icon={FaEdit}
              >
                {t("Edit User")}
              </PrimaryButton>
            </Protected>
          )}

          {/* Impersonate / stop impersonating (admin only) */}
          {user && (
            <Protected role="routes:users#admin-impersonate-user">
              {isViewingCurrentImpersonatedUser ? (
                <SecondaryButton onClick={stopImpersonation} icon={FaUser}>
                  {t("Stop Impersonating")}
                </SecondaryButton>
              ) : (
                <PrimaryButton onClick={handleImpersonate} icon={FaUser}>
                  {t("Impersonate User")}
                </PrimaryButton>
              )}
            </Protected>
          )}
        </div>
      }
      loading={loading}
      error={error}
    >
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="mb-4">
          <div className="bg-amber-500/10 border border-amber-400/40 text-amber-100 text-xs sm:text-sm px-4 py-2 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaInfoCircle className="text-amber-300 flex-shrink-0" />
              <span>
                {t("You are currently impersonating")}{" "}
                <strong>
                  {authUser
                    ? `${authUser.first_name} ${authUser.last_name}`
                    : t("another user")}
                </strong>
                {impersonationMeta?.impersonated_by?.email && (
                  <>
                    {" "}
                    ({t("impersonation started by")}{" "}
                    {impersonationMeta.impersonated_by.email})
                  </>
                )}
                .
              </span>
            </div>
            <button
              onClick={stopImpersonation}
              className="text-amber-100 underline text-xs sm:text-sm font-medium self-start sm:self-auto"
            >
              {t("Return to your account")}
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* ====================== USER DETAILS ====================== */}
          <Card>
            <Section title={t("Basic Information")} icon={FaUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow label={t("User ID")} value={user.id} icon={FaUser} />
                <InfoRow
                  label={t("Full Name")}
                  value={`${user.first_name} ${user.last_name}`}
                  icon={FaUser}
                />
                <InfoRow label={t("Email")} value={user.email} icon={FaEnvelope} />
                <InfoRow
                  label={t("Status")}
                  value={
                    user.status ? (
                      <Badge variant="success" icon={FaCheckCircle}>
                        {t("Active")}
                      </Badge>
                    ) : (
                      <Badge variant="danger" icon={FaTimesCircle}>
                        {t("Inactive")}
                      </Badge>
                    )
                  }
                  icon={FaCheckCircle}
                />
                <InfoRow
                  label={t("Sitting Country")}
                  value={user.country}
                  icon={FaGlobe}
                />
                <InfoRow
                  label={t("Locale")}
                  value={user.locale?.toUpperCase()}
                  icon={FaGlobe}
                />
              </div>
            </Section>
          </Card>

          {/* ====================== ASSIGNMENTS ====================== */}
          <Card>
            <Section title={t("Assignments")} icon={FaShieldAlt}>
              <div className="space-y-6">
                {/* Countries */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaGlobe className="text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Assigned Countries")}
                    </h4>
                  </div>
                  {user.countries?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.countries.map((c) => (
                        <Badge key={c.id} variant="assigned_options">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>

                {/* Groups */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaUsers className="text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Groups")}
                    </h4>
                  </div>
                  {user.groups?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.groups.map((g) => (
                        <Badge key={g.id} variant="assigned_options">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>

                {/* Roles */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaShieldAlt className="text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Roles")}
                    </h4>
                  </div>
                  {user.roles?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((r) => (
                        <Badge key={r.id} variant="assigned_options">
                          {r.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>

                {/* Positions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaBriefcase className="text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Positions")}
                    </h4>
                  </div>
                  {user.user_positions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.user_positions.map((p) => (
                        <Badge key={p.id} variant="assigned_options">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>
              </div>
            </Section>
          </Card>

          {/* ====================== ASSIGNABLE RIGHTS ====================== */}
          <Card>
            <Section title={t("Can Assign to Other Users")} icon={FaShieldAlt}>
              <div className="space-y-6">
                {/* Assignable Groups */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaUsers className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Can Assign Groups")}
                    </h4>
                  </div>
                  {user.assignable_groups?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.assignable_groups.map((g) => (
                        <Badge key={g.id} variant="assignable_options">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>

                {/* Assignable Positions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaBriefcase className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Can Assign Positions")}
                    </h4>
                  </div>
                  {user.assignable_positions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.assignable_positions.map((p) => (
                        <Badge key={p.id} variant="assignable_options">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>

                {/* Assignable Countries */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaGlobe className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-blue-200">
                      {t("Can Assign Countries")}
                    </h4>
                  </div>
                  {user.assignable_countries?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.assignable_countries.map((c) => (
                        <Badge key={c.id} variant="assignable_options">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-200/40 text-sm italic">{t("None")}</p>
                  )}
                </div>
              </div>
            </Section>
          </Card>

          {/* ====================== METADATA ====================== */}
          <Card>
            <Section title={t("Metadata")} icon={FaClock}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow
                  label={t("Created At")}
                  value={
                    user.created_at
                      ? new Date(user.created_at)
                          .toISOString()
                          .replace("T", " ")
                          .split(".")[0]
                      : "—"
                  }
                  icon={FaClock}
                />
                <InfoRow
                  label={t("Created By")}
                  value={user.created_by}
                  icon={FaUser}
                />
                <InfoRow
                  label={t("Updated At")}
                  value={
                    user.updated_at
                      ? new Date(user.updated_at)
                          .toISOString()
                          .replace("T", " ")
                          .split(".")[0]
                      : "—"
                  }
                  icon={FaClock}
                />
                <InfoRow
                  label={t("Updated By")}
                  value={user.updated_by}
                  icon={FaUser}
                />
              </div>
            </Section>
          </Card>

          {/* ====================== API KEYS ====================== */}
          <Protected role="route:users#admin-view-users-api-keys">
            <Card>
              <Section title={t("API Keys")} icon={FaKey}>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <FaKey className="text-4xl text-blue-400/30 mx-auto mb-3" />
                    <p className="text-blue-200/40 text-sm">
                      {t("No API Keys found for this user.")}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-blue-200 font-semibold">
                            {t("Name")}
                          </th>
                          <th className="text-left py-3 px-4 text-blue-200 font-semibold">
                            {t("Status")}
                          </th>
                          <th className="text-left py-3 px-4 text-blue-200 font-semibold">
                            {t("Created")}
                          </th>
                          <th className="text-left py-3 px-4 text-blue-200 font-semibold">
                            {t("Expires")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.map((k) => (
                          <tr
                            key={k.id}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 px-4 text-white">{k.name}</td>
                            <td className="py-3 px-4">
                              {k.status === "active" && (
                                <Badge variant="success">{t("Active")}</Badge>
                              )}
                              {k.status === "inactive" && (
                                <Badge variant="default">{t("Inactive")}</Badge>
                              )}
                              {k.status === "expired" && (
                                <Badge variant="danger">{t("Expired")}</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-blue-200/70">
                              {k.createdDate || "—"}
                            </td>
                            <td className="py-3 px-4 text-blue-200/70">
                              {k.expires || t("Never")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </Card>
          </Protected>

          {/* ====================== CHANGELOG ====================== */}
          <Protected role="route:users#view-changelog">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Changes To */}
              <div className="flex flex-col">
                <Card className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <FaHistory className="text-white text-sm" />
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        {t("Changes To {{name}}", {
                          name: `${user.first_name} ${user.last_name}`,
                        })}
                      </h3>
                    </div>

                    {/* Content - grows to fill space */}
                    <div className="flex-1 pt-4 min-h-[300px]">
                      {leftLogs.length === 0 ? (
                        <div className="text-center py-8">
                          <FaHistory className="text-4xl text-blue-400/30 mx-auto mb-3" />
                          <p className="text-blue-200/40 text-sm">
                            {t("No changes found.")}
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {leftLogs.map((entry) => (
                            <ChangeRow
                              key={entry.id}
                              entry={entry}
                              navigate={navigate}
                            />
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer - always at bottom */}
                    <div className="mt-4">
                      <Pagination
                        page={pageLeft}
                        total={changelogTo.length}
                        onPageChange={setPageLeft}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: Changes By */}
              <div className="flex flex-col">
                <Card className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <FaHistory className="text-white text-sm" />
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        {t("Changes By {{name}}", {
                          name: `${user.first_name} ${user.last_name}`,
                        })}
                      </h3>
                    </div>

                    {/* Content - grows to fill space */}
                    <div className="flex-1 pt-4 min-h-[300px]">
                      {rightLogs.length === 0 ? (
                        <div className="text-center py-8">
                          <FaHistory className="text-4xl text-blue-400/30 mx-auto mb-3" />
                          <p className="text-blue-200/40 text-sm">
                            {t("No changes found.")}
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {rightLogs.map((entry) => (
                            <ChangeRow
                              key={entry.id}
                              entry={entry}
                              navigate={navigate}
                            />
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer - always at bottom */}
                    <div className="mt-4">
                      <Pagination
                        page={pageRight}
                        total={changelogBy.length}
                        onPageChange={setPageRight}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Protected>
        </div>
      )}
    </PageLayout>
  );
};

export default UsersView;