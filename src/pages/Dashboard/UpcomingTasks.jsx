import { useNavigate } from "react-router-dom";
import AltLink from "../../components/AltLink";
import styles from "./UpcomingTasks.module.css";

function UpcomingTasks({ tasks }) {
  const navigate = useNavigate();

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>Upcoming tasks</h2>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li className={styles.task} key={task.id}>
            <div className={styles.taskDetails}>
              <strong className={styles.title}>{task.title}</strong>
              <span className={styles.meta}>
                {task.owner} · Due {task.due}
              </span>
            </div>
            <span className={styles.status}>{task.status}</span>
            {task.projectId && task.id && (
              <button
                type="button"
                className={styles.taskLink}
                onClick={() =>
                  navigate(
                    `/projects/${task.projectId}/workspace/tasks/${task.id}`,
                  )
                }
              >
                View task
              </button>
            )}
          </li>
        ))}
      </ul>
      <AltLink to="/projects">View project tasks</AltLink>
    </section>
  );
}

export default UpcomingTasks;
