import { SEP, formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./ProjectCompletion.module.css";

// Read-only context: saved task progress per milestone. It is not a
// completion gate (the designs say the exact milestone/work gate is TBD).
function SavedWorkCard({ milestones }) {
  const done = milestones.reduce((sum, item) => sum + item.done, 0);
  const total = milestones.reduce((sum, item) => sum + item.total, 0);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className={shared.card} aria-labelledby="saved-work-title">
      <h3 id="saved-work-title" className={shared.cardTitle}>
        Saved work
      </h3>
      <p className={styles.progressRow}>
        <span>Overall tasks</span>
        <span>
          {done} of {total} Done
        </span>
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Overall tasks done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <ul className={shared.list}>
        {milestones.map((milestone) => (
          <li key={milestone.id} className={shared.small}>
            {milestone.name}
            {SEP}
            {formatDate(milestone.targetDate)}
            {SEP}
            {milestone.done}/{milestone.total} Done
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SavedWorkCard;
