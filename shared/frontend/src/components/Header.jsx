import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";
import { useCountry } from "../context/CountryContext";
import { FaQuestion, FaUser, FaSignOutAlt } from "react-icons/fa";
import { ChevronDown } from "lucide-react";
import Protected from "./Protected";
import Select from "@/components/ui/Select";
import SupportModal from "./modals/SupportModal";
import CreateFeatureModal from "./modals/CreateFeatureModal";
import CreatePositionRequestModal from "./modals/CreatePositionRequestModal";
import i18n from "@/i18n";

// ✅ NEW: import auth context for impersonation + logout
import { useAuth } from "../context/AuthContext"; // adjust path if needed

const Header = () => {
  const { uiSettings } = useUI();
  const { selectedCountry, setSelectedCountry, selectedLocale, setSelectedLocale } =
    useCountry();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  const token = localStorage.getItem("token");
  const isLoginPage = location.pathname === "/login";

  // ✅ NEW: get impersonation state + logout from AuthContext
  const { user: authUser, isImpersonating, impersonationMeta, stopImpersonation, logout } =
    useAuth();

  // 🔹 Fetch user, countries, and available languages
  useEffect(() => {
    if (!token || isLoginPage) return;

    const fetchData = async () => {
      try {
        const [userRes, countryRes] = await Promise.all([
          fetch("http://10.46.0.140:8650/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://10.46.0.140:8650/countries", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const user = await userRes.json();
        const countries = await countryRes.json();

        setCurrentUser(user);

        // 🌍 Country dropdown (UI only)
        setAvailableCountries([
          { value: "all", label: "🌍 All Countries" },
          ...countries.map((c) => ({ value: c.code, label: c.name })),
        ]);

        // 🌐 Languages from i18n resources
        const langs = Object.keys(i18n.options.resources || {}).map((code) => ({
          value: code,
          label: code.toUpperCase(),
        }));
        setAvailableLanguages(langs);

        // 🧠 Set locale from backend or localStorage
        const storedLang = localStorage.getItem("i18nextLng");
        const userLocale = user.locale || storedLang || "en";

        setSelectedLocale(userLocale);
        i18n.changeLanguage(userLocale);
        localStorage.setItem("i18nextLng", userLocale);

        // 🇨🇭 Default country selection (UI only)
        if (user.country) setSelectedCountry(user.country);

        // 🧩 Normalize roles
        if (user.roles) {
          const normalized = user.roles.map((r) =>
            typeof r === "string" ? r.toLowerCase() : r.name.toLowerCase()
          );
          setRoles(normalized);
        }
      } catch (err) {
        console.error("❌ Failed to load header data:", err);
      }
    };

    fetchData();
  }, [token, isLoginPage]);

  // 🔹 Handle locale (language) change → persist + translate
  const handleLocaleChange = async (locale) => {
    const lang = locale.value;
    setSelectedLocale(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);

    try {
      await fetch("http://10.46.0.140:8650/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locale: lang }),
      });
    } catch (err) {
      console.error("❌ Failed to update locale:", err);
    }
  };

  // 🔹 Country change — UI only
  const handleCountryChange = (country) => {
    setSelectedCountry(country.value);
  };

  // 🔹 Role-based access control
  const hasAccess = (requiredRole) => {
    if (!requiredRole) return true;
    if (roles.includes("admin")) return true;
    if (roles.length === 0) return true; // allow render before roles load
    return roles.includes(requiredRole.toLowerCase());
  };

  // 🔹 Navigation
  const navItems = [
    { label: "Home", path: "/home", role: null },
    {
      label: "IT Admin",
      role: "route:it-admin",
      children: [
        { label: "Employees", path: "/it-admin/employees", role: "route:it-admin#employees" },
        { label: "Onboarding", path: "/it-admin/onboarding", role: "route:it-admin#onboarding" },
        { label: "Offboarding", path: "/it-admin/offboarding", role: "route:it-admin#offboarding" },
      ],
    },
    {
      label: "Analytics",
      role: "route:analytics",
      children: [
        { label: "Queries", path: "/analytics/queries/published", role: "route:analytics#queries" },
        {
          label: "Unpublished Queries",
          path: "/analytics/queries/unpublished",
          role: "route:analytics#unpublished",
        },
        {
          label: "Reportinator 2.0",
          path: "/analytics/reportinator/v2",
          role: "route:analytics#reportinator",
        },
        { label: "Datasources", path: "/analytics/datasources", role: "route:analytics#datasources" },
      ],
    },
    {
      label: "Product",
      role: "route:product",
      children: [
        { label: "Feature Requests", path: "/product/feature-requests", role: "route:product#features" },
        {
          label: "Position Requests",
          path: "/product/position-requests",
          role: "route:product#position-change",
        },
        { label: "Workflows", path: "/product/workflows", role: "route:workflows" },
      ],
    },
    {
      label: "Other",
      role: "route:other",
      children: [{ label: "Batch Uploader", path: "/other/batch-uploader", role: "route:batch-uploader" }],
    },
    {
      label: "Admin",
      role: "route:settings#admin",
      children: [
        { label: "Countries", path: "/admin/countries", role: "route:countries" },
        { label: "Users", path: "/admin/users", role: "route:users#view" },
        { label: "User Positions", path: "/admin/user-positions", role: "route:positions" },
        { label: "User Groups", path: "/admin/user-groups", role: "route:groups" },
        { label: "User Roles", path: "/admin/user-roles", role: "route:roles" },
        { label: "Matrix Log", path: "/admin/matrix-log", role: "route:matrix#view" },
      ],
    },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setOpenMenu(null);
  };

  if (isLoginPage) return null;

  const visibleNavItems = navItems
    .filter((item) => hasAccess(item.role))
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter((child) => hasAccess(child.role)) }
        : item
    )
    .filter((item) => !item.children || item.children.length > 0);

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm shadow-lg"
        style={{
          background: "linear-gradient(to bottom, #072b48 0%, #093359 100%)",
        }}
      >
        <div className="flex justify-between items-center px-10 py-3 text-white">
          {/* Left: Logo + Nav */}
          <div className="flex items-center space-x-10">
            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <img
                  src="/auto1_group_white_logo.png"
                  alt="Valinor Logo"
                  className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Valinor
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-2">
              {visibleNavItems.map((item) => {
                const isActive = openMenu === item.label;
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenMenu(isActive ? null : item.label)}
                      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 shadow-lg shadow-blue-500/30 scale-105"
                          : "hover:bg-white/10 hover:scale-105"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${
                          isActive ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isActive && (
                      <div
                        // 🔻 DARK NAV DROPDOWN
                        className="absolute bg-slate-950/95 text-blue-50 rounded-2xl shadow-2xl mt-3 min-w-[240px] z-50 border border-white/10 overflow-hidden animate-fadeIn"
                        onMouseLeave={() => setOpenMenu(null)}
                      >
                        {item.children.map((child, idx) => (
                          <div
                            key={child.label}
                            onClick={() => handleNavClick(child.path)}
                            className={`px-5 py-3 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-white/10 ${
                              idx !== 0 ? "border-t border-white/10" : ""
                            }`}
                          >
                            {child.label}
                          </div>
                        ))}

                        {item.label === "Product" && (
                          <>
                            <div className="border-t-2 border-white/20 my-1" />
                            <div
                              onClick={() => {
                                setShowFeatureModal(true);
                                setOpenMenu(null);
                              }}
                              className="px-5 py-3 cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-white/10 text-green-300"
                            >
                              + New Feature Request
                            </div>
                            <div
                              onClick={() => {
                                setShowPositionModal(true);
                                setOpenMenu(null);
                              }}
                              className="px-5 py-3 cursor-pointer text-sm font-semibold transition-all duration-200 hover:bg-white/10 text-purple-300"
                            >
                              + New Position Request
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Country + Locale + User + Help + Logout */}
          <div className="flex items-center space-x-4">
            {/* Country Select */}
            <div className="w-48">
              <Select
                options={availableCountries}
                value={availableCountries.find((c) => c.value === selectedCountry)}
                onChange={handleCountryChange}
                placeholder="Country"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: "0.75rem",
                    minHeight: "36px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "white",
                    fontWeight: "600",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "rgba(255, 255, 255, 0.7)",
                  }),
                  // 🔻 DARK MENU FOR REACT-SELECT
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "rgba(15, 23, 42, 0.98)", // slate-900-ish
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.6)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? "rgba(59, 130, 246, 0.25)"
                      : "transparent",
                    color: "white",
                    cursor: "pointer",
                  }),
                }}
              />
            </div>

            {/* Locale Select */}
            <div className="w-32">
              <Select
                options={availableLanguages}
                value={availableLanguages.find((l) => l.value === selectedLocale)}
                onChange={handleLocaleChange}
                placeholder="Language"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: "0.75rem",
                    minHeight: "36px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "white",
                    fontWeight: "600",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "rgba(255, 255, 255, 0.7)",
                  }),
                  // 🔻 DARK MENU FOR REACT-SELECT
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "rgba(15, 23, 42, 0.98)",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.6)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? "rgba(59, 130, 246, 0.25)"
                      : "transparent",
                    color: "white",
                    cursor: "pointer",
                  }),
                }}
              />
            </div>

            {/* User Info */}
            {currentUser && (
              <Protected role="route:users#view">
                <div
                  onClick={() => navigate(`/admin/users/${currentUser.id}/view`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg.white/25 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                </div>
              </Protected>
            )}

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => setShowHelpMenu((prev) => !prev)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg.white/15 hover:bg.white/25 transition-all duration-300 hover:scale-110 shadow-md"
                title="Help & Info"
              >
                <FaQuestion className="text-white text-sm" />
              </button>

              {showHelpMenu && (
                <div
                  // 🔻 DARK HELP DROPDOWN
                  className="absolute right-0 mt-3 bg-slate-950/95 text-blue-50 rounded-2xl shadow-2xl w-64 border border-white/10 z-50 overflow-hidden animate-fadeIn"
                  onMouseLeave={() => setShowHelpMenu(false)}
                >
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      setShowSupportModal(true);
                    }}
                    className="px-5 py-3 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  >
                    Support
                  </div>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      setShowFeatureModal(true);
                    }}
                    className="px-5 py-3 cursor-pointer text-sm font-medium transition-all duration-200 border-t border-white/10 hover:bg-white/10"
                  >
                    Request Feature / Bug
                  </div>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      setShowPositionModal(true);
                    }}
                    className="px-5 py-3 cursor-pointer text-sm font-medium transition-all duration-200 border-t border-white/10 hover:bg.white/10"
                  >
                    Request Position Change
                  </div>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      navigate("/about");
                    }}
                    className="px-5 py-3 cursor-pointer text-sm font-medium transition-all duration-200 border-t border-white/10 hover:bg.white/10"
                  >
                    About
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={logout} // ✅ use AuthContext logout so impersonation state is cleaned too
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-md font-semibold text-sm"
            >
              <FaSignOutAlt className="text-sm" />
              Logout
            </button>
          </div>
        </div>

        {/* ✅ GLOBAL IMPERSONATION BANNER (in header, under main row) */}
        {isImpersonating && (
          <div className="px-10 pb-2">
            <div className="bg-amber-500/10 border border-amber-400/40 text-amber-100 text-xs sm:text-sm px-4 py-2 rounded-b-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 rounded-full bg-amber-400/20 border border-amber-300/60 items-center justify-center text-[10px] font-bold">
                  !
                </span>
                <span>
                  You are currently impersonating{" "}
                  <strong>
                    {authUser
                      ? `${authUser.first_name} ${authUser.last_name}`
                      : "another user"}
                  </strong>
                  {impersonationMeta?.impersonated_by?.email && (
                    <>
                      {" "}
                      (impersonation started by {impersonationMeta.impersonated_by.email})
                    </>
                  )}
                  .
                </span>
              </div>
              <button
                onClick={stopImpersonation}
                className="text-amber-100 underline text-xs sm:text-sm font-medium self-start sm:self-auto"
              >
                Return to your account
              </button>
            </div>
          </div>
        )}

        {/* Persistent Blue Glow */}
        <div
          className="absolute bottom-0 left-0 w-full h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(96,165,250,0.9) 50%, rgba(59,130,246,0.8) 100%)",
            boxShadow:
              "0 0 20px 3px rgba(59,130,246,0.6), 0 0 40px 6px rgba(59,130,246,0.3)",
          }}
        />
      </header>

      {/* Modals */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        currentUser={{
          email: currentUser?.email,
          fullName: `${currentUser?.first_name || ""} ${
            currentUser?.last_name || ""
          }`.trim(),
        }}
      />
      <CreateFeatureModal
        open={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
      />
      <CreatePositionRequestModal
        open={showPositionModal}
        onClose={() => setShowPositionModal(false)}
      />
    </>
  );
};

export default Header;