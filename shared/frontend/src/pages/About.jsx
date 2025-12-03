import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaServer,
  FaDesktop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCopyright,
} from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

const InfoRow = ({ icon: Icon, label, value, variant = "default" }) => (
  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Icon className="text-white text-lg" />
        </div>
      )}
      <span className="text-sm font-medium text-blue-200">{label}</span>
    </div>
    <div>
      {variant === "badge" ? (
        <Badge variant="info" className="font-mono">
          {value}
        </Badge>
      ) : (
        <span className="text-base font-semibold text-white font-mono">{value}</span>
      )}
    </div>
  </div>
);

const About = () => {
  const { t } = useTranslation();

  // Mock values (replace with real API later)
  const [backendVersion, setBackendVersion] = useState(null);
  const [frontendVersion] = useState("1.0.0");
  const [loading, setLoading] = useState(true);

  // Simulate API call to get backend version
  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setBackendVersion("1.0.0");
      setLoading(false);
    }, 500);
  }, []);

  const isMatched = backendVersion === frontendVersion;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d2847] to-[#0f3460]">
      {/* Animated background elements */}
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
      <div className="relative z-10 container-custom py-32 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Main Card */}
          <Card className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <img
                  src="/Valinor_Logo_500x500.png"
                  alt="Valinor Logo"
                  className="relative w-40 h-40 rounded-2xl shadow-2xl"
                />
              </div>
            </div>

            {/* App Title */}
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("Valinor Application")}
            </h1>
            <p className="text-blue-200/70 text-sm mb-8">
              {t("Enterprise Corporate IT Management Platform")}
            </p>

            {/* Version Information */}
            <div className="space-y-3 mb-8">
              <InfoRow
                icon={FaServer}
                label={t("Backend Version")}
                value={loading ? "..." : backendVersion || "Unknown"}
                variant="badge"
              />
              <InfoRow
                icon={FaDesktop}
                label={t("Frontend Version")}
                value={frontendVersion}
                variant="badge"
              />
            </div>

            {/* Version Match Status */}
            {!loading && (
              <div className="mb-8">
                {isMatched ? (
                  <div className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-green-400 text-xl" />
                    </div>
                    <div className="text-left">
                      <p className="text-green-300 font-semibold text-sm">
                        {t("Versions Matched")}
                      </p>
                      <p className="text-green-200/60 text-xs">
                        {t("Frontend and backend are in sync")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Alert
                    type="warning"
                    message={t("Version Mismatch Detected")}
                    description={t(
                      "Frontend version does not match backend version. Please refresh or contact support."
                    )}
                  />
                )}
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8"></div>

            {/* System Information */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FaInfoCircle className="text-blue-400 text-lg" />
                <h3 className="text-sm font-semibold text-blue-200">
                  {t("System Information")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs text-blue-200/60 mb-1">{t("Environment")}</p>
                  <p className="text-sm text-white font-medium">
                    {import.meta.env.MODE === "production"
                      ? t("Production")
                      : t("Development")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-200/60 mb-1">{t("Build Date")}</p>
                  <p className="text-sm text-white font-medium">
                    {'2025-11-03 20:41:21'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-200/60 mb-1">{t("Node Version")}</p>
                  <p className="text-sm text-white font-medium">
                    {import.meta.env.VITE_NODE_VERSION || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-200/60 mb-1">{t("React Version")}</p>
                  <p className="text-sm text-white font-medium">
                    {React.version}
                  </p>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaCopyright className="text-blue-400 text-lg" />
                <h3 className="text-sm font-semibold text-blue-200">
                  {t("License & Attribution")}
                </h3>
              </div>
              <div className="space-y-3 text-xs text-blue-200/70 leading-relaxed">
                <p>
                  {t("Font Twemoji by Twitter licensed under")}{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    CC-BY 4.0
                  </a>
                </p>
                <div className="h-px bg-white/10 my-3"></div>
                <p className="flex items-center justify-center gap-2">
                  <FaCopyright className="text-blue-400" />
                  <span>
                    {new Date().getFullYear()} {t("VKDB Sverige AB on behalf of AUTO1 Group Operations SE.")}
                  </span>
                </p>
                <p className="text-blue-200/50 text-[10px]">
                  {t("All rights reserved.")}
                </p>
              </div>
            </div>
          </Card>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Support Card */}
            <Card className="text-center">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  <FaInfoCircle className="text-white text-xl" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {t("Need Help?")}
                </h3>
                <p className="text-xs text-blue-200/70 mb-4">
                  {t("Contact our support team for assistance")}
                </p>
                <a
                  href="mailto:support@valinor.com"
                  className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  support@valinor.com
                </a>
              </div>
            </Card>

            {/* Documentation Card */}
            <Card className="text-center">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
                  <FaInfoCircle className="text-white text-xl" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {t("Documentation")}
                </h3>
                <p className="text-xs text-blue-200/70 mb-4">
                  {t("Learn more about Valinor features")}
                </p>
                <a
                  href="http://10.46.0.140:8650/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {t("View Documentation")}
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 mt-12">
          <p className="text-blue-200/40 text-sm">
            {t("Powered by Valinor Technology")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;