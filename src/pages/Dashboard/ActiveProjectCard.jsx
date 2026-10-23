import Button from "../../components/Button";
import styles from "./ActiveProjectCard.module.css";

function formatNames(names) {
  if (names.length < 2) {
    return names[0] ?? "";
  }

  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function ActiveProjectCard({ activeProject }) {
  const totalTasks = Math.max(activeProject.tasksTotal, 0);
  const completedTasks = Math.min(
    Math.max(activeProject.tasksDone, 0),
    totalTasks,
  );
  const progressMax = totalTasks || 1;

  return (
    <article className={styles.card}>
      <p className={styles.label}>ACTIVE PROJECT</p>

      <div className={styles.projectHeading}>
        <span className={styles.status}>{activeProject.status}</span>
        <h2 className={styles.title}>{activeProject.title}</h2>
      </div>

      <div className={styles.meta}>
        <p>
          {activeProject.role} · {activeProject.hoursPerWeek} hours/week
        </p>
        <p>{activeProject.dates}</p>
      </div>

      <div className={styles.teammates}>
        <div className={styles.avatars} aria-hidden="true">
          {activeProject.teammates.map((name, index) => (
            <span className={styles.avatar} key={`${name}-${index}`}>
              {name.charAt(0)}
            </span>
          ))}
        </div>
        <p className={styles.teammateText}>
          {activeProject.teammates.length} accepted teammates ·{" "}
          {formatNames(activeProject.teammates)}
        </p>
      </div>

      <section className={styles.progressSection} aria-label="Overall tasks">
        <div className={styles.progressSummary}>
          <span>Overall tasks</span>
          <span>
            {completedTasks} of {totalTasks} Done
          </span>
        </div>
        <progress
          className={styles.progressTrack}
          aria-label="Overall tasks"
          value={completedTasks}
          max={progressMax}
        />
      </section>

      <ul className={styles.milestones}>
        {activeProject.milestones.map((milestone) => (
          <li className={styles.milestone} key={milestone.name}>
            <strong className={styles.milestoneName}>
              {milestone.name} · {milestone.due}
            </strong>
            <span className={styles.milestoneProgress}>
              {milestone.done} of {milestone.total} Done
            </span>
          </li>
        ))}
      </ul>

      <Button variant="secondary">Open project workspace</Button>
    </article>
  );
}

export default ActiveProjectCard;
