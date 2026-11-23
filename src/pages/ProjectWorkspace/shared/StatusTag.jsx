import styles from "./StatusTag.module.css";

// Returns a human-readable label for a contribution based on its latest review.
// Latest review (by createdAt) wins: CHANGES_REQUESTED → "Changes requested",
// CONFIRMED → "Confirmed", anything else → "Pending review".
// eslint-disable-next-line react-refresh/only-export-components
export function getContributionStatusLabel(contribution) {
  if (!contribution) return "Pending review";
  const reviews = Array.isArray(contribution.reviews)
    ? contribution.reviews
    : [];
  const latest = [...reviews].sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  })[0] ?? null;

  if (
    latest?.decision === "CHANGES_REQUESTED" ||
    (!latest && contribution.status === "CHANGES_REQUESTED")
  ) {
    return "Changes requested";
  }
  if (latest?.decision === "CONFIRMED" || contribution.status === "CONFIRMED") {
    return "Confirmed";
  }
  return "Pending review";
}

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
    case "Confirmed":
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
    case "Changes requested":
      return "overdue";
    case "Pending review":
      return "neutral";
    default:
      return "neutral";
  }
}

export default StatusTag;
