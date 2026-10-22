import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import dashboardData from "../../data/dashboardData";
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
    </div>
  );
}

export default Dashboard;
