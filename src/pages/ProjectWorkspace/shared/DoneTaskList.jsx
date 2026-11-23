import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjectTask } from "../../../services/tasksService";
import { SEP, formatDate, isValidDate } from "../workspaceFormat";
import shared from "../screens/shared.module.css";
import styles from "./DoneTaskList.module.css";

function firstEvidence(task) {
  const contributions = Array.isArray(task?.contributions)
    ? task.contributions
    : [];

  for (const contribution of contributions) {
    if (!Array.isArray(contribution.evidence)) continue;
    const found = contribution.evidence.find((item) => item.url);
    if (found) return found;
  }

  return null;
}

// Saved Done tasks, read only. The evidence itself is opened from the task. Used by the Contribution
// summary and Teammate confirmation screens. Ownership and history are never
// changed from here.
function DoneTaskList({ tasks, taskPath, projectId }) {
  const requestKey = `${projectId}|${tasks.map((task) => task.id).join(",")}`;
  const [loaded, setLoaded] = useState({ key: null, data: {} });

  useEffect(() => {
    if (!projectId || tasks.length === 0) {
      return undefined;
    }

    let isCurrent = true;
    Promise.allSettled(tasks.map((task) => getProjectTask(projectId, task.id)))
      .then((results) => {
        if (!isCurrent) return;
        const next = {};
        results.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const evidence = firstEvidence(result.value);
          if (evidence) next[tasks[index].id] = evidence;
        });
        setLoaded({ key: requestKey, data: next });
      })
      .catch(() => {
        if (isCurrent) setLoaded({ key: requestKey, data: {} });
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, tasks, requestKey]);

  const isCurrent = loaded.key === requestKey;
  const evidenceByTask =
    !projectId || tasks.length === 0 || !isCurrent ? {} : loaded.data;

  return (
    <ul className={styles.list}>
      {tasks.map((task) => {
        const evidence = evidenceByTask[task.id];
        return (
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
              {isValidDate(task.completedAt) && (
                <p className={styles.meta}>Completed {formatDate(task.completedAt)}</p>
              )}
              {evidence && (
                <>
                  <p className={styles.meta}>Evidence: {evidence.name}</p>
                  <a
                    className={styles.centered}
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open {evidence.name}
                  </a>
                </>
              )}
            </article>
            <Link
              to={taskPath(task.id)}
              className={styles.centered}
              aria-label={`View task evidence for ${task.title}`}
            >
              View task evidence
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default DoneTaskList;
