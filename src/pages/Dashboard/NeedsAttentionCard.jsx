import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import RequestNewDateModal from "./RequestNewDateModal";
import styles from "./NeedsAttentionCard.module.css";

function NeedsAttentionCard({
  needsAttention,
  taskId,
  projectId,
  taskTitle,
  rawDueDate,
  assigneeMemberId,
  onActionComplete,
}) {
  const navigate = useNavigate();
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const canOpenTask = Boolean(projectId && taskId);
  // Dashboard attention tasks are scoped to the signed-in assignee, so a
  // present assignee member id means this task belongs to the current user.
  const canHandOver = canOpenTask && Boolean(assigneeMemberId);

  const handleOpenTask = () => {
    if (canOpenTask) {
      navigate(`/projects/${projectId}/workspace/tasks/${taskId}`);
    }
  };

  const handleHandOver = () => {
    if (canHandOver) {
      const taskParam = encodeURIComponent(taskId);
      navigate(
        `/projects/${projectId}/workspace/reminders?taskId=${taskParam}&mode=handover`,
      );
    }
  };

  const handleRequestSuccess = () => {
    setIsDateModalOpen(false);
    setSuccessMessage(
      "New date requested. Your project owner has been notified.",
    );
    onActionComplete?.();
  };

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
              {isBlocked && (
                <span className={styles.blockedIcon} aria-hidden="true">
                  !
                </span>
              )}
              {status}
            </span>
          );
        })}
      </div>

      <h3 className={styles.title}>{needsAttention.title}</h3>

      <div className={styles.owner}>
        <span className={styles.avatar} aria-hidden="true">
          {needsAttention.owner.charAt(0).toUpperCase()}
        </span>
        <span>{needsAttention.owner}</span>
      </div>

      <p className={styles.due}>{needsAttention.due}</p>
      {needsAttention.blockerNote && (
        <p className={styles.blocker}>
          Blocker note: {needsAttention.blockerNote}
        </p>
      )}

      {successMessage && (
        <div className={styles.feedback}>
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

      {canOpenTask && (
        <Button variant="secondary" fullWidth onClick={handleOpenTask}>
          Open task details
        </Button>
      )}

      {canOpenTask && (
        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setIsDateModalOpen(true)}
          >
            Request new date
          </button>
          {canHandOver && (
            <button
              type="button"
              className={styles.linkButton}
              onClick={handleHandOver}
            >
              Hand over
            </button>
          )}
          {/* Owners and managers reassign tasks from the task details screen. */}
        </div>
      )}

      {isDateModalOpen && (
        <RequestNewDateModal
          projectId={projectId}
          taskId={taskId}
          taskTitle={taskTitle || needsAttention.title}
          rawDueDate={rawDueDate}
          onClose={() => setIsDateModalOpen(false)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </article>
  );
}

export default NeedsAttentionCard;
