import StatusTag from "./StatusTag";
import styles from "./TaskSummaryCard.module.css";
import { formatDate } from "../../CreateProject/formatDate";

function TaskSummaryCard({ task, milestone }) {
  if (!task) {
    return null;
  }

  const overdueDays = Number(task.overdueDays || 0);
  const milestoneLabel =
    milestone?.name || task.milestoneTitle || task.milestoneName || "";
  const ownerInitial = (task.assignee || "").charAt(0).toUpperCase();

  return (
    <article className={styles.card}>
      <div className={styles.tagsRow}>
        {task.status === "Blocked" && <StatusTag status="Blocked" />}
        {overdueDays > 0 && <StatusTag status="Overdue" overdueDays={overdueDays} />}
        {task.status !== "Blocked" && overdueDays === 0 && (
          <StatusTag status={task.status} />
        )}
      </div>
      <h3 className={styles.title}>{task.title}</h3>
      <div className={styles.ownerRow}>
        <span className={styles.avatar} aria-hidden="true">
          {ownerInitial}
        </span>
        <span>Owner: {task.assignee}</span>
      </div>
      <p className={styles.metaLine}>
        Due: {formatDate(task.dueDate)} · Milestone: {milestoneLabel}
      </p>
      {task.blockerNote && (
        <p className={styles.blockerNote}>Blocker note: {task.blockerNote}</p>
      )}
      {!task.blockerNote && task.status !== "Blocked" && (
        <p className={styles.statusSummary}>
          {milestoneLabel} · {task.status}
        </p>
      )}
    </article>
  );
}

export default TaskSummaryCard;
