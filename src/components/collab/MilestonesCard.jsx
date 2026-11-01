import { formatDate } from "../../pages/CreateProject/formatDate";
import styles from "./MilestonesCard.module.css";

function MilestonesCard({ milestones, taskDeadlines }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>Planned milestones and deadlines</h2>
      <div className={styles.lines}>
        {milestones.map((milestone) => (
          <p className={styles.body} key={`${milestone.name}-${milestone.date}`}>
            {milestone.name} — {formatDate(milestone.date)}
          </p>
        ))}
      </div>
      <div>
        <h3 className={styles.label}>Your planned task deadlines</h3>
        <div className={styles.lines}>
          {taskDeadlines.map((deadline) => (
            <p className={styles.body} key={`${deadline.name}-${deadline.date}`}>
              {deadline.name} — {formatDate(deadline.date)}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export default MilestonesCard;
