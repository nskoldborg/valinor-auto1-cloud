import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaEdit,
  FaCode,
  FaArchive,
  FaShare,
  FaClock,
  FaDatabase,
  FaUser,
  FaCalendar,
  FaTag,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaChartBar,
  FaStar,
  FaRegStar,
  FaEllipsisV,
} from "react-icons/fa";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, SecondaryButton, DangerButton } from "@/components/ui/Button";

// Mock query data
const mockQuery = {
  id: 115553,
  name: "New Query",
  status: "Unpublished",
  datasource: "RS_NORDICS_MANAGEMENT",
  createdBy: "Niklas Skoldborg",
  updatedBy: "Niklas Skoldborg",
  createdAt: "3 days ago",
  updatedAt: "3 days ago",
  runtime: "4 minutes",
  rowCount: 119,
  refreshSchedule: "Never",
  isFavorite: false,
  tags: [],
};

// Mock query results
const mockResults = {
  columns: [
    "time_reporting",
    "week",
    "leads_created",
    "leads_created_a",
    "leads_created_b",
    "leads_created_c",
    "leads_created_d",
    "leads_created_e",
    "leads_created_nop",
    "leads_created_and_evaluated",
  ],
  rows: [
    ["2025-11-04 12:52:59", "372023", "12,003", "600", "2,061", "2,879", "2,056", "4,388", "19", "5,7"],
    ["2025-11-04 12:52:59", "142024", "13,265", "537", "2,141", "3,335", "2,399", "4,793", "60", "6,132"],
    ["2025-11-04 12:52:59", "472023", "8,055", "443", "1,384", "1,925", "1,340", "2,937", "26", "3,991"],
    ["2025-11-04 12:52:59", "252024", "8,795", "415", "1,548", "2,330", "1,438", "3,058", "6", "4,318"],
    ["2025-11-04 12:52:59", "432024", "13,433", "1,924", "2,502", "3,332", "2,150", "3,519", "6", "5,947"],
    ["2025-11-04 12:52:59", "072024", "12,795", "512", "2,052", "3,154", "2,276", "4,745", "56", "6,054"],
    ["2025-11-04 12:52:59", "422024", "12,416", "1,857", "2,444", "3,098", "1,939", "3,068", "10", "5,736"],
    ["2025-11-04 12:52:59", "342025", "13,925", "1,821", "2,494", "3,625", "2,179", "3,796", "10", "7,197"],
    ["2025-11-04 12:52:59", "112025", "13,760", "1,896", "2,437", "3,481", "2,237", "3,658", "51", "6,414"],
  ],
};

const ITEMS_PER_PAGE = 25;

export default function QueryView() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFavorite, setIsFavorite] = useState(mockQuery.isFavorite);
  const [showMenu, setShowMenu] = useState(false);

  const totalPages = Math.ceil(mockResults.rows.length / ITEMS_PER_PAGE);
  const paginatedRows = mockResults.rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-3">
          <span>{mockQuery.name}</span>
          <Badge variant={mockQuery.status === "Unpublished" ? "warning" : "success"}>
            {mockQuery.status}
          </Badge>
        </div>
      }
      description={
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FaDatabase className="text-blue-400/60" />
            <span>{mockQuery.datasource}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-blue-400/60" />
            <span>{mockQuery.runtime} runtime</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendar className="text-blue-400/60" />
            <span>Refreshed {mockQuery.updatedAt}</span>
          </div>
        </div>
      }
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="text-2xl focus:outline-none transition-all duration-200 hover:scale-110"
            title={isFavorite ? t("Remove from favorites") : t("Add to favorites")}
          >
            {isFavorite ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-blue-400/60 hover:text-blue-400" />
            )}
          </button>
          <PrimaryButton icon={FaPlay}>
            {t("Refresh")}
          </PrimaryButton>
          <SecondaryButton icon={FaEdit}>
            {t("Edit")}
          </SecondaryButton>
          <SecondaryButton icon={FaCode}>
            {t("Edit Source")}
          </SecondaryButton>
          <div className="relative">
            <SecondaryButton
              icon={FaEllipsisV}
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0d2847] border border-white/10 rounded-lg shadow-xl z-10">
                <button className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-white/5 flex items-center gap-2 rounded-t-lg">
                  <FaShare />
                  {t("Manage Permissions")}
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-white/5 flex items-center gap-2">
                  <FaCode />
                  {t("Show API Key")}
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-white/5 flex items-center gap-2">
                  <FaArchive />
                  {t("Archive")}
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 rounded-b-lg border-t border-white/10">
                  <FaArchive />
                  {t("Fork")}
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10">
          <button className="px-4 py-2 text-sm font-medium text-blue-300 border-b-2 border-blue-500 -mb-px">
            {t("Table")}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-200/60 hover:text-blue-200 transition-colors">
            <FaChartBar className="inline mr-2" />
            {t("Add Visualization")}
          </button>
        </div>

        {/* Query Results Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {mockResults.columns.map((column, index) => (
                    <th
                      key={index}
                      className="text-left py-3 px-4 text-blue-200 font-semibold whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`border-b border-white/5 transition-all duration-200 hover:bg-white/5 ${
                      rowIndex % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="py-3 px-4 text-blue-200/90 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <div className="text-sm text-blue-200/60">
                {mockResults.rowCount} {t("rows")} • {mockQuery.runtime} {t("runtime")}
              </div>
              <div className="flex items-center gap-2">
                <SecondaryButton
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  icon={FaChevronLeft}
                  size="sm"
                />

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
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
                />
              </div>
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <Card>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                {t("Created By")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {mockQuery.createdBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-blue-200 font-medium">{mockQuery.createdBy}</p>
                  <p className="text-blue-200/60 text-sm">{mockQuery.createdAt}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                {t("Updated By")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {mockQuery.updatedBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-blue-200 font-medium">{mockQuery.updatedBy}</p>
                  <p className="text-blue-200/60 text-sm">{mockQuery.updatedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}