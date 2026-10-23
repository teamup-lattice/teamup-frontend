import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import styles from "./NeedsAttentionCard.module.css";

function NeedsAttentionCard({ needsAttention }) {
  return (
    <article className={styles.card}>
      <div className={styles.statuses}>
        {needsAttention.status.map((status) => {
          const isBlocked = status === "Blocked";

          return (
            <span
              className={`${styles.status} ${
                isBlocked ? styles.blocked : styles.overdue
              }`}
              key={status}
            >
              {status}
            </span>
          );
        })}
      </div>

      <h3 className={styles.title}>{needsAttention.title}</h3>

      <div className={styles.owner}>
        <span className={styles.avatar} aria-hidden="true">
          D
        </span>
        <span>{needsAttention.owner}</span>
      </div>

      <p className={styles.due}>{needsAttention.due}</p>
      <p className={styles.blocker}>
        Blocker note: {needsAttention.blockerNote}
      </p>

      <Button variant="secondary" fullWidth>
        Open task details
      </Button>

      <div className={styles.links}>
        <AltLink to="/projects">Request new date</AltLink>
        <AltLink to="/projects">Hand over</AltLink>
      </div>
    </article>
  );
}

export default NeedsAttentionCard;
