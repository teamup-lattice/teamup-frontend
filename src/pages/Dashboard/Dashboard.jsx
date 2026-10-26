import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import dashboardData from "../../data/dashboardData";
import { getDashboard } from "../../services/dashboardService";
import ActiveProjectCard from "./ActiveProjectCard";
import activeProjectStyles from "./ActiveProjectCard.module.css";
import NeedsAttentionCard from "./NeedsAttentionCard";
import needsAttentionStyles from "./NeedsAttentionCard.module.css";
import PendingInvitationCard from "./PendingInvitationCard";
import UpcomingTasks from "./UpcomingTasks";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
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
              <ActiveProjectCard activeProject={dashboardData.activeProject} />
              <section className={styles.section}>
                <h2 className={styles.heading}>Pending invitation</h2>
                <PendingInvitationCard
                  pendingInvitation={dashboardData.pendingInvitation}
                />
              </section>
            </div>
            <div className={styles.column}>
              <section className={styles.section}>
                <h2 className={styles.heading}>Needs attention</h2>
                <NeedsAttentionCard
                  needsAttention={dashboardData.needsAttention}
                />
              </section>
              <UpcomingTasks tasks={dashboardData.upcomingTasks} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
