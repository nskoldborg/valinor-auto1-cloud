import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPlus,
  FaStar,
  FaRegStar,
  FaDatabase,
  FaUser,
  FaCalendar,
  FaClock,
  FaSearch,
  FaFile,
  FaHeart,
  FaArchive,
  FaTag,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";

// Mock logged-in user
const currentUser = "jonatan.brattstrom";

// Mock data sources
const mockDatasources = [
  { value: "Retail Production", label: "Retail Production" },
  { value: "Finance DW", label: "Finance DW" },
  { value: "Nordic Operations", label: "Nordic Operations" },
];

// Mock published queries only
const mockQueries = [
  {
    id: 1,
    name: "SE_WMS_Time",
    datasource: "Retail Production",
    tag: "SE - Retail Production",
    createdBy: "jonatan.brattstrom",
    createdAt: "2025-10-10 10:51:11",
    lastExecutedAt: "2025-10-10 11:18:58",
    refresh: "Never",
    isFavorite: false,
    archived: false,
  },
  {
    id: 2,
    name: "COGS Report SE / Monthly",
    datasource: "Finance DW",
    tag: "SE - Management",
    createdBy: "jonatan.brattstrom",
    createdAt: "2025-10-02 14:18:38",
    lastExecutedAt: "2025-10-02 14:16:35",
    refresh: "Never",
    isFavorite: true,
    archived: false,
  },
  {
    id: 3,
    name: "Sweden Sales Report",
    datasource: "Nordic Operations",
    tag: "SE - Sales",
    createdBy: "felix.fredricsson",
    createdAt: "2025-09-26 14:26:19",
    lastExecutedAt: "2025-10-08 08:50:01",
    refresh: "Never",
    isFavorite: false,
    archived: true,
  },
];

const mockTags = [
  { name: "RS_BI_PROD_NORDICS", count: 97 },
  { name: "RS_RETAIL_SE_2", count: 87 },
  { name: "SCHEDULED", count: 51 },
  { name: "SE - Management", count: 42 },
  { name: "SE - Retail", count: 38 },
  { name: "SE - Sales", count: 24 },
  { name: "SE - Controlling", count: 23 },
];

const ITEMS_PER_PAGE = 25;

