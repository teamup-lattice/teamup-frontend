import { Link } from "react-router-dom";
import { SEP, formatDate } from "../../workspaceFormat";
import shared from "../shared.module.css";
import EvidenceLink from "./EvidenceLink";
import styles from "./PrivateProjectPage.module.css";

// Individual summaries come from each member's saved Done tasks and are
// separate from the team outcome above. Contact details, private task
// comments and drafts are never shown here.
function ContributionsSection({ contributions, taskPath }) {
  return (
    <section aria-labelledby="page-contributions-title">
      <h3 id="page-contributions-title" className={shared.sectionTitle}>
        Individual contributions
      </h3>
      <p className={shared.small}>
        Individual summaries reflect saved Done tasks, separate from the team outcome.
      </p>

      <ul className={styles.contributions}>
        {contributions.map((item) => (
          <li key={item.member} className={shared.card}>
            <div className={styles.summaryBox}>
              <p className={shared.person}>
                <span className={shared.avatar} aria-hidden="true">
                  {item.member.charAt(0)}
                </span>
                <span className={shared.small}>
                  {item.member}
                  {SEP}
                  {item.role}
                </span>
              </p>
              <p className={styles.summaryTitle}>{item.summary}</p>
              <p className={shared.text}>{item.note}</p>
            </div>

            <ul className={styles.tasks}>
              {item.tasks.map((task) => (
                <li key={task.id} className={styles.taskCell}>
                  <article className={styles.taskCard}>
                    <span className={styles.completedTag}>
                      <span aria-hidden="true">{"✓"}</span> Done
                    </span>
                    <h4 className={styles.taskName}>{task.title}</h4>
                    <p className={styles.owner}>
                      <span className={shared.avatar} aria-hidden="true">
                        {task.owner.charAt(0)}
                      </span>
                      Owner: {task.owner}
                    </p>
                    <p className={styles.meta}>
                      Due: {formatDate(task.dueDate)}
                      {SEP}
                      {task.milestone}
                    </p>
                    <p className={styles.meta}>
                      Completed {formatDate(task.completedOn)}
                      <br />
                      Evidence: {task.evidence.name}
                    </p>
                    <EvidenceLink evidence={task.evidence} className={styles.centered}>
                      Open {task.evidence.name}
                    </EvidenceLink>
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
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>Contact details, private task comments and drafts are excluded.</p>
    </section>
  );
}

export default ContributionsSection;
