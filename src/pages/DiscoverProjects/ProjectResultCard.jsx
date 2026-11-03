import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import styles from "./ProjectResultCard.module.css";

function ProjectResultCard({ project }) {
  const navigate = useNavigate();
  const titleId = `open-project-${project.id}-title`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <span className={styles.badge}>Open</span>
      <h3 className={styles.title} id={titleId}>
        {project.title}
      </h3>
      <p className={styles.description}>{project.description}</p>
      <p className={styles.meta}>
        <span className={styles.metaLine}>
          {project.role} · {project.skills.join(" + ")}
        </span>
        <span className={styles.metaLine}>
          {project.hoursPerWeek} h / week · {project.weeks} weeks · {project.type}
        </span>
      </p>

      <Button
        aria-label={`View project: ${project.title}`}
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        View project
      </Button>

      <p className={styles.note}>
        Planned {project.dates} · Review role terms before requesting.
      </p>
    </article>
  );
}

export default ProjectResultCard;