import AvatarRow from "../AvatarRow";
import styles from "./ProjectSummaryCard.module.css";

function ProjectSummaryCard({ project, variant }) {
  if (variant === "short") {
    return (
      <article className={styles.card}>
        <h2 className={styles.title}>{project.name}</h2>
        <p className={styles.body}>{project.expectedOutcome}</p>
        <p className={styles.mutedLine}>
          Owner: {project.ownerName} · Open recruitment
        </p>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <h2 className={styles.title}>{project.name}</h2>
      <p className={styles.mutedLine}>
        {project.type} · Open for recruitment
      </p>
      <div className={styles.blocks}>
        <div>
          <h3 className={styles.label}>Problem</h3>
          <p className={styles.body}>{project.problem}</p>
        </div>
        <div>
          <h3 className={styles.label}>Description</h3>
          <p className={styles.body}>{project.description}</p>
        </div>
        <div>
          <h3 className={styles.label}>Expected outcome</h3>
          <p className={styles.body}>{project.expectedOutcome}</p>
        </div>
        <div>
          <h3 className={styles.label}>Project skills</h3>
          <p className={styles.body}>{project.skills.join(" · ")}</p>
        </div>
      </div>
      <AvatarRow
        initial={project.ownerName.charAt(0)}
        text={`${project.ownerName} · Owner / ${project.ownerRole} · ${project.ownerHours}`}
      />
      <p className={styles.mutedLine}>
        Contact details are only visible to accepted teammates.
      </p>
    </article>
  );
}

export default ProjectSummaryCard;
