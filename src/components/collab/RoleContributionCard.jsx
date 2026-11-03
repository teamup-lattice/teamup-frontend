import { formatDate } from "../../pages/CreateProject/formatDate";
import styles from "./RoleContributionCard.module.css";

function RoleContributionCard({ role, project }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>
        Your role and expected contribution
      </h2>
      <p className={styles.roleTitle}>{role.title}</p>
      <p className={styles.body}>{role.responsibilities}</p>
      <div>
        <h3 className={styles.label}>Required skills</h3>
        <p className={styles.body}>{role.requiredSkills.join(" · ")}</p>
      </div>
      <div>
        <h3 className={styles.label}>Expected contribution</h3>
        <p className={styles.body}>{role.expectedContribution}</p>
      </div>
      <p className={styles.commitment}>
        {role.hours} h / week · {role.weeks} weeks
      </p>
      <div className={styles.dates}>
        <p className={styles.body}>Start: {formatDate(project.startDate)}</p>
        <p className={styles.body}>End: {formatDate(project.endDate)}</p>
      </div>
      <div>
        <h3 className={styles.label}>Availability expectations</h3>
        <p className={styles.body}>{role.availability}</p>
      </div>
    </article>
  );
}

export default RoleContributionCard;
