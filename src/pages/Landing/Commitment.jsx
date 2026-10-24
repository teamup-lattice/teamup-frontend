import { ClipboardCheckIcon, ShieldCheckIcon } from "../../components/Icons";
import styles from "./Commitment.module.css";

const commitmentDetails = [
  { label: "Role", value: "UI/UX Designer" },
  { label: "Weekly hours", value: "6 hours / week" },
  { label: "Duration", value: "6 weeks" },
  { label: "Deadlines", value: "Review project milestones" },
];

function Commitment() {
  return (
    <section
      className={styles.section}
      aria-labelledby="commitment-title"
    >
      <div className={styles.container}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Clarity before commitment</p>
          <h2 id="commitment-title" className={styles.heading}>
            Know what you&apos;re
            <br />
            saying yes to.
          </h2>
          <p className={styles.description}>
            Review the role, weekly hours, duration and deadlines before
            joining. Workspace access begins only after you&apos;ve reviewed and
            saved your acceptance.
          </p>
          <p className={styles.assurance}>
            <ShieldCheckIcon />
            <span>Creating an account doesn&apos;t join you to a project.</span>
          </p>
        </div>

        <div className={styles.panel} aria-hidden="true">
          <div className={styles.panelHeading}>
            <h3>Your commitment, made clear</h3>
            <ClipboardCheckIcon />
          </div>
          <dl className={styles.details}>
            {commitmentDetails.map(({ label, value }) => (
              <div className={styles.detailRow} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.panelNote}>
            Review first. Accept when you&apos;re ready to commit.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Commitment;
