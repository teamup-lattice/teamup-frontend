import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import {
  getAllProjectTasks,
  taskStatusOptions,
} from "../../../../services/tasksService";
import { formatDate } from "../../../CreateProject/formatDate";
import { useWorkspace } from "../../useWorkspace";
import StatusTag from "../../shared/StatusTag";
import styles from "./Tasks.module.css";

function Tasks() {
  const { projectId } = useParams();
  const {
    currentUser,
    canManageMembers,
    project,
    milestones,
    tasks: allProjectTasks,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const asParam = searchParams.get("as");
  const statusFilter = searchParams.get("status") || "all";
  const milestoneFilter = searchParams.get("milestoneId") || "all";
  const assigneeFilter = searchParams.get("assigneeMemberId") || "all";
  const selectedView = searchParams.get("my") === "true" ? "my" : "all";
  const [retryCount, setRetryCount] = useState(0);
  const [taskResult, setTaskResult] = useState({
    projectId: null,
    search: "",
    retryCount: 0,
    loading: true,
    error: "",
    data: null,
  });
  const isCurrentResult =
    taskResult.projectId === projectId &&
    taskResult.search === location.search &&
    taskResult.retryCount === retryCount;
  const isLoading = workspaceLoading || !isCurrentResult || taskResult.loading;
  const loadError = isCurrentResult ? taskResult.error : "";
  const result = isCurrentResult ? taskResult.data : null;
  const taskList = result?.tasks ?? [];
  const summary = result?.summary;
  const doneCount = summary?.done ?? 0;
  const totalCount = summary?.total ?? 0;
  const overdueCount = summary?.overdue ?? 0;
  const mineCount = allProjectTasks.filter(
    (task) =>
      String(task.assigneeMemberId) === String(currentUser.projectMemberId),
  ).length;

  const workspacePath = `/projects/${projectId}/workspace`;
  const taskPath = `${workspacePath}/tasks`;
  const createTaskRoute = `${taskPath}/new${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const buildTaskLink = (taskId) => `${taskPath}/${taskId}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;

  useEffect(() => {
    if (workspaceLoading || workspaceError) return undefined;
    let isCurrent = true;
    const filters = {
      status: statusFilter !== "all" ? statusFilter : undefined,
      milestoneId: milestoneFilter !== "all" ? milestoneFilter : undefined,
      assigneeMemberId:
        assigneeFilter !== "all" ? assigneeFilter : undefined,
      mine: selectedView === "my",
    };

    getAllProjectTasks(
      projectId,
      filters,
      {
        memberships: project.memberships ?? [],
        milestones,
      },
    )
      .then((data) => {
        if (isCurrent) {
          setTaskResult({
            projectId,
            search: location.search,
            retryCount,
            loading: false,
            error: "",
            data,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load project tasks:", error);
        if (!isCurrent) return;
        const errorMessage =
          error.status === 404 && /^Cannot GET\s+/i.test(error.message)
            ? `The task endpoint is not deployed: ${error.message}`
            : error.message || "Something went wrong. Try again.";
        setTaskResult({
          projectId,
          search: location.search,
          retryCount,
          loading: false,
          error: errorMessage,
          data: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    projectId,
    location.search,
    retryCount,
    workspaceLoading,
    workspaceError,
    project.memberships,
    milestones,
    statusFilter,
    milestoneFilter,
    assigneeFilter,
    selectedView,
  ]);

  const setFilter = (name, value) => {
    const params = new URLSearchParams(location.search);
    if (value === "all" || !value) params.delete(name);
    else params.set(name, value);
    params.delete("state");
    navigate(`${location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(location.search);
    params.delete("status");
    params.delete("assigneeMemberId");
    params.delete("milestoneId");
    params.delete("my");
    params.delete("state");
    navigate(`${location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  if (workspaceError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <Alert variant="error" title="Couldn't load project details">
          {workspaceError}
        </Alert>
        <Button
          variant="secondary"
          fullWidth
          onClick={retryWorkspace}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className={styles.page} aria-live="polite">
        <h2 className={styles.pageTitle}>Tasks</h2>
        <p role="status">Loading tasks…</p>
        <div className={styles.loadingList}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <Alert variant="error" title="Couldn't load tasks">
          {loadError}
        </Alert>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setRetryCount((count) => count + 1)}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (
    taskList.length === 0 &&
    statusFilter === "all" &&
    assigneeFilter === "all" &&
    milestoneFilter === "all" &&
    selectedView === "all"
  ) {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <EmptyState
          title="No tasks yet."
          text="No tasks yet. Owners and managers can create one; members can post an update."
        >
          {canManageMembers && <Button onClick={() => navigate(createTaskRoute)}>Create task</Button>}
        </EmptyState>
      </section>
    );
  }

  if (taskList.length === 0) {
    const statusLabel =
      taskStatusOptions.find((option) => option.value === statusFilter)?.label;
    const emptyTitle = statusLabel
      ? `No tasks in ${statusLabel.toLowerCase()} yet`
      : "No matching tasks";
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <EmptyState
          title={emptyTitle}
          text="No matching tasks. Reset filters to see all."
        >
          <Button onClick={resetFilters}>Clear filter</Button>
        </EmptyState>
      </section>
    );
  }

  const toggleButton = (selected, label, onClick) => (
    <button
      type="button"
      key={label}
      className={`${styles.toggleButton} ${selected ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
  const taskOverdue = taskList.filter((task) => task.overdueDays > 0);
  const displayDate = (date) => (date ? formatDate(date) : "Not set");

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Tasks</h2>

      <div className={styles.summaryRow}>
        <span>Overall tasks</span>
        <span>{doneCount} of {totalCount} Done</span>
      </div>
      <div className={styles.progressTrack} aria-label="Completion progress">
        <span style={{ width: `${(doneCount / (totalCount || 1)) * 100}%` }} />
      </div>
      <p className={styles.summaryText}>
        {totalCount} tasks · {doneCount} Done · {summary.notDone} not Done · {overdueCount} overdue
      </p>

      <div className={styles.toggleRow}>
        {toggleButton(
          selectedView === "all",
          `All tasks · ${totalCount}`,
          () => setFilter("my", ""),
        )}
        {toggleButton(
          selectedView === "my",
          `My tasks · ${selectedView === "my" ? totalCount : mineCount}`,
          () => setFilter("my", "true"),
        )}
      </div>

      <div className={styles.filterRow}>
        <Select
          label="Assignee"
          options={[
            { value: "all", label: "All members" },
            ...(project.memberships ?? []).map((member) => ({
              value: String(member.id),
              label: member.name || member.role || "Project member",
            })),
          ]}
          value={assigneeFilter}
          onChange={(event) =>
            setFilter("assigneeMemberId", event.target.value)
          }
        />
        <Select
          label="Status"
          options={[
            { value: "all", label: "All statuses" },
            ...taskStatusOptions,
          ]}
          value={statusFilter}
          onChange={(event) => setFilter("status", event.target.value)}
        />
        <Select
          label="Milestone"
          options={[
            { value: "all", label: "All milestones" },
            ...milestones.map((milestone) => ({
              value: String(milestone.id),
              label: milestone.name,
            })),
          ]}
          value={milestoneFilter}
          onChange={(event) => setFilter("milestoneId", event.target.value)}
        />
      </div>

      {canManageMembers && (
        <div className={styles.primaryAction}>
          <Button variant="secondary" fullWidth onClick={() => navigate(createTaskRoute)}>
            Create task
          </Button>
        </div>
      )}

      <div className={styles.desktopTableWrap}>
        <table className={styles.taskTable}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Milestone</th>
              <th>Status</th>
              <th>Update / blocker note</th>
            </tr>
          </thead>
          <tbody>
            {taskList.map((task) => {
              const milestone = milestones.find(
                (item) => String(item.id) === String(task.milestoneId),
              );

              return (
                <tr key={task.id}>
                  <td>
                    <Link className={styles.taskLink} to={buildTaskLink(task.id)}>
                      {task.title}
                    </Link>
                  </td>
                  <td>{task.assignee}</td>
                  <td>
                    <div className={styles.dueCell}>
                      <span>{displayDate(task.dueDate)}</span>
                      {task.overdueDays > 0 && (
                      <span className={styles.overdueText}>
                        Overdue {task.overdueDays} {task.overdueDays === 1 ? "day" : "days"}
                      </span>
                      )}
                    </div>
                  </td>
                  <td>{milestone?.name || task.milestoneName || "—"}</td>
                  <td>
                    <StatusTag status={task.status} />
                  </td>
                  <td>{task.blockerNote || task.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileGrid}>
        {taskList.map((task) => {
          const milestone = milestones.find(
            (item) => String(item.id) === String(task.milestoneId),
          );

          return (
            <div className={styles.mobileCard} key={task.id}>
              <div className={styles.mobileTags}>
                <StatusTag status={task.status} />
                {task.overdueDays > 0 && <StatusTag status="Overdue" overdueDays={task.overdueDays} />}
              </div>
              <Link className={styles.mobileTitle} to={buildTaskLink(task.id)}>
                {task.title}
              </Link>
              <p className={styles.mobileMeta}>Owner: {task.assignee}</p>
              <p className={styles.mobileMeta}>
                Due: {displayDate(task.dueDate)} · Milestone: {milestone?.name || task.milestoneName || "—"}
              </p>
              <p className={styles.mobileNote}>{task.blockerNote || task.note}</p>
              <Link className={styles.openLink} to={buildTaskLink(task.id)}>
                Open task details
              </Link>
            </div>
          );
        })}
      </div>

      <p className={styles.footerNote}>
        Overdue: {taskOverdue.length > 0 ? `${taskOverdue[0].title} only.` : "None."}
      </p>
    </section>
  );
}

export default Tasks;
