import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import { getDashboard } from "../../services/dashboardService";
import ActiveProjectCard from "./ActiveProjectCard";
import activeProjectStyles from "./ActiveProjectCard.module.css";
import NeedsAttentionCard from "./NeedsAttentionCard";
import needsAttentionStyles from "./NeedsAttentionCard.module.css";
import PendingInvitationCard from "./PendingInvitationCard";
import styles from "./Dashboard.module.css";
import UpcomingTasks from "./UpcomingTasks";

function formatDate(iso, options) {
  if (!iso) return "";

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  } catch {
    return "";
  }
}

function readable(status) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function buildActiveProject(dashboard) {
  if (!dashboard) return null;

  const project =
    dashboard.ownedProjects?.[0] ?? dashboard.memberProjects?.[0];
  if (!project) return null;

  const membership = project.memberships?.find(
    (item) => item.userId === dashboard.user.id,
  );
  const start = formatDate(project.startDate, {
    day: "numeric",
    month: "short",
  });
  const end = formatDate(project.targetEndDate, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    title: project.title,
    status: readable(project.status),
    role: `${
      project.ownerId === dashboard.user.id ||
      membership?.accessRole === "OWNER"
        ? "Owner"
        : "Member"
    }${
      membership?.role?.title ? ` · ${membership.role.title}` : ""
    }`,
    hoursPerWeek:
      membership?.committedHoursPerWeek ?? project.weeklyHours,
    dates: `${start} to ${end} · ${project.durationWeeks} weeks`,
    teammates: (project.memberships ?? [])
      .filter((item) => item.status === "ACTIVE")
      .map((item) => item.user.name),
    tasksDone: project.taskCounts?.COMPLETED ?? 0,
    tasksTotal: Object.entries(project.taskCounts ?? {}).reduce(
      (total, [status, count]) =>
        status === "CANCELLED" ? total : total + count,
      0,
    ),
    milestones: (project.milestones ?? []).map((milestone) => ({
      name: milestone.title,
      due: formatDate(milestone.dueDate, {
        day: "2-digit",
        month: "short",
      }),
      done: milestone.completedTaskCount ?? 0,
      total: milestone.taskCount ?? milestone._count?.tasks ?? 0,
    })),
  };
}

function buildNeedsAttention(task) {
  const statuses = [];
  if (task.status === "BLOCKED") statuses.push("Blocked");
  if (task.daysOverdue > 0) {
    statuses.push(`Overdue ${plural(task.daysOverdue, "day")}`);
  }
  if (statuses.length === 0) statuses.push(readable(task.status));

  const dueDate = task.dueDate
    ? `Due ${formatDate(task.dueDate, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : "No due date";

  return {
    title: task.title,
    status: statuses,
    owner: `${task.assignee?.user?.name ?? "Unassigned"}${
      task.assignee?.role?.title ? ` · ${task.assignee.role.title}` : ""
    }`,
    due: `${dueDate}${
      task.milestone ? ` · ${task.milestone.title}` : ""
    }`,
    blockerNote: task.blockerNote,
  };
}

function buildUpcomingTask(task) {
  return {
    id: task.id,
    title: task.title,
    owner: task.assignee?.user?.name ?? "Unassigned",
    due:
      formatDate(task.dueDate, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) || "not set",
    status: readable(task.status),
  };
}

function buildInvitation(inv) {
  return {
    id: inv.id,
    title: inv.project.title,
    description: inv.project.description,
    role: inv.role.title,
    hoursPerWeek: inv.proposedHoursPerWeek ?? inv.role.hoursPerWeek,
    weeks: inv.project.durationWeeks,
  };
}

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    getDashboard()
      .then((result) => {
        if (!isMounted) return;

        if (result.view === "ONBOARDING") {
          navigate("/profile/setup", { replace: true });
          return;
        }

        setDashboard(result);
        setProfile(result.user);
        if (result.view === "PROJECTS") {
          setStatus("ready");
        } else if (result.view === "DISCOVERY") {
          setStatus("empty");
        } else {
          setStatus("error");
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard data:", error);
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const activeProject = buildActiveProject(dashboard);
  const pendingInvitations = dashboard?.pendingInvitations ?? [];
  const attentionTasks = dashboard?.attentionTasks ?? [];
  const upcomingTasks = dashboard?.upcomingTasks ?? [];

  return (
    <div className={styles.dashboard}>
      <p className={styles.date}>{date}</p>
      <h1 className={styles.heading}>Good to see you, {profile?.name}</h1>
      <p className={styles.description}>
        Here&apos;s what needs your attention today.
      </p>

      {status === "loading" && (
        <div className={styles.columns} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              className={activeProjectStyles.card}
              aria-hidden="true"
              key={index}
            >
              <div className={needsAttentionStyles.blocker} />
            </article>
          ))}
        </div>
      )}

      {status === "empty" && (
        <article className={activeProjectStyles.card}>
          <div className={styles.emptyState}>
            <img
              className={styles.emptyStateIcon}
              src={listFilterIcon}
              alt=""
              aria-hidden="true"
            />
            <h2 className={activeProjectStyles.title}>
              Your first project starts here
            </h2>
            <p className={styles.description}>
              No projects yet. Discover an Open project or create your own.
            </p>
            <Button onClick={() => navigate("/discover")}>
              Discover Projects
            </Button>
          </div>
        </article>
      )}

      {(status === "ready" || status === "error") && (
        <>
          {status === "error" && (
            <div className={styles.columns}>
              <div className={styles.column}>
                <Alert variant="error" title="Dashboard could not refresh">
                  We could not load your dashboard. Check your connection and
                  try again.
                </Alert>
                <Button onClick={() => window.location.reload()}>
                  Retry refresh
                </Button>
              </div>
            </div>
          )}
          <div className={styles.actions}>
            <div className={styles.action}>
              <Button fullWidth onClick={() => navigate("/discover")}>
                Discover Projects
              </Button>
            </div>
            <div className={styles.action}>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate("/projects/new")}
              >
                Create project
              </Button>
            </div>
          </div>
          <div className={styles.columns}>
            <div className={styles.column}>
              {activeProject && (
                <ActiveProjectCard activeProject={activeProject} />
              )}
              {pendingInvitations.length > 0 && (
                <section className={styles.column}>
                  <h2 className={styles.heading}>Pending invitation</h2>
                  {pendingInvitations.map((inv) => (
                    <PendingInvitationCard
                      key={inv.id}
                      pendingInvitation={buildInvitation(inv)}
                    />
                  ))}
                </section>
              )}
            </div>
            <div className={styles.column}>
              {attentionTasks.length > 0 && (
                <section className={styles.column}>
                  <h2 className={styles.heading}>Needs attention</h2>
                  {attentionTasks.map((task) => (
                    <NeedsAttentionCard
                      key={task.id}
                      needsAttention={buildNeedsAttention(task)}
                    />
                  ))}
                </section>
              )}
              {upcomingTasks.length > 0 && (
                <UpcomingTasks tasks={upcomingTasks.map(buildUpcomingTask)} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
