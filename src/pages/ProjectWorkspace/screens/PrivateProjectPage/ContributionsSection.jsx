import { Link } from "react-router-dom";
import AvatarGroup from "../../../../components/AvatarGroup";
import { ArrowUpRightIcon, PaperclipIcon } from "../../../../components/Icons";
import { SEP, formatDate } from "../../workspaceFormat";
import StatusTag from "../../shared/StatusTag";
import shared from "../shared.module.css";
import EvidenceLink from "./EvidenceLink";
import styles from "./PrivateProjectPage.module.css";

// Individual summaries come from each member's confirmed contribution wording
// and are separate from the team outcome above. Contact details, private task
// comments and drafts are never shown here.
function ContributionsSection({ contributions, taskPath }) {
  return (
    <section aria-labelledby="page-contributions-title">
      <h3 id="page-contributions-title" className={shared.sectionTitle}>
        Individual contributions
      </h3>
      <p className={styles.sectionHelper}>
        Individual summaries reflect saved Done tasks, separate from the team
        outcome.
      </p>

      <ul className={styles.contributions}>
        {contributions.map((item) => (
          <li key={item.member} className={`${shared.card} ${styles.personCard}`}>
            <div className={styles.personSummary}>
              <header className={styles.personHeader}>
                <AvatarGroup
                  hidden
                  items={[{ initial: item.member.charAt(0), label: item.member }]}
                />
                <span className={styles.personMeta}>
                  <span className={styles.personName}>{item.member}</span>
                  {item.role && (
                    <span className={styles.personRole}>
                      {SEP}
                      {item.role}
                    </span>
                  )}
                </span>
              </header>

              <p className={styles.summaryTitle}>{item.summary}</p>
              <p className={styles.personNote}>{item.note}</p>
            </div>

            <ul className={styles.tasks}>
              {item.tasks.map((task) => (
                <li key={task.id} className={styles.taskCell}>
                  <article className={styles.taskCard}>
                    <StatusTag status="Done" />
                    <h4 className={styles.taskName}>{task.title}</h4>
                    <div className={styles.owner}>
                      <AvatarGroup
                        hidden
                        items={[
                          {
                            initial: (task.owner || "").charAt(0),
                            label: task.owner,
                          },
                        ]}
                      />
                      <span className={styles.ownerText}>
                        Owner: {task.owner}
                      </span>
                    </div>
                    <p className={styles.meta}>
                      Due: {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                      {SEP}
                      {task.milestone}
                    </p>
                    {/* GAP: per-task completion date and evidence are not in the task list response. */}
                    {(task.completedOn || task.evidence) && (
                      <p className={styles.meta}>
                        {task.completedOn && `Completed ${formatDate(task.completedOn)}`}
                        {task.completedOn && task.evidence && <br />}
                        {task.evidence && `Evidence: ${task.evidence.name}`}
                      </p>
                    )}
                    {task.evidence && (
                      <EvidenceLink
                        evidence={task.evidence}
                        className={styles.evidenceInline}
                      >
                        <span className={styles.evidenceIcon} aria-hidden="true">
                          {task.evidence.kind === "link" ? (
                            <ArrowUpRightIcon />
                          ) : (
                            <PaperclipIcon />
                          )}
                        </span>
                        <span className={styles.evidenceName}>
                          Open {task.evidence.name}
                        </span>
                      </EvidenceLink>
                    )}
                    <div className={styles.taskFooter}>
                      <Link
                        to={taskPath(task.id)}
                        className={styles.taskFooterLink}
                        aria-label={`View task evidence for ${task.title}`}
                      >
                        <span>View task evidence</span>
                        <ArrowUpRightIcon />
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        Contact details, private task comments and drafts are excluded.
      </p>
    </section>
  );
}

export default ContributionsSection;
