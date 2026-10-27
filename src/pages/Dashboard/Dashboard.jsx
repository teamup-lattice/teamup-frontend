import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import { getDashboard } from "../../services/dashboardService";
import ActiveProjectCard from "./ActiveProjectCard";
import activeProjectStyles from "./ActiveProjectCard.module.css";
import needsAttentionStyles from "./NeedsAttentionCard.module.css";
import styles from "./Dashboard.module.css";

function buildActiveProject(dashboard) {
  if (!dashboard) return null;

  const project =
    dashboard.ownedProjects[0] ?? dashboard.memberProjects[0];
  if (!project) return null;

  const membership = project.memberships?.find(
    (item) => item.userId === dashboard.user.id,
  );
  const start = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(project.startDate));
  const end = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(project.targetEndDate));

  return {
    title: project.title,
    status: project.status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (letter) => letter.toUpperCase()),
    role: `${membership?.accessRole === "OWNER" ? "Owner" : "Member"}${
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
      due: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
      }).format(new Date(milestone.dueDate)),
      done:
        milestone.status === "COMPLETED"
          ? milestone._count?.tasks ?? 0
          : 0,
      total: milestone._count?.tasks ?? 0,
    })),
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
                  Refresh failed. Showing your last saved projects.
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
              {/* TODO: Re-enable when the backend returns the pending invitation shape. */}
            </div>
            <div className={styles.column}>
              {/* TODO: Re-enable when the backend returns the attentionTasks shape. */}
              {/* TODO: Re-enable when the backend returns the upcomingTasks shape. */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
