import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  FaPlus, 
  FaTasks, 
  FaUsers, 
  FaChartLine, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaClock, 
  FaCheckCircle, 
  FaTimes,
  FaInbox
} from "react-icons/fa";

// Import new reusable components
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { 
  TableCard, 
  Table, 
  THead, 
  TH, 
  TRow, 
  TD, 
  TableEmptyState, 
  TableLoadingState 
} from "@/components/ui/Table";
import { ChartCard, ChartPlaceholder } from "@/components/ui/ChartCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { FormInput, FormTextarea, FormSelect } from "@/components/ui/FormInput";
import { Alert } from "@/components/ui/Alert";

const Home = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [taskView, setTaskView] = useState("my");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem("token");
  const currentUserId = parseInt(localStorage.getItem("user_id"));

  // ===================== CREATE TASK MODAL STATE =====================
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    start_at: "",
    end_at: "",
    assigned_to: currentUserId,
  });
  const [taskMessage, setTaskMessage] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // ===================== FETCH TASKS =====================
  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://10.46.0.140:8650/tasks/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("Failed to load tasks"));
      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  // ===================== TASK FILTERS =====================
  const today = new Date().toISOString().split("T")[0];
  const filteredTasks = tasks.filter((t) =>
    taskView === "my" ? t.assigned_to === currentUserId : true
  );

  const overdueTasks = filteredTasks.filter(
    (t) => t.end_at && t.end_at.split("T")[0] < today && !t.completed
  );
  const todayTasks = filteredTasks.filter(
    (t) => t.end_at && t.end_at.split("T")[0] === today && !t.completed
  );
  const upcomingTasks = filteredTasks.filter(
    (t) => t.end_at && t.end_at.split("T")[0] > today && !t.completed
  );

  // ===================== CREATE TASK HANDLERS =====================
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async () => {
    setTaskMessage(null);

    if (!taskForm.title || !taskForm.end_at) {
      setTaskMessage({
        type: "error",
        message: t("Please fill in title and end date."),
      });
      return;
    }

    setTaskLoading(true);

    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        start_at: taskForm.start_at || new Date().toISOString(),
        end_at: new Date(taskForm.end_at).toISOString(),
        assigned_to: taskForm.assigned_to,
        source: "manual",
      };

      const res = await fetch("http://10.46.0.140:8650/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || t("Failed to create task"));
      }

      setTaskMessage({
        type: "success",
        message: t("Task created successfully!"),
      });

      setTimeout(() => {
        setShowCreateModal(false);
        setTaskForm({
          title: "",
          description: "",
          priority: "medium",
          start_at: "",
          end_at: "",
          assigned_to: currentUserId,
        });
        setTaskMessage(null);
        fetchTasks();
      }, 1500);
    } catch (err) {
      setTaskMessage({
        type: "error",
        message: err.message,
      });
    } finally {
      setTaskLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      start_at: "",
      end_at: "",
      assigned_to: currentUserId,
    });
    setTaskMessage(null);
  };

  // ===================== RENDER HELPERS =====================
  const renderTaskRows = (data, emptyMsg) => {
    if (loading) {
      return <TableLoadingState colSpan={8} message={t("Loading tasks...")} />;
    }

    if (!data.length) {
      return <TableEmptyState message={emptyMsg} icon={FaInbox} />;
    }

    return data.map((task) => (
      <TRow key={task.id}>
        <TD>{task.start_at ? task.start_at.split("T")[0] : "-"}</TD>
        <TD>{task.end_at ? task.end_at.split("T")[0] : "-"}</TD>
        <TD>
          <PriorityBadge priority={task.priority || "medium"} />
        </TD>
        <TD>{task.source || t("Manual")}</TD>
        <TD className="font-medium text-white">{task.title}</TD>
        <TD>{task.description || "-"}</TD>
        <TD>{task.reference_id || "-"}</TD>
        <TD>
          {task.completed ? (
            <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
              <FaCheckCircle /> {t("Yes")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-400 text-sm font-medium">
              <FaTimes /> {t("No")}
            </span>
          )}
        </TD>
      </TRow>
    ));
  };

  // ===================== RENDER PAGE =====================
  return (
    <>
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
          {/* Page Header */}
          <PageHeader
            title={t("My Activities")}
            description={t("Your current tasks, onboarding, offboarding, and analytics overview.")}
            actions={
              <>
                <SecondaryButton
                  icon={FaTasks}
                  onClick={() => (window.location.href = "/home/get-next-task")}
                >
                  {t("Get Next Task")}
                </SecondaryButton>
                <PrimaryButton
                  icon={FaPlus}
                  onClick={() => setShowCreateModal(true)}
                >
                  {t("New Task")}
                </PrimaryButton>
              </>
            }
          />

          {/* Task View Toggle */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setTaskView("my")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                taskView === "my"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200"
              }`}
            >
              {t("My Tasks")}
            </button>
            <button
              onClick={() => setTaskView("team")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                taskView === "team"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200"
              }`}
            >
              {t("Team Tasks")}
            </button>
          </div>

          {/* Overdue Tasks */}
          <div className="mb-8">
            <SectionHeader
              title={t("Overdue Tasks")}
              icon={FaExclamationTriangle}
              iconColor="text-red-400"
              badge={overdueTasks.length}
              badgeColor="bg-red-500/20 border-red-500/30 text-red-400"
            />
            <TableCard>
              <Table>
                <THead>
                  <tr>
                    <TH>{t("Start At")}</TH>
                    <TH>{t("End At")}</TH>
                    <TH>{t("Priority")}</TH>
                    <TH>{t("Task Type")}</TH>
                    <TH>{t("Task Title")}</TH>
                    <TH>{t("Description")}</TH>
                    <TH>{t("Reference ID")}</TH>
                    <TH>{t("Completed")}</TH>
                  </tr>
                </THead>
                <tbody>
                  {renderTaskRows(
                    overdueTasks,
                    t(`No overdue ${taskView === "my" ? "tasks" : "team tasks"} found.`)
                  )}
                </tbody>
              </Table>
            </TableCard>
          </div>

          {/* Today's Tasks */}
          <div className="mb-8">
            <SectionHeader
              title={t("Today's Tasks")}
              icon={FaCalendarAlt}
              iconColor="text-blue-400"
              badge={todayTasks.length}
              badgeColor="bg-blue-500/20 border-blue-500/30 text-blue-400"
            />
            <TableCard>
              <Table>
                <THead>
                  <tr>
                    <TH>{t("Start At")}</TH>
                    <TH>{t("End At")}</TH>
                    <TH>{t("Priority")}</TH>
                    <TH>{t("Task Type")}</TH>
                    <TH>{t("Task Title")}</TH>
                    <TH>{t("Description")}</TH>
                    <TH>{t("Reference ID")}</TH>
                    <TH>{t("Completed")}</TH>
                  </tr>
                </THead>
                <tbody>
                  {renderTaskRows(
                    todayTasks,
                    t(`No ${taskView === "my" ? "tasks" : "team tasks"} for today.`)
                  )}
                </tbody>
              </Table>
            </TableCard>
          </div>

          {/* Upcoming Tasks */}
          <div className="mb-10">
            <SectionHeader
              title={t("Upcoming Tasks")}
              icon={FaClock}
              iconColor="text-green-400"
              badge={upcomingTasks.length}
              badgeColor="bg-green-500/20 border-green-500/30 text-green-400"
            />
            <TableCard>
              <Table>
                <THead>
                  <tr>
                    <TH>{t("Start At")}</TH>
                    <TH>{t("End At")}</TH>
                    <TH>{t("Priority")}</TH>
                    <TH>{t("Task Type")}</TH>
                    <TH>{t("Task Title")}</TH>
                    <TH>{t("Description")}</TH>
                    <TH>{t("Reference ID")}</TH>
                    <TH>{t("Completed")}</TH>
                  </tr>
                </THead>
                <tbody>
                  {renderTaskRows(
                    upcomingTasks,
                    t(`No upcoming ${taskView === "my" ? "tasks" : "team tasks"} found.`)
                  )}
                </tbody>
              </Table>
            </TableCard>
          </div>

          {/* Onboarding / Offboarding Overview */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            {/* Onboarding */}
            <TableCard
              title={t("Onboarding Overview")}
              icon={FaUsers}
              actions={
                <SecondaryButton className="!px-4 !py-2 !text-sm">
                  {t("View All")}
                </SecondaryButton>
              }
            >
              <Table>
                <THead>
                  <tr>
                    <TH>{t("User")}</TH>
                    <TH>{t("Position")}</TH>
                    <TH>{t("Start Date")}</TH>
                    <TH>{t("Status")}</TH>
                  </tr>
                </THead>
                <tbody>
                  <TableEmptyState message={t("No onboardings found.")} icon={FaInbox} />
                </tbody>
              </Table>
            </TableCard>

            {/* Offboarding */}
            <TableCard
              title={t("Offboarding Overview")}
              icon={FaUsers}
              actions={
                <SecondaryButton className="!px-4 !py-2 !text-sm">
                  {t("View All")}
                </SecondaryButton>
              }
            >
              <Table>
                <THead>
                  <tr>
                    <TH>{t("User")}</TH>
                    <TH>{t("Position")}</TH>
                    <TH>{t("End Date")}</TH>
                    <TH>{t("Status")}</TH>
                  </tr>
                </THead>
                <tbody>
                  <TableEmptyState message={t("No offboardings found.")} icon={FaInbox} />
                </tbody>
              </Table>
            </TableCard>
          </div>

          {/* Analytics Graphs */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            {/* Onboarding Graph */}
            <ChartCard
              title={t("Onboardings Completed")}
              icon={FaChartLine}
              iconColor="text-blue-400"
              actions={
                <SecondaryButton className="!px-4 !py-2 !text-sm">
                  {t("Refresh Data")}
                </SecondaryButton>
              }
            >
              <ChartPlaceholder message={t("Graph Placeholder (Onboardings per agent)")} />
            </ChartCard>

            {/* Offboarding Graph */}
            <ChartCard
              title={t("Offboardings Completed")}
              icon={FaChartLine}
              iconColor="text-red-400"
              actions={
                <SecondaryButton className="!px-4 !py-2 !text-sm">
                  {t("Refresh Data")}
                </SecondaryButton>
              }
            >
              <ChartPlaceholder message={t("Graph Placeholder (Offboardings per agent)")} />
            </ChartCard>
          </div>

          {/* Footer */}
          <div className="text-center py-6 border-t border-white/10">
            <p className="text-blue-200/50 text-sm">
              © {new Date().getFullYear()} {t("Valinor Application")}
            </p>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title={t("Create New Task")}
        footer={
          <>
            <SecondaryButton onClick={closeCreateModal} disabled={taskLoading}>
              {t("Cancel")}
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateTask} loading={taskLoading}>
              {t("Create Task")}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-6">
          {/* Feedback message */}
          {taskMessage && (
            <Alert type={taskMessage.type} message={taskMessage.message} />
          )}

          {/* Title */}
          <FormInput
            label={t("Task Title")}
            name="title"
            placeholder={t("Enter task title")}
            value={taskForm.title}
            onChange={handleTaskFormChange}
            required
            disabled={taskLoading}
          />

          {/* Description */}
          <FormTextarea
            label={t("Description")}
            name="description"
            placeholder={t("Enter task description")}
            value={taskForm.description}
            onChange={handleTaskFormChange}
            rows={4}
            disabled={taskLoading}
          />

          {/* Priority */}
          <FormSelect
            label={t("Priority")}
            name="priority"
            value={taskForm.priority}
            onChange={handleTaskFormChange}
            options={[
              { value: "low", label: t("Low") },
              { value: "medium", label: t("Medium") },
              { value: "high", label: t("High") },
            ]}
            disabled={taskLoading}
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label={t("Start Date")}
              name="start_at"
              type="date"
              value={taskForm.start_at}
              onChange={handleTaskFormChange}
              disabled={taskLoading}
            />
            <FormInput
              label={t("End Date")}
              name="end_at"
              type="date"
              value={taskForm.end_at}
              onChange={handleTaskFormChange}
              required
              disabled={taskLoading}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Home;