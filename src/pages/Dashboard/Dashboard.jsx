import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import dashboardData from "../../data/dashboardData";
import ActiveProjectCard from "./ActiveProjectCard";
import NeedsAttentionCard from "./NeedsAttentionCard";
import PendingInvitationCard from "./PendingInvitationCard";
import UpcomingTasks from "./UpcomingTasks";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className={styles.dashboard}>
      <p className={styles.date}>{date}</p>
      <h1 className={styles.heading}>
        Good to see you, {dashboardData.user.name}
      </h1>
      <p className={styles.description}>
        Here&apos;s what needs your attention today.
      </p>
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
    </div>
  );
}

export default Dashboard;
