import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCheck, FaTimes, FaExclamationTriangle, FaClock, FaCalendarAlt, FaTag } from "react-icons/fa";

const GetNextTask = () => {
  const { t } = useTranslation();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 🔹 Fetch next task automatically on load
  const fetchNextTask = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://10.46.0.140:8650/tasks/next", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "No tasks available");
      }

      const data = await res.json();
      setTask(data);
    } catch (err) {
      setError(err.message);
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextTask();
  }, [token]);

  // 🔹 Accept and keep assigned task
  const handleAcceptTask = async () => {
    if (!task) return;
    try {
      const res = await fetch(`http://10.46.0.140:8650/tasks/${task.id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to accept task");
      }

      const updated = await res.json();
      setTask(updated);
      navigate(`/tasks/${task.id}/view`);
    } catch (err) {
      setError(err.message);
    }
  };

  // 🔹 Skip and unassign task, fetch next
  const handleSkipTask = async () => {
    if (!task) return;

    try {
      const res = await fetch(`http://10.46.0.140:8650/tasks/${task.id}/skip`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to skip task");
      }

      // Fetch another task after skipping
      fetchNextTask();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-auto"
      style={{
        background: "linear-gradient(135deg, #0a1929 0%, #0d2847 50%, #0f3460 100%)",
        paddingTop: "80px",
      }}
    >
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
      <div className="relative z-10 max-w-[1600px] mx-auto px-8 py-8">
        {/* Page Header Card */}
        <div className="bg-[#0a1520]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">{t("Get Next Task")}</h1>
              <p className="text-blue-200/70 text-lg">
                {t("Automatically assigns and loads the next prioritized task.")}
              </p>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all flex items-center gap-2 font-medium"
            >
              <FaArrowLeft /> {t("Back to Home")}
            </button>
          </div>
        </div>

        {/* Task Content */}
        {loading ? (
          <div className="bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-xl text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 mb-4"></div>
            <p className="text-blue-200/70 text-lg">{t("Loading your next task...")}</p>
          </div>
        ) : error ? (
          <div className="bg-[#0d1f33]/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-red-400 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{t("Error")}</h3>
                <p className="text-red-400">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchNextTask}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {t("Try Again")}
            </button>
          </div>
        ) : task ? (
          <div className="bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            {/* Task Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-white/10 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{task.title}</h3>
              {task.description && (
                <p className="text-blue-200/70 text-base">{task.description}</p>
              )}
            </div>

            {/* Task Details Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Priority */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaExclamationTriangle className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
                      {t("Priority")}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      task.priority === "high"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : task.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {t(task.priority?.toUpperCase() || "MEDIUM")}
                  </span>
                </div>

                {/* Task Type */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTag className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
                      {t("Task Type")}
                    </span>
                  </div>
                  <p className="text-white font-medium">{task.source || t("Manual")}</p>
                </div>

                {/* Reference ID */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTag className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
                      {t("Reference ID")}
                    </span>
                  </div>
                  <p className="text-white font-medium">{task.reference_id || "-"}</p>
                </div>

                {/* Start Date */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaCalendarAlt className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
                      {t("Start At")}
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {task.start_at ? new Date(task.start_at).toLocaleString() : "-"}
                  </p>
                </div>

                {/* End Date */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaClock className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
                      {t("End At")}
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {task.end_at ? new Date(task.end_at).toLocaleString() : "-"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                <button
                  onClick={handleSkipTask}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all flex items-center gap-2 font-medium"
                >
                  <FaTimes /> {t("Skip Task")}
                </button>
                <button
                  onClick={handleAcceptTask}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-green-500/30"
                >
                  <FaCheck /> {t("Accept Task")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-xl text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t("All Caught Up!")}</h3>
            <p className="text-blue-200/70 text-lg mb-6">{t("No open tasks available.")}</p>
            <button
              onClick={() => navigate("/home")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] inline-flex items-center gap-2"
            >
              <FaArrowLeft /> {t("Back to Home")}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 mt-8">
          <p className="text-blue-200/50 text-sm">
            © {new Date().getFullYear()} {t("Valinor Application")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetNextTask;