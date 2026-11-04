import styles from "./StatusTag.module.css";

function StatusTag({ status, overdueDays = 0, className = "" }) {
  const classes = [styles.tag, styles[statusToVariant(status)], className]
    .filter(Boolean)
    .join(" ");

  if (status === "Blocked") {
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true">!</span>
        <span>Blocked</span>
      </span>
    );
  }

  if (status === "Overdue") {
    const label = `Overdue ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`;
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  if (status === "Done") {
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true">✓</span>
        <span>Done</span>
      </span>
    );
  }

  if (status === "In progress") {
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true" />
        <span>In progress</span>
      </span>
    );
  }

  if (status === "In review") {
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true" />
        <span>In review</span>
      </span>
    );
  }

  if (status === "To do") {
    return (
      <span className={classes}>
        <span className={styles.icon} aria-hidden="true" />
        <span>To do</span>
      </span>
    );
  }

  return (
    <span className={classes}>
      <span className={styles.icon} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

function statusToVariant(status) {
  switch (status) {
    case "Done":
      return "done";
    case "Blocked":
      return "blocked";
    case "Overdue":
      return "overdue";
    case "In progress":
    case "In review":
      return "inProgress";
    case "To do":
      return "toDo";
    default:
      return "neutral";
  }
}

export default StatusTag;