export default function QueriesPublished() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedDatasource, setSelectedDatasource] = useState(null);
  const [filter, setFilter] = useState("all"); // all | mine | favorites | archived
  const [queries, setQueries] = useState(mockQueries);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Favorite toggle handler
  const toggleFavorite = (id) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isFavorite: !q.isFavorite } : q))
    );
  };

  // --- Filter logic
  const filteredQueries = useMemo(() => {
    let result = queries.filter((q) => !q.unpublished);

    // Search filter
    if (searchTerm) {
      result = result.filter((q) =>
        q.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTag) result = result.filter((q) => q.tag === selectedTag);
    if (selectedDatasource)
      result = result.filter((q) => q.datasource === selectedDatasource.value);

    if (filter === "mine")
      result = result.filter((q) => q.createdBy === currentUser);
    if (filter === "favorites") result = result.filter((q) => q.isFavorite);
    if (filter === "archived") result = result.filter((q) => q.archived);
    if (filter === "all") result = result.filter((q) => !q.archived);

    return result;
  }, [queries, selectedTag, selectedDatasource, filter, searchTerm]);

  // --- Pagination logic
  const totalPages = Math.ceil(filteredQueries.length / ITEMS_PER_PAGE);
  const paginatedQueries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQueries, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTag, selectedDatasource, filter, searchTerm]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <PageLayout
      title={t("Published Queries")}
      description={t("Browse and manage published analytics queries.")}
      actions={
        <PrimaryButton
          onClick={() => navigate("/analytics/queries/new")}
          icon={FaPlus}
        >
          {t("New Query")}
        </PrimaryButton>
      }
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0">
          <Card className="sticky top-8">
            {/* Search */}
            <div className="mb-6">
              <FormInput
                placeholder={t("Search queries...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={FaSearch}
              />
            </div>

            {/* Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <FaFile className="text-blue-400" />
                {t("Filters")}
              </h3>
              <div className="space-y-1">
                {[
                  { key: "all", label: t("All Queries"), icon: FaFile },
                  { key: "mine", label: t("My Queries"), icon: FaUser },
                  {
                    key: "favorites",
                    label: t("Favorites"),
                    icon: FaHeart,
                  },
                  {
                    key: "archived",
                    label: t("Archived"),
                    icon: FaArchive,
                  },
                ].map((f) => {
                  const IconComponent = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                        filter === f.key
                          ? "bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30"
                          : "text-blue-200/70 hover:bg-white/5 hover:text-blue-200"
                      }`}
                    >
                      <IconComponent />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datasource Selector */}
            <div className="mb-6">
              <FormSelect
                label={t("Datasource")}
                options={mockDatasources}
                value={selectedDatasource}
                onChange={setSelectedDatasource}
                placeholder={t("All Datasources")}
                icon={FaDatabase}
                isClearable
              />
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <FaTag className="text-blue-400" />
                {t("Tags")}
              </h3>
              <div className="space-y-1">
                {mockTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() =>
                      setSelectedTag(selectedTag === tag.name ? null : tag.name)
                    }
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      selectedTag === tag.name
                        ? "bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30"
                        : "text-blue-200/70 hover:bg-white/5 hover:text-blue-200"
                    }`}
                  >
                    <span className="truncate">{tag.name}</span>
                    <span className="text-xs text-blue-400/60 ml-2">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FaDatabase className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t("Queries")}
                </h3>
                <p className="text-blue-200/60 text-sm">
                  {filteredQueries.length} {t("queries found")}
                  {totalPages > 1 && (
                    <span className="ml-2">
                      • {t("Page")} {currentPage} {t("of")} {totalPages}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {filteredQueries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationCircle className="text-blue-400 text-3xl" />
                </div>
                <p className="text-blue-200/60 font-medium">
                  {t("No queries found.")}
                </p>
                <p className="text-blue-200/40 text-sm mt-2">
                  {t("Try adjusting your filters or create a new query.")}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold w-12"></th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Name")}
                        </th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Datasource")}
                        </th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Created By")}
                        </th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Created At")}
                        </th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Last Executed")}
                        </th>
                        <th className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap">
                          {t("Refresh")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQueries.map((q, index) => (
                        <tr
                          key={q.id}
                          className={`border-b border-white/5 transition-all duration-200 hover:bg-white/5 cursor-pointer ${
                            index % 2 === 0 ? "bg-white/[0.02]" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(q.id);
                              }}
                              className="text-xl focus:outline-none transition-all duration-200 hover:scale-110"
                              title={
                                q.isFavorite
                                  ? t("Remove from favorites")
                                  : t("Add to favorites")
                              }
                            >
                              {q.isFavorite ? (
                                <FaStar className="text-yellow-400" />
                              ) : (
                                <FaRegStar className="text-blue-400/40 hover:text-blue-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                                {q.name}
                              </span>
                              {q.tag && (
                                <Badge variant="default" icon={FaTag}>
                                  {q.tag}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-blue-200/90">
                              <FaDatabase className="text-blue-400/60" />
                              <span className="text-sm">{q.datasource}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-blue-200/90">
                              <FaUser className="text-blue-400/60" />
                              <span className="text-sm">{q.createdBy}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-blue-200/90 text-xs">
                              <FaCalendar className="text-blue-400/60" />
                              {formatDate(q.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-blue-200/90 text-xs">
                              <FaClock className="text-blue-400/60" />
                              {formatDate(q.lastExecutedAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-blue-200/60 text-sm">
                              {q.refresh}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                    <div className="text-sm text-blue-200/60">
                      {t("Showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("to")}{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredQueries.length)}{" "}
                      {t("of")} {filteredQueries.length} {t("queries")}
                    </div>
                    <div className="flex items-center gap-2">
                      <SecondaryButton
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        icon={FaChevronLeft}
                        size="sm"
                      >
                        {t("Previous")}
                      </SecondaryButton>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first page, last page, current page, and pages around current
                            return (
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                            );
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;

                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <span className="px-2 text-blue-200/40">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`min-w-[2rem] h-8 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    currentPage === page
                                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                      : "bg-white/5 text-blue-200/70 hover:bg-white/10 hover:text-blue-200"
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <SecondaryButton
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        icon={FaChevronRight}
                        size="sm"
                      >
                        {t("Next")}
                      </SecondaryButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </main>
      </div>
    </PageLayout>
  );
}