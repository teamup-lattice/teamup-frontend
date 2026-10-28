import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { defaultStatusConfig, statusConfig } from "./statusConfig";
import styles from "./ProjectCard.module.css";

function ProjectCard({ project }) {
  const navigate = useNavigate();
  const config = statusConfig[project.status] ?? defaultStatusConfig;
  const badgeLabel = project.attention?.badge ?? project.status;
  const badgeTone = project.attention ? "amber" : config.tone;
  const titleId = `project-${project.id}-title`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <span className={`${styles.badge} ${styles[badgeTone]}`}>
        {badgeLabel}
      </span>

      {project.attention && (
        <p className={styles.meta}>{project.attention.detail}</p>
      )}

      <h2 className={styles.title} id={titleId}>
        {project.title}
      </h2>
      <p className={styles.description}>{project.description}</p>
      <p className={styles.meta}>{project.details.join(" · ")}</p>

      <Button
        aria-label={`${config.actionLabel}: ${project.title}`}
        onClick={() => navigate(config.path(project.id))}
      >
        {config.actionLabel}
      </Button>

      <p className={styles.note}>{project.note}</p>
    </article>
  );
}

export default ProjectCard;