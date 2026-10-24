import {
  ArrowUpRightIcon,
  PaperclipIcon,
} from "../../components/Icons";
import styles from "./Workspace.module.css";

const tasks = [
  {
    title: "Design onboarding",
    details: "David · Waiting for agreed sign-up fields",
    badge: "Blocked",
    blocked: true,
  },
  {
    title: "UI handoff",
    details: "David · UI/UX Designer",
    badge: "In review",
  },
  {
    title: "Prototype review",
    details: "Ada · Product Manager",
    badge: "To do",
  },
];

function Workspace() {
  return (
    <section
      id="build-together"
      className={styles.section}
      aria-labelledby="workspace-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow}>Build together. Show your work.</p>
        <div className={styles.intro}>
          <h2 id="workspace-title" className={styles.heading}>
            Keep the work moving.
            <br />
            Keep a record of your part.
          </h2>
          <p className={styles.description}>
            Bring tasks, milestones, updates and evidence into a shared
            workspace. Your dashboard keeps active work, invitations, blockers
            and upcoming tasks in view.
          </p>
        </div>

        <div className={styles.cards}>
          <article
            className={styles.workspaceCard}
            aria-label="Illustrative project workspace"
            aria-hidden="true"
          >
            <div className={styles.workspaceHeader}>
              <div>
                <p className={styles.workspaceLabel}>Project workspace</p>
                <h3>Campus Marketplace</h3>
              </div>
              <div className={styles.avatars}>
                <span>A</span>
                <span>D</span>
                <span>J</span>
              </div>
            </div>

            <div className={styles.tabs}>
              <span>Overview</span>
              <span className={styles.activeTab}>Tasks</span>
              <span>Updates</span>
              <span>Contributions</span>
            </div>

            <div className={styles.progressHeader}>
              <strong>Shared task progress</strong>
              <span>2 of 6 Done</span>
            </div>
            <div className={styles.progressTrack}>
              <span />
            </div>
            <div className={styles.milestone}>
              <span>Milestone · Working prototype</span>
              <strong>0 of 3 Done</strong>
            </div>

            <div className={styles.taskList}>
              {tasks.map(({ title, details, badge, blocked }) => (
                <div className={styles.task} key={title}>
                  <div>
                    <strong>{title}</strong>
                    <span>{details}</span>
                  </div>
                  <span
                    className={`${styles.taskBadge} ${blocked ? styles.blocked : ""}`}
                  >
                    {blocked && "! "}
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <div className={styles.contributionColumn}>
            <article
              className={styles.contributionCard}
              aria-label="Illustrative contribution record"
              aria-hidden="true"
            >
              <div className={styles.person}>
                <span className={styles.personAvatar}>D</span>
                <span>David · Designer</span>
              </div>
              <h3>Designed the onboarding flow</h3>
              <p className={styles.contributionText}>
                Prepared the account form and responsive layout draft for
                Campus Marketplace.
              </p>
              <div className={styles.file}>
                <ArrowUpRightIcon />
                <div>
                  <strong>onboarding-draft.fig</strong>
                  <span>Attached deliverable · Project evidence</span>
                </div>
              </div>
              <span className={styles.viewContribution}>View contribution</span>
            </article>
            <p className={styles.contributionNote}>
              <PaperclipIcon />
              <span>
                Record what you contributed and attach deliverables, so your
                work has context—not just a completed checkbox.
              </span>
            </p>
          </div>
        </div>

        <p className={styles.caption}>
          Illustrative workspace and contribution record
        </p>
      </div>
    </section>
  );
}

export default Workspace;
