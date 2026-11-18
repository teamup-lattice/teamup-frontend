import teamHealthData from "../../data/teamHealthData";
import { normalizeTeamHealth } from "../../services/teamHealthService";
import styles from "./TeamHealthSummary.module.css";

function splitStatusLabel(label) {
  if (typeof label !== "string") {
    return { icon: "", text: "" };
  }

  const match = label.match(/^([^A-Za-z]*)(.*)$/);

  return {
    icon: match?.[1].trim() ?? "",
    text: match?.[2].trim() ?? "",
  };
}

function buildReasons(normalized) {
  const { signals } = normalized;
  const reasons = [];

  if (signals.overdueTasks > 0) {
    reasons.push(
      `${signals.overdueTasks} task${signals.overdueTasks === 1 ? "" : "s"} overdue`,
    );
  }

  if (signals.blockedTasks > 0) {
    reasons.push(
      `${signals.blockedTasks} blocked task${
        signals.blockedTasks === 1 ? "" : "s"
      }`,
    );
  }

  if (signals.overdueMilestones > 0) {
    reasons.push(
      `${signals.overdueMilestones} overdue milestone${
        signals.overdueMilestones === 1 ? "" : "s"
      }`,
    );
  }

  if (
    normalized.status === "NEEDS_ATTENTION" ||
    normalized.status === "AT_RISK"
  ) {
    reasons.push("Review together");
  }

  return reasons;
}

function TeamHealthSummary({ teamHealth }) {
  const normalized = normalizeTeamHealth(teamHealth);
  const statusLevel = teamHealthData.statusLevels.find(
    (level) => level.status === normalized.status,
  );
  const statusLabel = statusLevel
    ? splitStatusLabel(statusLevel.label)
    : { icon: "", text: teamHealthData.health.unavailable };
  const toneClass = statusLevel
    ? styles[statusLevel.tone]
    : styles.statusNeutral;
  const pillText = statusLabel.icon
    ? `${statusLabel.icon} Team health: ${statusLabel.text}`
    : `Team health: ${statusLabel.text}`;
  const reasonsLine = buildReasons(normalized).join(" · ");

  return (
    <div className={styles.summary}>
      <span className={`${styles.pill} ${toneClass}`}>{pillText}</span>
      {reasonsLine && <p className={styles.reasons}>{reasonsLine}</p>}
    </div>
  );
}

export default TeamHealthSummary;
