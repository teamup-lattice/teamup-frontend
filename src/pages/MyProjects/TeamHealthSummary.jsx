import teamHealthData from "../../data/teamHealthData";
import styles from "./TeamHealthSummary.module.css";

function TeamHealthSummary({ children }) {
  return (
    <div className={styles.summaryGroup}>
      <div className={styles.outerCard}>
        {children}
        <section className={styles.healthSummary} aria-labelledby="team-health-summary-title">
          <h3 className={styles.heading} id="team-health-summary-title">
            Team health
          </h3>
          <span className={`${styles.statusChip} ${styles.needsAttention}`}>
            ! Needs attention
          </span>
          <p className={styles.helperText}>
            Shared team context · No individual scores
          </p>
        </section>
      </div>
      <section className={styles.statusLevels} aria-labelledby="team-status-levels-title">
        <h4 className={styles.label} id="team-status-levels-title">
          Team status levels
        </h4>
        <div className={styles.statusRow}>
          {teamHealthData.statusLevels.map(({ label, tone }) => (
            <span key={label} className={`${styles.statusChipSmall} ${styles[tone]}`}>
              {label}
            </span>
          ))}
        </div>
        <p className={styles.footerText}>
          Health describes the team, not individual members.
        </p>
      </section>
    </div>
  );
}

export default TeamHealthSummary;
