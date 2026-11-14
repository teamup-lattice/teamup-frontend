import { useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import EmptyState from "../../../../components/EmptyState";
import Skeleton from "../../../../components/Skeleton";
import overviewImage from "../../../../assets/overview.png";
import { formatDate } from "../../../CreateProject/formatDate";
import { useWorkspace } from "../../useWorkspace";
import StatusTag from "../../shared/StatusTag";
import styles from "./WorkspaceOverview.module.css";

const overviewDate = "2026-11-12";
const overviewDateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${overviewDate}T00:00:00Z`));

function formatShortDate(date) {
  return formatDate(date).replace(/ \d{4}$/, "");
}

function getDaysOverdue(task) {
  if (task.status === "Done" || !task.dueDate) {
    return 0;
  }

  const dueDate = new Date(`${task.dueDate}T00:00:00Z`);
  const currentDate = new Date(`${overviewDate}T00:00:00Z`);
  return Math.max(0, Math.floor((currentDate - dueDate) / 86400000));
}

function WorkspaceOverview() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    project,
    members,
    membersLoading,
    membersError,
    milestones,
    tasks,
    updates,
    currentUser,
    isOwner,
    canManageMembers,
    workspaceLoading,
    workspaceError,
    retryWorkspace,
    tasksLoading,
    tasksError,
    retryTasks,
    taskSummary,
    milestonesLoading,
    milestonesError,
    retryMilestones,
  } = useWorkspace();
  const searchParams = new URLSearchParams(location.search);
  const previewState = searchParams.get("state");
  const asParam = searchParams.get("as");
  const workspacePath = `/projects/${projectId}/workspace`;
  const workspaceHref = (path) =>
    `${workspacePath}${path}${asParam ? `?as=${encodeURIComponent(asParam)}` : ""}`;
  const completedTasks = taskSummary?.done ?? 0;
  const totalTasks = taskSummary?.total ?? tasks.length;
  const overdueTasks = taskSummary?.overdue ?? tasks.filter((task) => getDaysOverdue(task) > 0).length;
  const remainingTasks = taskSummary?.notDone ?? totalTasks - completedTasks;
  const attentionTasks = tasks.filter(
    (task) => task.status === "Blocked" || getDaysOverdue(task) > 0,
  );
  const currentUserTasks = tasks.filter(
    (task) => task.assignee === currentUser.name && task.status !== "Done",
  );
  const upcomingTasks = tasks.filter(
    (task) =>
      task.status !== "Done" &&
      !attentionTasks.some((attentionTask) => attentionTask.id === task.id),
  );
  const milestoneProgress = milestones.map((milestone) => {
    const milestoneTasks = tasks.filter(
      (task) => task.milestoneId === milestone.id,
    );
    return {
      ...milestone,
      completedTasks: milestoneTasks.filter((task) => task.status === "Done")
        .length,
      totalTasks: milestoneTasks.length,
    };
  });
  const resetPreviewState = () => {
    searchParams.delete("state");
    const query = searchParams.toString();
    navigate(
      `${location.pathname}${query ? `?${query}` : ""}`,
      { replace: true },
    );
  };
  const navigateTo = (path) => navigate(workspaceHref(path));

  if (workspaceLoading) {
    return (
      <section className={styles.statePanel} aria-live="polite">
        <h1 className={styles.pageTitle}>Overview</h1>
        <p role="status">Loading project details…</p>
        <div className={styles.skeletons}>
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (workspaceError) {
    return (
      <section className={styles.statePanel}>
        <h1 className={styles.pageTitle}>Overview</h1>
        <Alert variant="error" title="Couldn't load project details">
          {workspaceError}
        </Alert>
        <Button onClick={retryWorkspace}>Retry</Button>
      </section>
    );
  }

  if (previewState === "loading") {
    return (
      <section className={styles.statePanel} aria-live="polite">
        <h1 className={styles.pageTitle}>Overview</h1>
        <p className={styles.stateMessage}>
          Loading your workspace… Checking accepted membership and loading saved
          counts.
        </p>
        <div className={styles.skeletons}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>
    );
  }

  if (previewState === "error") {
    return (
      <section className={styles.statePanel}>
        <h1 className={styles.pageTitle}>Overview</h1>
        <Alert variant="error">
          Workspace could not load. No membership or project status changed.
          Retry to load saved work.
        </Alert>
        <Button onClick={resetPreviewState}>Retry</Button>
      </section>
    );
  }

  if (previewState === "empty") {
    return (
      <section className={styles.statePanel}>
        <h1 className={styles.pageTitle}>Overview</h1>
        <EmptyState
          title="No tasks yet."
          text="Ada can create one; members can request work in Updates."
        >
          {canManageMembers && (
            <Button onClick={() => navigateTo("/tasks/new")}>
              Create task
            </Button>
          )}
        </EmptyState>
      </section>
    );
  }

  const attentionTaskCards = (taskList) =>
    taskList.map((task) => {
      const milestone = milestones.find(
        (item) => item.id === task.milestoneId,
      );
      const daysOverdue = getDaysOverdue(task);

      return (
        <div className={styles.attentionTaskGroup} key={task.id}>
          <article className={`${styles.card} ${styles.attentionTask}`}>
            <div className={styles.tags}>
              {task.status === "Blocked" && (
                <StatusTag status="Blocked" />
              )}
              {daysOverdue > 0 && (
                <StatusTag status="Overdue" overdueDays={daysOverdue} />
              )}
              {!isOwner && task.status !== "Blocked" && daysOverdue === 0 && (
                <StatusTag status={task.status} />
              )}
            </div>
            <h3 className={styles.attentionTitle}>{task.title}</h3>
            <div className={styles.ownerLine}>
              <span className={styles.ownerAvatar} aria-hidden="true">
                {task.assignee.charAt(0)}
              </span>
              <span className={styles.taskMeta}>Owner: {task.assignee}</span>
            </div>
            <p className={styles.taskMeta}>
              Due: {formatDate(task.dueDate)} · Milestone:{" "}
              {milestone?.name || task.milestoneTitle || task.milestoneName || "—"}
            </p>
            {task.blockerNote && (
              <p className={styles.blockerNote}>
                Blocker note: {task.blockerNote}
              </p>
            )}
          </article>
          {canManageMembers && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigateTo(`/tasks/${task.id}`)}
            >
              Open task details
            </Button>
          )}
        </div>
      );
    });

  return (
    <section className={styles.overview}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Overview</h1>
        <p className={styles.dateLine}>
          {overviewDateLabel}
          {project.startDate || project.endDate
            ? ` · ${project.startDate ? formatShortDate(project.startDate) : "Start not set"}–${project.endDate ? formatShortDate(project.endDate) : "End not set"}`
            : ""}
          {project.durationWeeks != null && ` · ${project.durationWeeks} weeks`}
        </p>
      </header>

      {previewState === "refreshed" && (
        <Alert variant="success">
          Workspace updated. {completedTasks} of {totalTasks} Done.{" "}
          {milestoneProgress
            .map(
              (milestone) =>
                `${milestone.name || milestone.title || milestone.id}: ${milestone.completedTasks}/${milestone.totalTasks}`,
            )
            .join(" · ")}
          . Project is still {project.status}.
        </Alert>
      )}

      <div className={styles.overviewColumns}>
        <div className={styles.leftStack}>
          <article className={`${styles.card} ${styles.summaryCard}`}>
            <img
              className={styles.overviewImage}
              src={overviewImage}
              alt="A team planning and tracking shared project work"
            />
            <div className={styles.summaryContent}>
              <h2 className={styles.cardTitle}>A shared view of the work</h2>
              <div className={styles.progressHeading}>
                <span>Overall tasks</span>
                <span>
                  {tasksLoading
                    ? "Loading task counts…"
                    : tasksError
                      ? "Task counts unavailable"
                      : `${completedTasks} of ${totalTasks} Done`}
                </span>
              </div>
              <progress
                className={styles.progressBar}
                value={tasksLoading || tasksError ? 0 : completedTasks}
                max={totalTasks || 1}
                aria-label={`${completedTasks} of ${totalTasks} tasks done`}
              />
              <p className={styles.summaryMeta}>
                {tasksLoading
                  ? "Loading task counts…"
                  : tasksError
                    ? "Task counts unavailable"
                    : `${remainingTasks} tasks not Done · ${overdueTasks} task${overdueTasks === 1 ? "" : "s"} overdue`}
              </p>
              {tasksError && (
                <>
                  <Alert variant="error" title="Couldn't load project tasks">
                    {tasksError}
                  </Alert>
                  <Button variant="secondary" onClick={retryTasks}>
                    Retry task counts
                  </Button>
                </>
              )}
              <div className={styles.memberRows} aria-label="Project members">
                {membersLoading ? (
                  <p role="status">Loading members…</p>
                ) : membersError ? (
                  <Alert variant="error" title="Couldn't load members">
                    {membersError}
                  </Alert>
                ) : members.map((member) => (
                  <span
                    className={styles.memberAvatar}
                    key={member.id}
                    role="img"
                    aria-label={member.name}
                  >
                    {member.name.charAt(0)}
                  </span>
                ))}
              </div>
              {membersError && (
                <Button
                  variant="secondary"
                  onClick={retryWorkspace}
                >
                  Retry loading members
                </Button>
              )}
              <p className={styles.summaryMeta}>
                {membersLoading ? "Loading joined members…" : `${members.length} joined members`}
              </p>
              <p className={styles.acceptedDate}>
                {membersLoading
                  ? ""
                  : members[0]?.acceptedDate
                    ? `Joined ${members[0].acceptedDate}`
                    : ""}
              </p>
              <div className={styles.buttonRow}>
                <Button fullWidth onClick={() => navigateTo("/tasks")}>
                  View tasks
                </Button>
                {isOwner && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigateTo("/tasks/new")}
                  >
                    Create task
                  </Button>
                )}
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.milestonesCard}`}>
            <h2 className={`${styles.cardTitle} ${styles.dividedTitle}`}>
              Milestones
            </h2>
            {milestonesLoading ? (
              <p role="status">Loading milestones…</p>
            ) : milestonesError ? (
              <>
                <Alert variant="error" title="Couldn't load milestones">
                  {milestonesError}
                </Alert>
                <Button variant="secondary" onClick={retryMilestones}>
                  Retry
                </Button>
              </>
            ) : milestones.length === 0 ? (
              <EmptyState
                title="No milestones yet"
                text="No milestones have been added to this project."
              />
            ) : (
              <ul className={styles.milestoneList}>
                {milestoneProgress.map((milestone) => (
                  <li className={styles.milestone} key={milestone.id}>
                    <h3 className={styles.taskTitle}>
                      {milestone.name}
                    </h3>
                    <p className={styles.taskMeta}>
                      Target{" "}
                      {milestone.targetDate
                        ? formatDate(milestone.targetDate)
                        : "Not set"}{" "}
                      ·{" "}
                      {tasksLoading
                        ? "Loading task counts…"
                        : tasksError
                          ? "Task counts unavailable"
                          : `${milestone.completedTasks} / ${milestone.totalTasks} Done`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <a
              className={styles.textLink}
              href={workspaceHref("/milestones")}
            >
              View milestones
            </a>
          </article>
        </div>

        <div className={styles.rightStack}>
          <section className={styles.attentionSection}>
            <h2 className={styles.sectionLabel}>
              {isOwner ? "Needs attention" : "My tasks"}
            </h2>
            {isOwner ? (
              attentionTaskCards(attentionTasks)
            ) : (
              <>
                <div className={styles.memberTasks}>
                  {attentionTaskCards(currentUserTasks)}
                </div>
                <Button fullWidth onClick={() => navigateTo("/tasks")}>
                  View my tasks
                </Button>
                <p className={styles.memberNote}>
                  Create task and role management are not available to members.
                </p>
              </>
            )}
          </section>

          <article className={`${styles.card} ${styles.upcomingCard}`}>
            <h2 className={styles.cardTitle}>Upcoming tasks</h2>
            <div className={styles.taskList}>
              {upcomingTasks.map((task) => (
                <article className={styles.taskItem} key={task.id}>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <p className={styles.taskMeta}>
                    {task.assignee} · Due {formatShortDate(task.dueDate)} ·{" "}
                    {task.status}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className={`${styles.card} ${styles.updatesCard}`}>
            <h2 className={styles.cardTitle}>Latest project updates</h2>
            <div className={styles.updateList}>
              {updates.slice(0, 2).map((update) => (
                <article
                  className={styles.update}
                  key={`${update.author}-${update.date}`}
                >
                  <p className={styles.updateMeta}>
                    {update.author} · {formatShortDate(update.date)}
                  </p>
                  <p className={styles.updateText}>{update.message}</p>
                </article>
              ))}
            </div>
            <div className={styles.checkIn}>
              <p className={styles.updateMeta}>Weekly check-in</p>
              <p className={styles.updateText}>
                What moved forward? What help would be useful? Reply in Updates.
              </p>
            </div>
            <a className={styles.textLink} href={workspaceHref("/updates")}>
              View project updates
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}

export default WorkspaceOverview;
