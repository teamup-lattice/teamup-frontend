import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Select from "../../../../components/Select";
import Skeleton from "../../../../components/Skeleton";
import { statuses, tasks as projectTasks } from "../../../../data/workspaceData";
import { formatDate } from "../../../CreateProject/formatDate";
import { useWorkspace } from "../../useWorkspace";
import StatusTag from "../../shared/StatusTag";
import styles from "./Tasks.module.css";

const TODAY = "2026-11-12";

function getDaysOverdue(task) {
  if (!task.dueDate || task.status === "Done") {
    return 0;
  }

  const dueDate = new Date(`${task.dueDate}T00:00:00Z`);
  const today = new Date(`${TODAY}T00:00:00Z`);
  return Math.max(0, Math.floor((today - dueDate) / 86400000));
}

function Tasks() {
  const { projectId } = useParams();
  const {
    currentUser,
    isOwner,
    members,
    membersError,
    retryWorkspace,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");

  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [milestoneFilter, setMilestoneFilter] = useState("all");

  const workspacePath = `/projects/${projectId}/workspace`;
  const taskPath = `${workspacePath}/tasks`;
  const taskList = projectTasks.map((task) => ({ ...task, overdueDays: getDaysOverdue(task) }));
  const doneCount = taskList.filter((task) => task.status === "Done").length;
  const overdueTasks = taskList.filter((task) => task.overdueDays > 0);
  const myTaskCount = taskList.filter((task) => task.assignee === currentUser.name).length;

  const filteredTasks = taskList.filter((task) => {
    const assigneeMatch = assigneeFilter === "all" || task.assignee === assigneeFilter;
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    const milestoneMatch = milestoneFilter === "all" || task.milestoneId === milestoneFilter;
    return assigneeMatch && statusMatch && milestoneMatch;
  });

  const resetFilters = () => {
    setAssigneeFilter("all");
    setStatusFilter("all");
    setMilestoneFilter("all");
    if (previewState === "filtered") {
      searchParams.delete("state");
      navigate(
        `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
        { replace: true },
      );
    }
  };

  const createTaskRoute = `${taskPath}/new${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const buildTaskLink = (taskId) => `${taskPath}/${taskId}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const selectedView = searchParams.get("my") === "true" ? "my" : "all";
  const viewTasks = selectedView === "my"
    ? filteredTasks.filter((task) => task.assignee === currentUser.name)
    : filteredTasks;

  if (previewState === "loading") {
    return (
      <section className={styles.page} aria-live="polite">
        <h2 className={styles.pageTitle}>Tasks</h2>
        <div className={styles.loadingList}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <Alert variant="error" title="Tasks could not refresh">
          Refresh failed. Showing last saved list: 6 tasks, 2 Done. Filters retained.
        </Alert>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(`${taskPath}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`)}
        >
          Retry refresh
        </Button>
      </section>
    );
  }

  if (previewState === "empty") {
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <EmptyState
          title="No tasks yet."
          text="No tasks yet. Owner can create one; members can post an update."
        >
          {isOwner && <Button onClick={() => navigate(createTaskRoute)}>Create task</Button>}
        </EmptyState>
      </section>
    );
  }

  if ((viewTasks.length === 0 && (statusFilter !== "all" || assigneeFilter !== "all" || milestoneFilter !== "all")) || previewState === "filtered") {
    const emptyTitle = statusFilter === "all" ? "No matching tasks" : `No tasks in ${statusFilter.toLowerCase()} yet`;
    return (
      <section className={styles.page}>
        <h2 className={styles.pageTitle}>Tasks</h2>
        <EmptyState
          title={emptyTitle}
          text="No matching tasks. Six saved tasks retained. Reset filters to see all."
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

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Tasks</h2>

      <div className={styles.summaryRow}>
        <span>Overall tasks</span>
        <span>{doneCount} of {taskList.length} Done</span>
      </div>
      <div className={styles.progressTrack} aria-label="Completion progress">
        <span style={{ width: `${(doneCount / taskList.length) * 100}%` }} />
      </div>
      <p className={styles.summaryText}>
        {taskList.length} tasks · {doneCount} Done · {taskList.length - doneCount} not Done · {overdueTasks.length} overdue
      </p>

      <div className={styles.toggleRow}>
        {toggleButton(selectedView === "all", `All tasks · ${taskList.length}`, () => {
          searchParams.delete("my");
          navigate(`${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
        })}
        {toggleButton(selectedView === "my", `My tasks · ${myTaskCount}`, () => {
          searchParams.set("my", "true");
          navigate(`${location.pathname}?${searchParams.toString()}`);
        })}
      </div>

      <div className={styles.filterRow}>
        {membersError && (
          <Alert variant="error" title="Couldn't load project members">
            {membersError}
            <Button variant="secondary" onClick={retryWorkspace}>
              Retry
            </Button>
          </Alert>
        )}
        <Select
          label="Assignee"
          options={[
            { value: "all", label: "All members" },
            ...members.map((member) => ({ value: member.name, label: member.name })),
          ]}
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
        />
        <Select
          label="Status"
          options={[
            { value: "all", label: "All statuses" },
            ...statuses.map((status) => ({ value: status, label: status })),
          ]}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Select
          label="Milestone"
          options={[
            { value: "all", label: "All milestones" },
            { value: "M1", label: "M1 Requirements" },
            { value: "M2", label: "M2 Working prototype" },
            { value: "M3", label: "M3 Final demo" },
          ]}
          value={milestoneFilter}
          onChange={(event) => setMilestoneFilter(event.target.value)}
        />
      </div>

      {isOwner && (
        <div className={styles.primaryAction}>
          <Button variant="secondary" fullWidth onClick={() => navigate(createTaskRoute)}>
            Create task
          </Button>
        </div>
      )}

      {previewState === "refreshed" && (
        <Alert variant="success" title="Tasks refreshed">
          Six saved tasks loaded. Design onboarding is Blocked and overdue 2 days; 2 of 6 are Done.
        </Alert>
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
            {viewTasks.map((task) => {
              const milestone = task.milestoneId
                ? {
                    id: task.milestoneId,
                    name:
                      task.milestoneId === "M2"
                        ? "Working prototype"
                        : task.milestoneId === "M1"
                          ? "Requirements"
                          : "Final demo",
                  }
                : null;

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
                      <span>{formatDate(task.dueDate)}</span>
                      {task.overdueDays > 0 && (
                      <span className={styles.overdueText}>
                        Overdue {task.overdueDays} {task.overdueDays === 1 ? "day" : "days"}
                      </span>
                      )}
                    </div>
                  </td>
                  <td>{milestone ? `${milestone.id} ${milestone.name}` : "—"}</td>
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
        {viewTasks.map((task) => {
          const milestone = task.milestoneId
            ? {
                id: task.milestoneId,
                name:
                  task.milestoneId === "M2"
                    ? "Working prototype"
                    : task.milestoneId === "M1"
                      ? "Requirements"
                      : "Final demo",
              }
            : null;

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
                Due: {formatDate(task.dueDate)} · Milestone: {milestone ? `${milestone.id} ${milestone.name}` : "—"}
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
        Overdue: {overdueTasks.length > 0 ? `${overdueTasks[0].title} only.` : "None."}
      </p>
    </section>
  );
}

export default Tasks;
