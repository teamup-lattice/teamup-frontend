import { Link } from "react-router-dom";
import { SEP, formatDate } from "../workspaceFormat";
import shared from "../screens/shared.module.css";
import styles from "./DoneTaskList.module.css";

// Saved Done tasks, read only. The evidence itself is opened from the task. Used by the Contribution
// summary and Teammate confirmation screens. Ownership and history are never
// changed from here.
function DoneTaskList({ tasks, taskPath }) {
  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id} className={styles.cell}>
          <article className={styles.card}>
            <span className={styles.doneTag}>
              <span aria-hidden="true">{"✓"}</span> Done
            </span>
            <h4 className={styles.name}>{task.title}</h4>
            <p className={styles.owner}>
              <span className={shared.avatar} aria-hidden="true">
                {(task.assignee || "?").charAt(0)}
              </span>
              Owner: {task.assignee || "Unassigned"}
            </p>
            <p className={styles.meta}>
              Due: {task.dueDate ? formatDate(task.dueDate) : "No due date"}
              {task.milestoneName ? `${SEP}${task.milestoneName}` : ""}
            </p>
          </article>
          <Link
            to={taskPath(task.id)}
            className={styles.centered}
            aria-label={`View task evidence for ${task.title}`}
          >
            View task evidence
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default DoneTaskList;
