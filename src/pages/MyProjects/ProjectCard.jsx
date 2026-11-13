import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { deleteProject } from "../../services/myProjectsService";
import { formatDate } from "../CreateProject/formatDate";
import { defaultStatusConfig, statusConfig } from "./statusConfig";
import styles from "./ProjectCard.module.css";

const PROJECT_TYPE_LABELS = {
  WEB_APPLICATION: "Web application",
  MOBILE_APP: "Mobile app",
  DESKTOP_APP: "Desktop app",
  API_SERVICE: "API service",
  DATA_SCIENCE: "Data science",
  DESIGN: "Design",
  OTHER: "Other",
};

function readableLabel(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function ProjectCard({ project = {}, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const projectId = project.id;
  const title =
    typeof project.title === "string" && project.title.trim()
      ? project.title
      : "Untitled project";
  const statusLabel = readableLabel(project.status) || "Status unavailable";
  const config = statusConfig[statusLabel] ?? defaultStatusConfig;

  const isDraft =
    statusLabel === "Draft" ||
    (typeof project.status === "string" &&
      project.status.toUpperCase() === "DRAFT");

  const isOwner =
    project.isOwner === true ||
    (currentUserId != null &&
      project.ownerId != null &&
      String(project.ownerId) === String(currentUserId)) ||
    (currentUserId != null &&
      project.owner?.id != null &&
      String(project.owner.id) === String(currentUserId)) ||
    (project.isOwner === undefined && project.ownerId == null);

  const canDelete = isDraft && isOwner;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(projectId);
      onDelete?.(projectId);
    } catch (error) {
      console.error("Failed to delete project draft:", error);
      setDeleteError(error.message || "Failed to delete draft");
    } finally {
      setIsDeleting(false);
    }
  };
  const attention = project.attention;
  const attentionBadge =
    typeof attention?.badge === "string" ? attention.badge : "";
  const attentionDetail =
    typeof attention?.detail === "string" ? attention.detail : "";
  const badgeLabel = attentionBadge || statusLabel;
  const badgeTone = attentionBadge ? "amber" : config.tone;
  const titleId = `project-${projectId ?? "unknown"}-title`;
  const roles = Array.isArray(project.roles) ? project.roles : [];
  const skills = Array.isArray(project.skills) ? project.skills : [];
  const roleTitles = roles
    .map((role) => role?.title)
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  const skillNames = skills
    .map((item) => item?.skill?.name)
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  const projectType =
    PROJECT_TYPE_LABELS[project.projectType] ??
    readableLabel(project.projectType);
  const dates = [
    formatDate(project.startDate),
    formatDate(project.targetEndDate),
  ]
    .filter(Boolean)
    .join("–");
  const teamSize = Number.isFinite(project.teamSize)
    ? `Team size: ${project.teamSize}`
    : "";
  const details = [
    ...roleTitles,
    ...skillNames,
    projectType ? `Type: ${projectType}` : "",
    teamSize,
    dates,
  ].filter(Boolean);
  const description =
    typeof project.description === "string" ? project.description : "";
  const note = typeof project.note === "string" ? project.note : "";

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <span className={`${styles.badge} ${styles[badgeTone]}`}>
        {badgeLabel}
      </span>

      {attentionDetail && <p className={styles.meta}>{attentionDetail}</p>}

      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      {description && <p className={styles.description}>{description}</p>}
      {details.length > 0 && (
        <p className={styles.meta}>{details.join(" · ")}</p>
      )}

      <div className={styles.actions}>
        <Button
          aria-label={`${config.actionLabel}: ${title}`}
          disabled={!projectId}
          onClick={() => projectId && navigate(config.path(projectId))}
        >
          {config.actionLabel}
        </Button>

        {canDelete && !isConfirmingDelete && (
          <Button
            variant="secondary"
            disabled={!projectId}
            onClick={() => {
              setDeleteError(null);
              setIsConfirmingDelete(true);
            }}
          >
            Delete draft
          </Button>
        )}
      </div>

      {canDelete && isConfirmingDelete && (
        <div className={styles.deleteConfirm}>
          <p className={styles.deletePrompt}>Delete this draft?</p>
          <div className={styles.deleteActions}>
            <Button
              variant="secondary"
              disabled={isDeleting}
              onClick={() => {
                setIsConfirmingDelete(false);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              loadingText="Deleting..."
              onClick={handleDelete}
            >
              Confirm delete
            </Button>
          </div>
          {deleteError && (
            <Alert variant="error">
              {deleteError}
            </Alert>
          )}
        </div>
      )}

      {note && <p className={styles.note}>{note}</p>}
    </article>
  );
}

export default ProjectCard;
