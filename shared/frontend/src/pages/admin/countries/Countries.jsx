import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaPlus,
  FaGlobe,
  FaCheckCircle,
  FaTimesCircle,
  FaLanguage,
} from "react-icons/fa";
import Protected from "@/components/Protected";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Table, THead, TRow, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, DangerButton, SecondaryButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { Pagination } from "@/components/ui/Pagination";

const Countries = () => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [showTranslationOutput, setShowTranslationOutput] = useState(false);
  const [translationOutput, setTranslationOutput] = useState("");
  const [translationSuccess, setTranslationSuccess] = useState(false);
  const itemsPerPage = 25;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://10.46.0.140:8650/countries/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch countries");
        return res.json();
      })
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.id - b.id);
        setCountries(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    let filtered = countries;

    // Apply status filter
    if (statusFilter === "enabled") {
      filtered = filtered.filter((c) => c.enabled);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter((c) => !c.enabled);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCountries(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, countries]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://10.46.0.140:8650/countries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || t("Failed to delete country"));
      }

      setCountries((prev) => prev.filter((c) => c.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateTranslations = async () => {
    setTranslationsLoading(true);
    setTranslationOutput("");
    setShowTranslationOutput(false);
    
    try {
      const res = await fetch("http://10.46.0.140:8650/system/scripts/run?script_name=update_translations.js", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("Failed to update translations"));
      }

      const result = await res.json();
      
      // Format the output for display
      const output = result.output || result.message || t("Translations updated successfully!");
      setTranslationOutput(output);
      setTranslationSuccess(true);
      setShowTranslationOutput(true);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        setShowTranslationOutput(false);
      }, 5000);
      
    } catch (err) {
      const errorMessage = t("Error updating translations:") + " " + err.message;
      setTranslationOutput(errorMessage);
      setTranslationSuccess(false);
      setShowTranslationOutput(true);
      
      // Auto-close error after 5 seconds
      setTimeout(() => {
        setShowTranslationOutput(false);
      }, 5000);
    } finally {
      setTranslationsLoading(false);
    }
  };

  // Format date to Stockholm time
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Stockholm",
    }).format(date);
  };

  // Calculate stats
  const totalCountries = countries.length;
  const enabledCount = countries.filter((c) => c.enabled).length;
  const disabledCount = countries.filter((c) => !c.enabled).length;

  // Pagination
  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

  // Handle stat card click to filter
  const handleStatClick = (filter) => {
    setStatusFilter(filter);
  };

  return (
    <PageLayout
      title={t("Countries")}
      description={t("Manage available countries in the system.")}
      actions={
        <div className="flex gap-2">
          <Protected role="route:countries#update-translations">
            <SecondaryButton
              onClick={handleUpdateTranslations}
              icon={FaLanguage}
              disabled={translationsLoading}
            >
              {translationsLoading ? t("Updating...") : t("Get Translations")}
            </SecondaryButton>
          </Protected>
          <Protected role="route:countries#create">
            <PrimaryButton
              onClick={() => navigate("/admin/countries/create")}
              icon={FaPlus}
            >
              {t("Add Country")}
            </PrimaryButton>
          </Protected>
        </div>
      }
      loading={loading}
      error={error}
    >
      {/* Translation Output Alert */}
      {showTranslationOutput && (
        <div className="mb-6">
          <Alert
            type={translationSuccess ? "success" : "error"}
            message={
              <div className="space-y-2">
                <p className="font-semibold">
                  {translationSuccess
                    ? t("Translation Update Complete") 
                    : t("Translation Update Failed")}
                </p>
                <pre className="text-xs bg-black/20 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {translationOutput}
                </pre>
              </div>
            }
            onClose={() => setShowTranslationOutput(false)}
          />
        </div>
      )}

      {/* Stats Summary - Clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div onClick={() => handleStatClick("all")} className="cursor-pointer">
          <StatCard
            title={t("Total Countries")}
            value={totalCountries}
            icon={FaGlobe}
            color="blue"
            active={statusFilter === "all"}
          />
        </div>
        <div onClick={() => handleStatClick("enabled")} className="cursor-pointer">
          <StatCard
            title={t("Enabled")}
            value={enabledCount}
            icon={FaCheckCircle}
            color="green"
            active={statusFilter === "enabled"}
          />
        </div>
        <div onClick={() => handleStatClick("disabled")} className="cursor-pointer">
          <StatCard
            title={t("Disabled")}
            value={disabledCount}
            icon={FaTimesCircle}
            color="red"
            active={statusFilter === "disabled"}
          />
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-blue-400/50" />
          </div>
          <input
            type="text"
            placeholder={t("Search countries by name or code...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH width="60px">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    {t("ID")}
                  </div>
                </TH>
                <TH width="250px">{t("Name")}</TH>
                <TH width="120px">{t("Code")}</TH>
                <TH width="120px">{t("Status")}</TH>
                <TH width="160px">{t("Created At")}</TH>
                <TH width="120px">{t("Created By")}</TH>
                <TH width="100px" align="right">{t("Actions")}</TH>
              </tr>
            </THead>
            <tbody>
              {paginatedCountries.length > 0 ? (
                paginatedCountries.map((c) => (
                  <TRow key={c.id}>
                    {/* ID */}
                    <TD>
                      <Badge variant="tag_blue">{c.id}</Badge>
                    </TD>

                    {/* Name */}
                    <TD className="font-semibold text-white">
                      {c.name}
                    </TD>

                    {/* Code */}
                    <TD>
                      <span className="inline-flex items-center px-3 py-1.5 bg-white/5 text-blue-200 rounded-lg text-sm font-mono font-semibold border border-white/10">
                        {c.code}
                      </span>
                    </TD>

                    {/* Status */}
                    <TD>
                      {c.enabled ? (
                        <Badge variant="success">
                          <FaCheckCircle className="mr-1" />
                          {t("Enabled")}
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <FaTimesCircle className="mr-1" />
                          {t("Disabled")}
                        </Badge>
                      )}
                    </TD>

                    {/* Created At */}
                    <TD className="text-blue-200/60 text-sm">
                      {formatDate(c.created_at)}
                    </TD>

                    {/* Created By */}
                    <TD className="text-blue-200/60 text-sm">
                      {c.created_by || <span className="text-blue-400/30">-</span>}
                    </TD>

                    {/* Actions */}
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Protected role="route:countries#edit">
                          <button
                            onClick={() => navigate(`/admin/countries/${c.id}/edit`)}
                            className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-all duration-200 border border-amber-500/30"
                            title={t("Edit")}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </Protected>
                        <Protected role="route:countries#delete">
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-200 border border-red-500/30"
                            title={t("Delete")}
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </Protected>
                      </div>
                    </TD>
                  </TRow>
                ))
              ) : (
                <TRow>
                  <TD colSpan="7" className="text-center py-12">
                    <div className="text-blue-400/50">
                      <FaGlobe className="text-4xl mx-auto mb-3" />
                      <p className="text-lg font-semibold">{t("No countries found")}</p>
                      <p className="text-sm text-blue-200/40 mt-1">
                        {searchTerm || statusFilter !== "all"
                          ? t("Try adjusting your search or filter criteria.")
                          : t("Create your first country to get started.")}
                      </p>
                    </div>
                  </TD>
                </TRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Results count and Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-200/60">
          {t("Showing")} <span className="font-semibold text-blue-100">{startIndex + 1}</span> {t("to")}{" "}
          <span className="font-semibold text-blue-100">{Math.min(endIndex, filteredCountries.length)}</span> {t("of")}{" "}
          <span className="font-semibold text-blue-100">{filteredCountries.length}</span> {t("countries")}
        </p>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={t("Delete Country")}
          variant="danger"
          footer={
            <>
              <SecondaryButton onClick={() => setDeleteTarget(null)}>
                {t("Cancel")}
              </SecondaryButton>
              <DangerButton onClick={() => handleDelete(deleteTarget.id)}>
                {t("Delete")}
              </DangerButton>
            </>
          }
        >
          <div className="space-y-4">
            <Alert
              type="warning"
              message={
                <>
                  {t("Are you sure you want to delete")}{" "}
                  <span className="font-bold">{deleteTarget.name}</span>?
                </>
              }
            />
            <p className="text-sm text-blue-200/70">
              {t("This action cannot be undone.")}
            </p>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Countries;