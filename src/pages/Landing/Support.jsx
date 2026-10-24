import {
  BellIcon,
  HeartPulseIcon,
  SlidersIcon,
} from "../../components/Icons";
import styles from "./Support.module.css";

const notificationOptions = [
  { label: "Deadline reminders", checked: true },
  { label: "Weekly check-ins", checked: true },
  { label: "Role-released messages", checked: false },
];

function Support() {
  return (
    <section
      id="why-teamup"
      className={styles.section}
      aria-labelledby="support-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow}>A little structure. A lot of support.</p>
        <h2 id="support-title" className={styles.heading}>
          Built for people,
          <br />
          not just project plans.
        </h2>
        <p className={styles.description}>
          Stay in the loop, make room for honest check-ins, and choose how
          TeamUp fits into your week.
        </p>

        <div className={styles.cards}>
          <article className={`${styles.card} ${styles.greyCard}`}>
            <BellIcon />
            <h3>Stay in the loop</h3>
            <p>
              Keep invitations, join requests and role availability in view,
              with gentle reminders for deadlines and overdue work.
            </p>
            <div className={styles.mockStack} aria-hidden="true">
              <div className={styles.miniCard}>
                <span>Invitation</span>
                <p>You&apos;re invited to Student study planner.</p>
              </div>
              <div className={styles.miniCard}>
                <span>Deadline reminder</span>
                <p>Prototype review is due tomorrow. Need a hand?</p>
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.purpleCard}`}>
            <HeartPulseIcon />
            <h3>Check in, not check up</h3>
            <p>
              Weekly check-ins and shared team health make it easier to ask for
              support. No individual scores or rankings.
            </p>
            <div className={styles.checkInCard} aria-hidden="true">
              <span>Weekly check-in</span>
              <strong>How is the team doing?</strong>
              <p>
                What moved forward? What&apos;s next? Where would support help?
              </p>
            </div>
            <p className={styles.footnote}>
              Owner-only inactivity prompts encourage a friendly follow-up when
              a teammate may need help.
            </p>
          </article>

          <article className={`${styles.card} ${styles.greyCard}`}>
            <SlidersIcon />
            <h3>Make it your own</h3>
            <p>
              Keep your profile, goals and availability current. Choose each
              kind of in-app notification, and stay in control of your account.
            </p>
            <div className={styles.notificationCard} aria-hidden="true">
              <strong>Your notification choices</strong>
              {notificationOptions.map(({ label, checked }) => (
                <div className={styles.option} key={label}>
                  <span className={checked ? styles.checked : ""}>
                    {checked ? "✓" : ""}
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <p className={styles.footnote}>
              Account controls include sign-out and a reviewed, confirmed
              account deletion request.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Support;
